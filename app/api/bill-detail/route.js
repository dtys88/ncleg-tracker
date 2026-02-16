import { NextResponse } from "next/server";

export const revalidate = 600; // 10 min cache

function parseSponsors(html) {
  const sponsors = [];
  const sponsorSection = html.match(/Sponsors:[\s\S]*?(?=Attributes:|Keywords:|Counties:|$)/i);
  if (!sponsorSection) return sponsors;

  const text = sponsorSection[0];
  // Match linked sponsor names: [Name](/Members/Biography/H/123)
  const matches = [...text.matchAll(/\[([^\]]+)\]\(\/Members\/Biography\/([HS])\/(\d+)\)/g)];
  
  let isPrimary = true;
  for (const m of matches) {
    sponsors.push({
      name: m[1].trim(),
      chamber: m[2] === "H" ? "House" : "Senate",
      memberId: m[3],
      primary: isPrimary,
      profileUrl: `https://www.ncleg.gov/Members/Biography/${m[2]}/${m[3]}`,
    });
    // After "(Primary)" marker, subsequent sponsors are co-sponsors
    const idx = text.indexOf(m[0]);
    const before = text.substring(0, idx + m[0].length);
    if (before.includes("(Primary)")) isPrimary = false;
  }
  return sponsors;
}

function parseHistory(html) {
  const actions = [];
  // Match history table rows
  const historySection = html.match(/History[\s\S]*?(<table|Date[\s\S]*?Chamber[\s\S]*?Action)/i);
  if (!historySection) return actions;

  // Pattern for each history entry in the bill detail page
  const rows = [...html.matchAll(/Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})[\s\S]*?Chamber:\s*(House|Senate)[\s\S]*?Action:\s*([\s\S]*?)(?=Documents:|Date:|$)/gi)];
  
  for (const row of rows) {
    const action = row[3].trim()
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/Documents:.*$/i, "")
      .trim();
    
    if (action) {
      actions.push({
        date: row[1].trim(),
        chamber: row[2].trim(),
        action,
      });
    }
  }
  return actions;
}

function parseVotes(html) {
  const votes = [];
  const voteMatches = [...html.matchAll(/Date:\s*(\d{1,2}\/\d{1,2}\/\d{4}[^]*?)Subject:\s*([^\n]+)[\s\S]*?Aye:\s*(\d+)[\s\S]*?No:\s*(\d+)[\s\S]*?Result:\s*\[([^\]]+)\]/gi)];
  
  for (const v of voteMatches) {
    votes.push({
      date: v[1].trim().split("\n")[0].trim(),
      subject: v[2].trim(),
      aye: parseInt(v[3]),
      no: parseInt(v[4]),
      result: v[5].trim(),
    });
  }
  return votes;
}

function parseKeywords(html) {
  const match = html.match(/Keywords:\s*\n*([\s\S]*?)(?=######|$)/i);
  if (!match) return [];
  return match[1]
    .split(/[;\n]/)
    .map((k) => k.trim())
    .filter((k) => k && !k.startsWith("#"));
}

function parseAttributes(html) {
  const match = html.match(/Attributes:\s*\n*(.*?)(?=\n\n|Counties:|Statutes:|Keywords:)/is);
  if (!match) return "";
  return match[1].trim();
}

function parseBillTitle(html) {
  // Full bill title from the page heading
  const match = html.match(/(?:House|Senate)\s+Bill\s+\d+\s*\n*\[([^\]]+)\]/i);
  return match ? match[1].trim() : "";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bill = searchParams.get("bill"); // e.g., "H2" or "S257"

  if (!bill) {
    return NextResponse.json({ success: false, error: "Bill parameter required (e.g., ?bill=H2)" }, { status: 400 });
  }

  const billLookupUrl = `https://www.ncleg.gov/BillLookup/2025/${bill}`;

  try {
    // Fetch the bill detail page
    const detailRes = await fetch(billLookupUrl, {
      headers: { "User-Agent": "NCLegTracker/1.0" },
      next: { revalidate: 600 },
    });

    if (!detailRes.ok) {
      throw new Error(`Bill page returned ${detailRes.status}`);
    }

    const html = await detailRes.text();

    // Parse all available data from the page
    const sponsors = parseSponsors(html);
    const history = parseHistory(html);
    const votes = parseVotes(html);
    const keywords = parseKeywords(html);
    const attributes = parseAttributes(html);
    const fullTitle = parseBillTitle(html);

    // Check for bill summary link
    const summaryLinkMatch = html.match(/\/Legislation\/Bills\/Summaries\/2025\/[^\s"')]+/);
    let summary = null;

    // Try to fetch bill digest (these are concise official summaries)
    try {
      const digestUrl = `https://webservices.ncleg.gov/BillDigests/2025/${bill}`;
      const digestRes = await fetch(digestUrl, {
        headers: { "User-Agent": "NCLegTracker/1.0" },
        next: { revalidate: 600 },
      });
      if (digestRes.ok) {
        const digestText = await digestRes.text();
        // The digest endpoint returns HTML or text with the summary
        if (digestText && digestText.length > 50 && !digestText.includes("<!DOCTYPE")) {
          summary = digestText.trim();
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      bill: bill.toUpperCase(),
      fullTitle,
      attributes,
      sponsors,
      history,
      votes,
      keywords,
      summary,
      billUrl: billLookupUrl,
      summaryUrl: summaryLinkMatch ? `https://www.ncleg.gov${summaryLinkMatch[0]}` : null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[Bill Detail API] Error fetching ${bill}:`, error.message);
    return NextResponse.json(
      { success: false, error: error.message, bill },
      { status: 502 }
    );
  }
}
