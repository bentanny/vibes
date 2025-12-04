"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";

export interface SnapTradeAccount {
  id: string;
  brokerageId: string;
  brokerageName: string;
  name: string;
  number: string;
  type: string;
  syncStatus: string;
  balance?: {
    total?: number;
    cash?: number;
    currency?: string;
  };
}

export interface SnapTradePosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  marketValue?: number;
  openPnl?: number;
}

export interface SnapTradeOrder {
  id: string;
  accountId: string;
  symbol: string;
  action: "BUY" | "SELL";
  orderType: string;
  status: string;
  quantity: number;
  filledQuantity?: number;
  price?: number;
  createdAt: string;
}

export interface SnapTradeBrokerage {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  allowsTrading: boolean;
}

export interface TradeResult {
  success: boolean;
  order?: SnapTradeOrder;
  message?: string;
  error?: string;
}

interface SnapTradeContextType {
  // State
  isConnected: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  accounts: SnapTradeAccount[];
  brokerages: {
    trading: SnapTradeBrokerage[];
    readOnly: SnapTradeBrokerage[];
  };

  // Actions
  connect: (brokerSlug?: string) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchBrokerages: () => Promise<void>;
  getPositions: (accountId: string) => Promise<{
    positions: SnapTradePosition[];
    balances: { cash: number; total: number; currency: string } | null;
  }>;
  executeTrade: (
    accountId: string,
    symbol: string,
    action: "BUY" | "SELL",
    quantity: number,
    options?: {
      orderType?: "MARKET" | "LIMIT";
      limitPrice?: number;
    },
  ) => Promise<TradeResult>;
  getOrders: (
    accountId: string,
    status?: "all" | "open" | "executed",
  ) => Promise<SnapTradeOrder[]>;
  cancelOrder: (
    accountId: string,
    orderId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  checkConnection: () => Promise<void>;
  clearError: () => void;
}

const SnapTradeContext = createContext<SnapTradeContextType | null>(null);

export function SnapTradeProvider({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SnapTradeAccount[]>([]);
  const [brokerages, setBrokerages] = useState<{
    trading: SnapTradeBrokerage[];
    readOnly: SnapTradeBrokerage[];
  }>({ trading: [], readOnly: [] });
  const [hasFetched, setHasFetched] = useState(false);

  // Check if user has any connected accounts
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/snaptrade/accounts");
      const data = await response.json();

      if (response.ok && data.accounts?.length > 0) {
        setIsConnected(true);
        setAccounts(data.accounts);
      } else {
        setIsConnected(false);
        setAccounts([]);
      }
    } catch {
      setIsConnected(false);
    }
  }, []);

  // Fetch brokerages (doesn't require auth)
  const fetchBrokeragesInternal = useCallback(async () => {
    try {
      const response = await fetch("/api/snaptrade/brokerages");
      const data = await response.json();

      if (response.ok) {
        setBrokerages(data.brokerages || { trading: [], readOnly: [] });
      }
    } catch (err) {
      console.error("Failed to fetch brokerages:", err);
    }
  }, []);

  // Initialize when session is ready
  useEffect(() => {
    const init = async () => {
      if (sessionStatus === "authenticated" && !hasFetched) {
        setIsInitializing(true);
        await checkConnection();
        await fetchBrokeragesInternal();
        setIsInitializing(false);
        setHasFetched(true);
      } else if (sessionStatus === "unauthenticated") {
        // User not signed in - no accounts to fetch
        setIsInitializing(false);
        setIsConnected(false);
        setAccounts([]);
      }
      // If sessionStatus is "loading", wait for it to resolve
    };
    init();
  }, [sessionStatus, hasFetched, checkConnection, fetchBrokeragesInternal]);

  /**
   * Open the SnapTrade connection portal to link a brokerage
   */
  const connect = useCallback(async (brokerSlug?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (brokerSlug) {
        params.set("broker", brokerSlug);
      }
      params.set(
        "redirect",
        `${window.location.origin}/settings?snaptrade=connected`,
      );

      const response = await fetch(`/api/snaptrade/connect?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get connection URL");
      }

      // Redirect to SnapTrade connection portal
      window.location.href = data.url;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect";
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch accounts from SnapTrade
   */
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/snaptrade/accounts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch accounts");
      }

      setAccounts(data.accounts);
      setIsConnected(data.accounts.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch supported brokerages (public method)
   */
  const fetchBrokerages = fetchBrokeragesInternal;

  /**
   * Get positions for an account
   */
  const getPositions = useCallback(
    async (
      accountId: string,
    ): Promise<{
      positions: SnapTradePosition[];
      balances: { cash: number; total: number; currency: string } | null;
    }> => {
      const response = await fetch(
        `/api/snaptrade/positions?accountId=${accountId}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch positions");
      }

      return {
        positions: data.positions,
        balances: data.balances,
      };
    },
    [],
  );

  /**
   * Execute a trade
   */
  const executeTrade = useCallback(
    async (
      accountId: string,
      symbol: string,
      action: "BUY" | "SELL",
      quantity: number,
      options?: {
        orderType?: "MARKET" | "LIMIT";
        limitPrice?: number;
      },
    ): Promise<TradeResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/snaptrade/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId,
            symbol,
            action,
            quantity,
            orderType: options?.orderType || "MARKET",
            limitPrice: options?.limitPrice,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Trade failed");
        }

        // Refresh accounts after trade
        await fetchAccounts();

        return {
          success: true,
          order: data.order,
          message: data.message,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Trade failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAccounts],
  );

  /**
   * Get order history for an account
   */
  const getOrders = useCallback(
    async (
      accountId: string,
      status?: "all" | "open" | "executed",
    ): Promise<SnapTradeOrder[]> => {
      const params = new URLSearchParams({ accountId });
      if (status) {
        params.set("status", status);
      }

      const response = await fetch(`/api/snaptrade/orders?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders");
      }

      return data.orders;
    },
    [],
  );

  /**
   * Cancel an order
   */
  const cancelOrder = useCallback(
    async (
      accountId: string,
      orderId: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch("/api/snaptrade/orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId, orderId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to cancel order");
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to cancel order",
        };
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <SnapTradeContext.Provider
      value={{
        isConnected,
        isLoading,
        isInitializing,
        error,
        accounts,
        brokerages,
        connect,
        fetchAccounts,
        fetchBrokerages,
        getPositions,
        executeTrade,
        getOrders,
        cancelOrder,
        checkConnection,
        clearError,
      }}
    >
      {children}
    </SnapTradeContext.Provider>
  );
}

export function useSnapTradeContext() {
  const context = useContext(SnapTradeContext);
  if (!context) {
    throw new Error(
      "useSnapTradeContext must be used within a SnapTradeProvider",
    );
  }
  return context;
}
