/**
 * SnapTrade Connection Portal API Route
 * 
 * GET /api/snaptrade/connect - Get the connection portal URL
 * 
 * Returns a URL that redirects users to SnapTrade's connection portal
 * where they can link their brokerage accounts.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getConnectionPortalUrl, registerSnapTradeUser } from "@/lib/snaptrade";

function decryptCredentials(encrypted: string): { userId: string; userSecret: string } | null {
  try {
    const data = Buffer.from(encrypted, "base64").toString("utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function encryptCredentials(userId: string, userSecret: string): string {
  const data = JSON.stringify({ userId, userSecret });
  return Buffer.from(data).toString("base64");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get optional parameters
    const { searchParams } = new URL(request.url);
    const broker = searchParams.get("broker") || undefined;
    const redirectUrl = searchParams.get("redirect") || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings?connected=true`;

    // Get or create SnapTrade credentials
    const cookieStore = await cookies();
    let encryptedCreds = cookieStore.get("snaptrade_creds")?.value;
    let credentials: { userId: string; userSecret: string } | null = null;

    if (encryptedCreds) {
      credentials = decryptCredentials(encryptedCreds);
    }

    // If no credentials, register the user first
    if (!credentials) {
      const uniqueId = `quant_${session.user.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
      
      try {
        const snapTradeUser = await registerSnapTradeUser(uniqueId);
        credentials = {
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
        };
        
        // Store credentials
        encryptedCreds = encryptCredentials(credentials.userId, credentials.userSecret);
        cookieStore.set("snaptrade_creds", encryptedCreds, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
        });
      } catch (error) {
        console.error("Failed to register SnapTrade user:", error);
        return NextResponse.json(
          { error: "Failed to initialize SnapTrade connection" },
          { status: 500 }
        );
      }
    }

    // Get the connection portal URL
    const portalUrl = await getConnectionPortalUrl(
      credentials.userId,
      credentials.userSecret,
      {
        broker,
        immediateRedirect: true,
        customRedirect: redirectUrl,
        connectionType: "trade", // Enable trading
      }
    );

    return NextResponse.json({
      success: true,
      url: portalUrl,
    });
  } catch (error) {
    console.error("SnapTrade connect error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get connection URL" },
      { status: 500 }
    );
  }
}

