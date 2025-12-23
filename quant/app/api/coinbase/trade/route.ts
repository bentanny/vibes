/**
 * Coinbase Trade API Route
 * 
 * POST /api/coinbase/trade - Execute a buy or sell order
 * 
 * Request body:
 * {
 *   action: "buy" | "sell",
 *   accountId: string,        // The wallet to trade with
 *   amount: string,           // Amount to trade
 *   currency: string,         // Currency code (e.g., "USD" for buys, "BTC" for sells)
 *   paymentMethodId?: string, // Optional payment method
 *   commit?: boolean          // If true, execute immediately (default: false for preview)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseUser, getFirebaseUserFromCookies } from "@/lib/api-auth";
import { CoinbaseClient } from "@/lib/coinbase";

interface TradeRequest {
  action: "buy" | "sell";
  accountId: string;
  amount: string;
  currency: string;
  paymentMethodId?: string;
  commit?: boolean;
}

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
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // TODO: Get Coinbase access token from Firestore or secure storage
    // For now, check cookies for Coinbase token (temporary solution)
    const cookieStore = await cookies();
    const coinbaseToken = cookieStore.get("coinbase_access_token")?.value;

    if (!coinbaseToken) {
      return NextResponse.json(
        { error: "Coinbase not connected - Please link your Coinbase account" },
        { status: 403 }
      );
    }

    const body: TradeRequest = await request.json();
    const { action, accountId, amount, currency, paymentMethodId, commit = false } = body;

    // Validate required fields
    if (!action || !["buy", "sell"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action - must be 'buy' or 'sell'" },
        { status: 400 }
      );
    }

    if (!accountId || !amount || !currency) {
      return NextResponse.json(
        { error: "Missing required fields: accountId, amount, currency" },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const client = new CoinbaseClient(coinbaseToken);

    let order;
    if (action === "buy") {
      order = await client.createBuy(
        accountId,
        amount,
        currency,
        paymentMethodId,
        commit
      );
    } else {
      order = await client.createSell(
        accountId,
        amount,
        currency,
        paymentMethodId,
        commit
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        action,
        amount: order.amount,
        total: order.total,
        subtotal: order.subtotal,
        fee: order.fee,
        committed: order.committed,
        instant: order.instant,
        createdAt: order.created_at,
      },
      message: commit 
        ? `${action.charAt(0).toUpperCase() + action.slice(1)} order executed successfully` 
        : `${action.charAt(0).toUpperCase() + action.slice(1)} order preview created. Call with commit=true to execute.`,
    });
  } catch (error) {
    console.error("Coinbase trade error:", error);

    if (error instanceof Error) {
      // Handle specific Coinbase API errors
      if (error.message.includes("insufficient")) {
        return NextResponse.json(
          { error: "Insufficient funds for this trade" },
          { status: 400 }
        );
      }
      if (error.message.includes("minimum")) {
        return NextResponse.json(
          { error: "Amount is below the minimum trade limit" },
          { status: 400 }
        );
      }
      if (error.message.includes("token")) {
        return NextResponse.json(
          { error: "Coinbase session expired - Please reconnect your account" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to execute trade" },
      { status: 500 }
    );
  }
}

/**
 * Commit a previously created order
 * 
 * PUT /api/coinbase/trade
 * {
 *   action: "buy" | "sell",
 *   accountId: string,
 *   orderId: string
 * }
 */
export async function PUT(request: NextRequest) {
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

    // TODO: Get Coinbase access token from Firestore or secure storage
    const cookieStore = await cookies();
    const coinbaseToken = cookieStore.get("coinbase_access_token")?.value;

    if (!coinbaseToken) {
      return NextResponse.json(
        { error: "Coinbase not connected" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, accountId, orderId } = body;

    if (!action || !accountId || !orderId) {
      return NextResponse.json(
        { error: "Missing required fields: action, accountId, orderId" },
        { status: 400 }
      );
    }

    const client = new CoinbaseClient(coinbaseToken);

    let order;
    if (action === "buy") {
      order = await client.commitBuy(accountId, orderId);
    } else {
      order = await client.commitSell(accountId, orderId);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        action,
        amount: order.amount,
        total: order.total,
        subtotal: order.subtotal,
        fee: order.fee,
        committed: order.committed,
      },
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} order committed successfully`,
    });
  } catch (error) {
    console.error("Coinbase commit error:", error);

    return NextResponse.json(
      { error: "Failed to commit trade" },
      { status: 500 }
    );
  }
}

