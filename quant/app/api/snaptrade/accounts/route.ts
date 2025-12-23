/**
 * SnapTrade Accounts API Route
 * 
 * GET /api/snaptrade/accounts - Get user's connected brokerage accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseUser, getFirebaseUserFromCookies } from "@/lib/api-auth";
import { getAccounts } from "@/lib/snaptrade";

function decryptCredentials(encrypted: string): { userId: string; userSecret: string } | null {
  try {
    const data = Buffer.from(encrypted, "base64").toString("utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase Auth
    let user = await getFirebaseUser(request);
    if (!user) {
      const cookieStore = await cookies();
      user = await getFirebaseUserFromCookies(cookieStore);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get stored credentials
    const cookieStore = await cookies();
    const encryptedCreds = cookieStore.get("snaptrade_creds")?.value;

    if (!encryptedCreds) {
      return NextResponse.json(
        { error: "SnapTrade not connected - Please link your brokerage" },
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

    // Fetch accounts
    const accounts = await getAccounts(credentials.userId, credentials.userSecret);

    return NextResponse.json({
      success: true,
      accounts,
      totalAccounts: accounts.length,
    });
  } catch (error) {
    console.error("SnapTrade accounts error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

