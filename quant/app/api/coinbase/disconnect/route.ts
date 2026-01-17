/**
 * Coinbase Disconnect API Route
 *
 * POST /api/coinbase/disconnect - Disconnect Coinbase account
 *
 * This clears the Coinbase tokens from the session
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-auth";

export const POST = withAuth(async () => {
  try {
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
});
