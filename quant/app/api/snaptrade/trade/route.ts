/**
 * SnapTrade Trade API Route
 *
 * POST /api/snaptrade/trade - Execute a trade
 *
 * Request body:
 * {
 *   accountId: string,
 *   symbol: string,          // e.g., "AAPL", "MSFT"
 *   action: "BUY" | "SELL",
 *   quantity: number,
 *   orderType?: "MARKET" | "LIMIT",
 *   limitPrice?: number,     // Required for limit orders
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-auth";
import { placeMarketOrder, placeLimitOrder } from "@/lib/snaptrade";

function decryptCredentials(
  encrypted: string
): { userId: string; userSecret: string } | null {
  try {
    const data = Buffer.from(encrypted, "base64").toString("utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Get stored credentials
    const cookieStore = await cookies();
    const encryptedCreds = cookieStore.get("snaptrade_creds")?.value;

    if (!encryptedCreds) {
      return NextResponse.json(
        { error: "SnapTrade not connected - Please link your brokerage" },
        { status: 403 }
      );
    }

    const credentials = decryptCredentials(encryptedCreds);
    if (!credentials) {
      return NextResponse.json(
        { error: "Invalid stored credentials" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      accountId,
      symbol,
      action,
      quantity,
      orderType = "MARKET",
      limitPrice,
    } = body;

    // Validate required fields
    if (!accountId || !symbol || !action || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: accountId, symbol, action, quantity" },
        { status: 400 }
      );
    }

    if (!["BUY", "SELL"].includes(action.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid action - must be 'BUY' or 'SELL'" },
        { status: 400 }
      );
    }

    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }

    // Validate limit orders have a price
    if (orderType.toUpperCase() === "LIMIT" && !limitPrice) {
      return NextResponse.json(
        { error: "limitPrice is required for limit orders" },
        { status: 400 }
      );
    }

    // Execute the trade
    let order;
    if (orderType.toUpperCase() === "LIMIT") {
      order = await placeLimitOrder(
        credentials.userId,
        credentials.userSecret,
        accountId,
        symbol.toUpperCase(),
        action.toUpperCase() as "BUY" | "SELL",
        numQuantity,
        parseFloat(limitPrice)
      );
    } else {
      order = await placeMarketOrder(
        credentials.userId,
        credentials.userSecret,
        accountId,
        symbol.toUpperCase(),
        action.toUpperCase() as "BUY" | "SELL",
        numQuantity
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: `${action} order for ${quantity} shares of ${symbol} placed successfully`,
    });
  } catch (error) {
    console.error("SnapTrade trade error:", error);

    if (error instanceof Error) {
      if (error.message.includes("insufficient")) {
        return NextResponse.json(
          { error: "Insufficient funds or buying power for this trade" },
          { status: 400 }
        );
      }
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Symbol not found or not tradeable on this account" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to execute trade",
      },
      { status: 500 }
    );
  }
});
