/**
 * Claim Session API Route
 *
 * POST /api/claim-session
 *
 * Called when a user logs in to claim any resources (strategies, threads)
 * created during their anonymous session and assign them to their account.
 */

import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/api-auth";

const VIBE_TRADE_API_URL =
  process.env.VIBE_TRADE_API_URL ||
  "https://vibe-trade-mcp-kff5sbwvca-uc.a.run.app";

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase Auth - required for this endpoint
    const user = await getFirebaseUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Call the backend API to claim the session
    // This will update all strategies with matching session_id to have owner_id = user.uid
    const response = await fetch(`${VIBE_TRADE_API_URL}/api/claim-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the auth token to the backend
        Authorization: request.headers.get("authorization") || "",
      },
      body: JSON.stringify({
        session_id,
        user_id: user.uid,
      }),
    });

    if (!response.ok) {
      // If the backend doesn't have this endpoint yet, that's OK
      // Just return success with 0 claimed
      if (response.status === 404) {
        console.log(
          "Backend claim-session endpoint not implemented yet, skipping"
        );
        return NextResponse.json({
          success: true,
          claimed: 0,
          message: "Backend endpoint not available",
        });
      }

      const error = await response.text();
      console.error("Backend claim-session error:", error);
      return NextResponse.json(
        { error: "Failed to claim session" },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      claimed: result.claimed || 0,
      strategies: result.strategies || [],
    });
  } catch (error) {
    console.error("Claim session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
