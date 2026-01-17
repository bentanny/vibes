/**
 * Coinbase Payment Methods API Route
 *
 * GET /api/coinbase/payment-methods - Get available payment methods
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-auth";
import { CoinbaseClient } from "@/lib/coinbase";

export const GET = withAuth(async () => {
  try {
    // Get Coinbase access token from cookies
    const cookieStore = await cookies();
    const coinbaseToken = cookieStore.get("coinbase_access_token")?.value;

    if (!coinbaseToken) {
      return NextResponse.json(
        { error: "Coinbase not connected - Please link your Coinbase account" },
        { status: 403 }
      );
    }

    const client = new CoinbaseClient(coinbaseToken);
    const paymentMethods = await client.getPaymentMethods();

    return NextResponse.json({
      success: true,
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        name: pm.name,
        currency: pm.currency,
        primaryBuy: pm.primary_buy,
        primarySell: pm.primary_sell,
        instantBuy: pm.instant_buy,
        instantSell: pm.instant_sell,
        allowBuy: pm.allow_buy,
        allowSell: pm.allow_sell,
        verified: pm.verified,
        limits: pm.limits,
      })),
    });
  } catch (error) {
    console.error("Coinbase payment methods error:", error);

    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
});
