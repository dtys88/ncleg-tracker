import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours — members rarely change

// Parse member list HTML into structured JSON
function parseMemberListHTML(html, chamber) {
  const members = [];

  // Match each member block — the HTML uses a consistent card pattern
  // Pattern: MemberImage link, name link, party, district, counties, office, phone, assistant
  const memberPattern =
    /Members\/Biography\/[HS]\/(\d+).*?\[([^\]]+)\]\(\/Members\/Biography\/[HS]\/\d+\)\s*\(([RD])\).*?District\s+(\d+).*?(?:\[([^\]]*)\].*?)?Office.*?Rm\.\s*([^\n*]*?)[\n*].*?Phone.*?([\d-]+)/gs;

  // Simpler approach: split by member image blocks
  const blocks = html.split(/\[!\[Headshot of/);

  for (const block of blocks) {
    if (!block.includes("Members/Biography")) continue;

    // Extract member ID
    const idMatch = block.match(/Members\/Biography\/[HS]\/(\d+)/);
    if (!idMatch) continue;
    const id = idMatch[1];

    // Extract name — appears as [Name](/Members/Biography/...)
    const nameMatch = block.match(
      /\[([^\]]+)\]\(\/Members\/Biography\/[HS]\/\d+\)/
    );
    const name = nameMatch ? nameMatch[1].trim() : "";

    // Extract party
    const partyMatch = block.match(/\(([RD])\)/);
    const party = partyMatch ? partyMatch[1] : "";

    // Extract district
    const districtMatch = block.match(/District\s+(\d+)/);
    const district = districtMatch ? districtMatch[1] : "";

    // Extract counties — appears as [CountyName](/Members/CountyRepresentation/...)
    const countyMatches = [
      ...block.matchAll(/\[([^\]]+)\]\(\/Members\/CountyRepresentation\/[^\)]+\)/g),
    ];
    const counties = countyMatches.map((m) => m[1]);

    // Extract office room
    const officeMatch = block.match(
      /\*\*Office\*\*:\s*Rm\.\s*([^\n*]+)/
    );
    const office = officeMatch ? `Rm. ${officeMatch[1].trim()}` : "";

    // Extract phone
    const phoneMatch = block.match(
      /\*\*Phone\*\*:\s*([\d()-\s]+)/
    );
    const phone = phoneMatch ? phoneMatch[1].trim() : "";

    // Extract assistant
    const assistantMatch = block.match(
      /\*\*Assistant\*\*:\s*([^\n*]+)/
    );
    const assistant = assistantMatch ? assistantMatch[1].trim() : "";

    if (name) {
      members.push({
        id,
        name,
        party: party === "R" ? "Republican" : "Democrat",
        partyCode: party,
        chamber,
        chamberCode: chamber === "House" ? "H" : "S",
        district: parseInt(district) || 0,
        counties,
        office,
        phone,
        assistant,
        photoUrl: `https://www.ncleg.gov/Members/MemberImage/${chamber === "House" ? "H" : "S"}/${id}/Low`,
        profileUrl: `https://www.ncleg.gov/Members/Biography/${chamber === "House" ? "H" : "S"}/${id}`,
        committeesUrl: `https://www.ncleg.gov/Members/Committees/${chamber === "House" ? "H" : "S"}/${id}`,
        votesUrl: `https://www.ncleg.gov/Members/Votes/${chamber === "House" ? "H" : "S"}/${id}`,
        billsUrl: `https://www.ncleg.gov/Members/IntroducedBills/${chamber === "House" ? "H" : "S"}/${id}`,
      });
    }
  }

  return members;
}

// Alternative: parse the simpler table view
function parseMemberTableHTML(html, chamber) {
  const members = [];
  // Match table rows with member data
  // Each row has: name (linked), party, district, counties, phone
  const rowPattern =
    /<tr[^>]*>[\s\S]*?Biography\/([HS])\/(\d+)[^>]*>([^<]+)<[\s\S]*?<\/tr>/g;

  let match;
  while ((match = rowPattern.exec(html)) !== null) {
    const chamberCode = match[1];
    const id = match[2];
    const name = match[3].trim();

    // Try to extract other fields from the same row
    const rowHtml = match[0];

    const partyMatch = rowHtml.match(/\(([RD])\)/);
    const districtMatch = rowHtml.match(/District\s*(\d+)/);
    const phoneMatch = rowHtml.match(
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/
    );

    members.push({
      id,
      name,
      party: partyMatch
        ? partyMatch[1] === "R"
          ? "Republican"
          : "Democrat"
        : "",
      partyCode: partyMatch ? partyMatch[1] : "",
      chamber,
      chamberCode,
      district: districtMatch ? parseInt(districtMatch[1]) : 0,
      counties: [],
      office: "",
      phone: phoneMatch ? phoneMatch[1] : "",
      assistant: "",
      photoUrl: `https://www.ncleg.gov/Members/MemberImage/${chamberCode}/${id}/Low`,
      profileUrl: `https://www.ncleg.gov/Members/Biography/${chamberCode}/${id}`,
      committeesUrl: `https://www.ncleg.gov/Members/Committees/${chamberCode}/${id}`,
      votesUrl: `https://www.ncleg.gov/Members/Votes/${chamberCode}/${id}`,
      billsUrl: `https://www.ncleg.gov/Members/IntroducedBills/${chamberCode}/${id}`,
    });
  }

  return members;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const chamber = searchParams.get("chamber") || "all"; // "house", "senate", or "all"

  try {
    const fetches = [];

    if (chamber === "all" || chamber === "house") {
      fetches.push(
        fetch("https://www.ncleg.gov/Members/MemberList/H", {
          headers: { "User-Agent": "NCLegTracker/1.0" },
          next: { revalidate: 86400 },
        }).then(async (res) => ({
          chamber: "House",
          html: await res.text(),
          ok: res.ok,
        }))
      );
    }

    if (chamber === "all" || chamber === "senate") {
      fetches.push(
        fetch("https://www.ncleg.gov/Members/MemberList/S", {
          headers: { "User-Agent": "NCLegTracker/1.0" },
          next: { revalidate: 86400 },
        }).then(async (res) => ({
          chamber: "Senate",
          html: await res.text(),
          ok: res.ok,
        }))
      );
    }

    const results = await Promise.allSettled(fetches);
    let allMembers = [];

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.ok) {
        const parsed = parseMemberListHTML(
          result.value.html,
          result.value.chamber
        );
        allMembers.push(...parsed);
      }
    }

    // Sort by name
    allMembers.sort((a, b) => {
      const lastA = a.name.split(" ").pop();
      const lastB = b.name.split(" ").pop();
      return lastA.localeCompare(lastB);
    });

    const summary = {
      total: allMembers.length,
      house: allMembers.filter((m) => m.chamber === "House").length,
      senate: allMembers.filter((m) => m.chamber === "Senate").length,
      republican: allMembers.filter((m) => m.partyCode === "R").length,
      democrat: allMembers.filter((m) => m.partyCode === "D").length,
    };

    return NextResponse.json({
      success: true,
      fetchedAt: new Date().toISOString(),
      summary,
      members: allMembers,
    });
  } catch (error) {
    console.error("[Members API] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 502 }
    );
  }
}
