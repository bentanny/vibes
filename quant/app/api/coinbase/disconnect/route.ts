/**
 * Coinbase Disconnect API Route
 * 
 * POST /api/coinbase/disconnect - Disconnect Coinbase account
 * 
 * This clears the Coinbase tokens from the session
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // To properly disconnect, we need to clear the Coinbase tokens from the JWT
    // This is done by clearing the session cookie and letting it regenerate
    // without the Coinbase tokens
    
    // Note: In a production app with a database, you would:
    // 1. Delete the Coinbase tokens from the database
    // 2. Optionally revoke the token with Coinbase API
    
    // For now, we'll return success and the client will handle
    // clearing the session
    
    const cookieStore = await cookies();
    
    // Get the session token cookie name (NextAuth uses different names in dev/prod)
    const sessionCookieName = process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    // Delete the session cookie to force re-authentication
    cookieStore.delete(sessionCookieName);

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

