/**
 * Coinbase Payment Methods API Route
 * 
 * GET /api/coinbase/payment-methods - Get available payment methods
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CoinbaseClient } from "@/lib/coinbase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!session.coinbase?.accessToken) {
      return NextResponse.json(
        { error: "Coinbase not connected - Please link your Coinbase account" },
        { status: 403 }
      );
    }

    const client = new CoinbaseClient(session.coinbase.accessToken);
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
}

