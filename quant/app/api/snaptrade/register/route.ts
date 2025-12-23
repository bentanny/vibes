/**
 * SnapTrade User Registration API Route
 * 
 * POST /api/snaptrade/register - Register a user with SnapTrade
 * 
 * This creates a SnapTrade user ID and secret for the current user.
 * These credentials are stored in cookies for subsequent API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseUser, getFirebaseUserFromCookies } from "@/lib/api-auth";
import { registerSnapTradeUser } from "@/lib/snaptrade";

// Encrypt credentials for cookie storage
function encryptCredentials(userId: string, userSecret: string): string {
  const data = JSON.stringify({ userId, userSecret });
  return Buffer.from(data).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase Auth
    let user = await getFirebaseUser(request);
    if (!user) {
      const cookieStore = await cookies();
      user = await getFirebaseUserFromCookies(cookieStore);
    }

    if (!user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Use the user's email as a unique identifier
    const uniqueId = `quant_${user.email.replace(/[^a-zA-Z0-9]/g, "_")}`;

    // Register the user with SnapTrade
    const snapTradeUser = await registerSnapTradeUser(uniqueId);

    // Store credentials in HTTP-only cookies
    const encryptedCreds = encryptCredentials(
      snapTradeUser.userId,
      snapTradeUser.userSecret
    );
    
    const cookieStore = await cookies();
    cookieStore.set("snaptrade_creds", encryptedCreds, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Successfully registered with SnapTrade",
      userId: snapTradeUser.userId,
    });
  } catch (error) {
    console.error("SnapTrade registration error:", error);

    // If user already exists, that's fine
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({
        success: true,
        message: "User already registered",
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register with SnapTrade" },
      { status: 500 }
    );
  }
}

