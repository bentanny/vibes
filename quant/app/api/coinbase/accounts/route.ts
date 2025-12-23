/**
 * Coinbase Accounts API Route
 * 
 * GET /api/coinbase/accounts - Get all user accounts/wallets
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

    const client = new CoinbaseClient(coinbaseToken);
    
    // Get all accounts
    const accounts = await client.getAccounts();
    
    // Filter to only show accounts with balance > 0 or primary accounts
    const relevantAccounts = accounts.filter(
      (acc) => acc.primary || parseFloat(acc.balance.amount) > 0
    );

    // Get user profile for additional context
    const user = await client.getUser();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar_url,
        nativeCurrency: user.native_currency,
      },
      accounts: relevantAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        currency: acc.currency.code,
        currencyName: acc.currency.name,
        balance: acc.balance.amount,
        isPrimary: acc.primary,
        isCrypto: acc.currency.type === "crypto",
      })),
      totalAccounts: accounts.length,
    });
  } catch (error) {
    console.error("Coinbase accounts error:", error);
    
    if (error instanceof Error && error.message.includes("token")) {
      return NextResponse.json(
        { error: "Coinbase session expired - Please reconnect your account" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch Coinbase accounts" },
      { status: 500 }
    );
  }
}

