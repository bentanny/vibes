"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession, useAuth } from "@/contexts/auth-context";

export interface CoinbaseAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  currencyName: string;
  balance: string;
  isPrimary: boolean;
  isCrypto: boolean;
}

export interface CoinbaseUser {
  id: string;
  name: string;
  avatar: string;
  nativeCurrency: string;
}

export interface CoinbasePrice {
  pair: string;
  spot: string;
  buy: string;
  sell: string;
  currency: string;
  base: string;
}

export interface CoinbasePaymentMethod {
  id: string;
  type: string;
  name: string;
  currency: string;
  primaryBuy: boolean;
  primarySell: boolean;
  instantBuy: boolean;
  instantSell: boolean;
  allowBuy: boolean;
  allowSell: boolean;
  verified: boolean;
}

export interface TradeResult {
  success: boolean;
  order?: {
    id: string;
    status: string;
    action: "buy" | "sell";
    amount: { amount: string; currency: string };
    total: { amount: string; currency: string };
    subtotal: { amount: string; currency: string };
    fee: { amount: string; currency: string };
    committed: boolean;
    instant: boolean;
  };
  message?: string;
  error?: string;
}

export function useCoinbase() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CoinbaseAccount[]>([]);
  const [user, setUser] = useState<CoinbaseUser | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<CoinbasePaymentMethod[]>([]);

  // Check if Coinbase is connected
  // TODO: Update this to check Firebase Auth or localStorage for Coinbase tokens
  const isConnected = false; // Temporarily disabled until Coinbase OAuth is re-implemented

  // Connect to Coinbase (initiates OAuth flow)
  const connect = useCallback(async () => {
    setError(null);
    try {
      // TODO: Implement Coinbase OAuth flow with Firebase Auth
      // For now, redirect to Coinbase OAuth URL manually
      const coinbaseAuthUrl = `https://www.coinbase.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_COINBASE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/coinbase/callback")}&response_type=code&scope=wallet:accounts:read,wallet:transactions:read,wallet:user:read`;
      window.location.href = coinbaseAuthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Coinbase");
    }
  }, []);

  // Disconnect Coinbase (clear tokens)
  const disconnect = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Call API to clear Coinbase tokens
      const response = await fetch("/api/coinbase/disconnect", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      setAccounts([]);
      setUser(null);
      setPaymentMethods([]);
      
      // Refresh the session
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coinbase/accounts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch accounts");
      }

      setAccounts(data.accounts);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    if (!isConnected) return;

    try {
      const response = await fetch("/api/coinbase/payment-methods");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch payment methods");
      }

      setPaymentMethods(data.paymentMethods);
    } catch (err) {
      console.error("Failed to fetch payment methods:", err);
    }
  }, [isConnected]);

  // Get prices
  const getPrices = useCallback(async (pairs: string[] = ["BTC-USD", "ETH-USD"]): Promise<CoinbasePrice[]> => {
    if (!isConnected) {
      throw new Error("Coinbase not connected");
    }

    const response = await fetch(`/api/coinbase/prices?pairs=${pairs.join(",")}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch prices");
    }

    return data.prices;
  }, [isConnected]);

  // Execute a trade (buy or sell)
  const executeTrade = useCallback(async (
    action: "buy" | "sell",
    accountId: string,
    amount: string,
    currency: string,
    options?: {
      paymentMethodId?: string;
      commit?: boolean;
    }
  ): Promise<TradeResult> => {
    if (!isConnected) {
      return { success: false, error: "Coinbase not connected" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coinbase/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          accountId,
          amount,
          currency,
          paymentMethodId: options?.paymentMethodId,
          commit: options?.commit ?? false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Trade failed");
      }

      // Refresh accounts after trade
      await fetchAccounts();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Trade failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, fetchAccounts]);

  // Commit a pending order
  const commitOrder = useCallback(async (
    action: "buy" | "sell",
    accountId: string,
    orderId: string
  ): Promise<TradeResult> => {
    if (!isConnected) {
      return { success: false, error: "Coinbase not connected" };
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/coinbase/trade", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          accountId,
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to commit order");
      }

      // Refresh accounts after trade
      await fetchAccounts();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to commit order";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, fetchAccounts]);

  // Auto-fetch accounts when connected
  useEffect(() => {
    if (isConnected && status === "authenticated") {
      fetchAccounts();
      fetchPaymentMethods();
    }
  }, [isConnected, status, fetchAccounts, fetchPaymentMethods]);

  return {
    // State
    isConnected,
    isLoading,
    error,
    accounts,
    user,
    paymentMethods,
    sessionStatus: status,

    // Actions
    connect,
    disconnect,
    fetchAccounts,
    fetchPaymentMethods,
    getPrices,
    executeTrade,
    commitOrder,

    // Helpers
    clearError: () => setError(null),
  };
}

