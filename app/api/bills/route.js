import { NextResponse } from "next/server";
import { SESSION_YEAR, NCLEG_BASE } from "@/lib/constants";
import { parseRSSBills } from "@/lib/parser";

// Revalidate every 5 minutes on Vercel edge cache
export const revalidate = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const feed = searchParams.get("feed") || "all";
  const chamber = searchParams.get("chamber") || "H";
  const date = searchParams.get("date") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  let url;

  switch (feed) {
    case "all":
      // All bills with last action
      url = `${NCLEG_BASE}/Legislation/Bills/LastActionByYear/${SESSION_YEAR}/All/RSS`;
      break;
    case "filed":
      // Bills filed by chamber (no date = all filed)
      url = date
        ? `${NCLEG_BASE}/Legislation/Bills/FiledByDay/${SESSION_YEAR}/${chamber}/${date}/RSS`
        : `${NCLEG_BASE}/Legislation/Bills/FiledBillsFeed/${SESSION_YEAR}/${chamber}`;
      break;
    case "actions":
      // Bills with actions in date range
      if (startDate && endDate) {
        url = `${NCLEG_BASE}/Legislation/Bills/ChamberActionsByDay/${SESSION_YEAR}/${chamber}/${startDate}/${endDate}/RSS`;
      } else {
        url = `${NCLEG_BASE}/Legislation/Bills/WithAction/${SESSION_YEAR}/Any/B/RSS`;
      }
      break;
    case "calendar":
      // Bills on calendar
      url = date
        ? `${NCLEG_BASE}/Calendars/BillsOnCalendarFeed/${SESSION_YEAR}/${chamber}/${date}`
        : `${NCLEG_BASE}/Legislation/Bills/LastActionByYear/${SESSION_YEAR}/All/RSS`;
      break;
    case "chaptered":
      url = `${NCLEG_BASE}/Legislation/Bills/LastActionByYear/${SESSION_YEAR}/All/Chaptered/RSS`;
      break;
    case "keyword":
      url = `${NCLEG_BASE}/Legislation/Bills/ByKeyword/${SESSION_YEAR}/All/RSS`;
      break;
    case "governor-pending":
      url = `${NCLEG_BASE}/Legislation/Bills/PendingGovernorSignature/${SESSION_YEAR}/RSS`;
      break;
    case "governor-signed":
      url = `${NCLEG_BASE}/Legislation/Bills/WithAction/${SESSION_YEAR}/400/RSS`;
      break;
    case "governor-vetoed":
      // Bills vetoed
      url = `${NCLEG_BASE}/Legislation/Bills/WithAction/${SESSION_YEAR}/500/RSS`;
      break;
    default:
      url = `${NCLEG_BASE}/Legislation/Bills/LastActionByYear/${SESSION_YEAR}/All/RSS`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NCLegTracker/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`NCGA API returned ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const bills = parseRSSBills(xmlText);

    return NextResponse.json({
      success: true,
      feed,
      count: bills.length,
      fetchedAt: new Date().toISOString(),
      source: url,
      bills,
    });
  } catch (error) {
    console.error(`[Bills API] Error fetching ${feed}:`, error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        feed,
        source: url,
      },
      { status: 502 }
    );
  }
}
