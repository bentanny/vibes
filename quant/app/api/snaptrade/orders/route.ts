/**
 * SnapTrade Orders API Route
 *
 * GET /api/snaptrade/orders?accountId=xxx - Get order history
 * DELETE /api/snaptrade/orders - Cancel an order
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-auth";
import { getOrderHistory, cancelOrder } from "@/lib/snaptrade";

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

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Get stored credentials
    const cookieStore = await cookies();
    const encryptedCreds = cookieStore.get("snaptrade_creds")?.value;

    if (!encryptedCreds) {
      return NextResponse.json(
        { error: "SnapTrade not connected" },
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

    // Get account ID and status filter from query params
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const status = searchParams.get("status") as
      | "all"
      | "open"
      | "executed"
      | undefined;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const orders = await getOrderHistory(
      credentials.userId,
      credentials.userSecret,
      accountId,
      status
    );

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("SnapTrade orders error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    // Get stored credentials
    const cookieStore = await cookies();
    const encryptedCreds = cookieStore.get("snaptrade_creds")?.value;

    if (!encryptedCreds) {
      return NextResponse.json(
        { error: "SnapTrade not connected" },
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
    const { accountId, orderId } = body;

    if (!accountId || !orderId) {
      return NextResponse.json(
        { error: "accountId and orderId are required" },
        { status: 400 }
      );
    }

    await cancelOrder(
      credentials.userId,
      credentials.userSecret,
      accountId,
      orderId
    );

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("SnapTrade cancel order error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
      },
      { status: 500 }
    );
  }
});
