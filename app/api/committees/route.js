import { NextResponse } from "next/server";
import { SESSION_YEAR, API_BASE } from "@/lib/constants";

export const revalidate = 3600; // Cache for 1 hour — committees don't change often

export async function GET() {
  const url = `${API_BASE}/AllActiveCommittees/${SESSION_YEAR}/true`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NCLegTracker/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`NCGA API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Categorize committees
    const standing = data.filter((c) => !c.bNonStandingCommittee);
    const nonStanding = data.filter((c) => c.bNonStandingCommittee);
    const house = data.filter((c) => c.sChamberCode === "H");
    const senate = data.filter((c) => c.sChamberCode === "S");
    const joint = data.filter((c) => c.sChamberCode === "N");

    return NextResponse.json({
      success: true,
      count: data.length,
      fetchedAt: new Date().toISOString(),
      summary: {
        total: data.length,
        standing: standing.length,
        nonStanding: nonStanding.length,
        house: house.length,
        senate: senate.length,
        joint: joint.length,
      },
      committees: data,
    });
  } catch (error) {
    console.error("[Committees API] Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 502 }
    );
  }
}
