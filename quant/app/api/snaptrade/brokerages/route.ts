/**
 * SnapTrade Brokerages API Route
 * 
 * GET /api/snaptrade/brokerages - Get list of supported brokerages
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBrokerages } from "@/lib/snaptrade";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const brokerages = await getBrokerages();

    // Filter to only show active brokerages that allow trading
    const tradingBrokerages = brokerages.filter((b) => b.isActive && b.allowsTrading);
    const readOnlyBrokerages = brokerages.filter((b) => b.isActive && !b.allowsTrading);

    return NextResponse.json({
      success: true,
      brokerages: {
        trading: tradingBrokerages,
        readOnly: readOnlyBrokerages,
      },
      total: brokerages.length,
    });
  } catch (error) {
    console.error("SnapTrade brokerages error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch brokerages" },
      { status: 500 }
    );
  }
}

