/**
 * Coinbase Prices API Route
 * 
 * GET /api/coinbase/prices?pairs=BTC-USD,ETH-USD - Get spot prices
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseUser, getFirebaseUserFromCookies } from "@/lib/api-auth";
import { CoinbaseClient } from "@/lib/coinbase";

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

    // Get Coinbase access token from cookies
    const cookieStore = await cookies();
    const coinbaseToken = cookieStore.get("coinbase_access_token")?.value;

    if (!coinbaseToken) {
      return NextResponse.json(
        { error: "Coinbase not connected - Please link your Coinbase account" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pairsParam = searchParams.get("pairs") || "BTC-USD,ETH-USD";
    const pairs = pairsParam.split(",").map((p) => p.trim());

    const client = new CoinbaseClient(coinbaseToken);

    // Fetch prices for all requested pairs in parallel
    const pricePromises = pairs.map(async (pair) => {
      try {
        const [spot, buy, sell] = await Promise.all([
          client.getSpotPrice(pair),
          client.getBuyPrice(pair),
          client.getSellPrice(pair),
        ]);

        return {
          pair,
          spot: spot.amount,
          buy: buy.amount,
          sell: sell.amount,
          currency: spot.currency,
          base: pair.split("-")[0],
        };
      } catch (error) {
        console.error(`Failed to fetch price for ${pair}:`, error);
        return {
          pair,
          error: "Failed to fetch price",
        };
      }
    });

    const prices = await Promise.all(pricePromises);

    return NextResponse.json({
      success: true,
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Coinbase prices error:", error);

    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

