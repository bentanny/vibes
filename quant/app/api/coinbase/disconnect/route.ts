/**
 * Coinbase Disconnect API Route
 * 
 * POST /api/coinbase/disconnect - Disconnect Coinbase account
 * 
 * This clears the Coinbase tokens from the session
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseUser, getFirebaseUserFromCookies } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase Auth
    let user = await getFirebaseUser(request);
    if (!user) {
      const cookieStore = await cookies();
      user = await getFirebaseUserFromCookies(cookieStore);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clear Coinbase tokens from cookies
    const cookieStore = await cookies();
    cookieStore.delete("coinbase_access_token");
    cookieStore.delete("coinbase_refresh_token");

    return NextResponse.json({
      success: true,
      message: "Coinbase disconnected successfully",
    });
  } catch (error) {
    console.error("Coinbase disconnect error:", error);

    return NextResponse.json(
      { error: "Failed to disconnect Coinbase" },
      { status: 500 }
    );
  }
}

