"use client";

import { useSnapTradeContext } from "@/contexts/snaptrade-context";

// Re-export types from context for backwards compatibility
export type {
  SnapTradeAccount,
  SnapTradePosition,
  SnapTradeOrder,
  SnapTradeBrokerage,
  TradeResult,
} from "@/contexts/snaptrade-context";

/**
 * Hook for interacting with SnapTrade
 * 
 * This hook uses the global SnapTradeContext to share state across components.
 * 
 * SnapTrade provides unified access to multiple brokerages including:
 * - Fidelity
 * - E*TRADE  
 * - Interactive Brokers
 * - Schwab
 * - TD Ameritrade
 * - Webull
 * - Alpaca
 * And many more...
 */
export function useSnapTrade() {
  return useSnapTradeContext();
}
