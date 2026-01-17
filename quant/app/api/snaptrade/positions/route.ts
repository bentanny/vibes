/**
 * SnapTrade Positions API Route
 *
 * GET /api/snaptrade/positions?accountId=xxx - Get positions for an account
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-auth";
import { getPositions, getBalances } from "@/lib/snaptrade";

function decryptCredentials(
  encrypted: string
): { userId: string; userSecret: string } | null {
  try {
    const data = Buffer.from(encrypted, "base64").toString("utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Get stored credentials
    const cookieStore = await cookies();
    const encryptedCreds = cookieStore.get("snaptrade_creds")?.value;

    if (!encryptedCreds) {
      return NextResponse.json(
        { error: "SnapTrade not connected" },
        { status: 403 }
      );
    }

    const credentials = decryptCredentials(encryptedCreds);
    if (!credentials) {
      return NextResponse.json(
        { error: "Invalid stored credentials" },
        { status: 403 }
      );
    }

    // Get account ID from query params
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Fetch positions and balances in parallel
    const [positions, balances] = await Promise.all([
      getPositions(credentials.userId, credentials.userSecret, accountId),
      getBalances(credentials.userId, credentials.userSecret, accountId),
    ]);

    return NextResponse.json({
      success: true,
      positions,
      balances,
    });
  } catch (error) {
    console.error("SnapTrade positions error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch positions",
      },
      { status: 500 }
    );
  }
});
