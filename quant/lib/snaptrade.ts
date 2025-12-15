/**
 * SnapTrade Integration
 * 
 * SnapTrade provides a unified API to connect to multiple brokerages
 * for both reading account data and executing trades.
 * 
 * Supported brokerages include:
 * - Fidelity
 * - E*TRADE
 * - Interactive Brokers
 * - Schwab
 * - TD Ameritrade
 * - Webull
 * - Alpaca
 * - And many more...
 * 
 * @see https://docs.snaptrade.com
 */

import { Snaptrade } from "snaptrade-typescript-sdk";

// SnapTrade Configuration
export const SNAPTRADE_CONFIG = {
  clientId: process.env.SNAPTRADE_CLIENT_ID || "",
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY || "",
};

// Initialize SnapTrade client
let snaptradeClient: Snaptrade | null = null;

export function getSnapTradeClient(): Snaptrade {
  if (!snaptradeClient) {
    if (!SNAPTRADE_CONFIG.clientId || !SNAPTRADE_CONFIG.consumerKey) {
      throw new Error("SnapTrade credentials not configured");
    }
    
    snaptradeClient = new Snaptrade({
      clientId: SNAPTRADE_CONFIG.clientId,
      consumerKey: SNAPTRADE_CONFIG.consumerKey,
    });
  }
  
  return snaptradeClient;
}

// Types for SnapTrade
export interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

export interface SnapTradeBrokerage {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  allowsTrading: boolean;
  authType: "OAUTH" | "CREDENTIALS" | "API";
}

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
  symbolId?: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  marketValue?: number;
  openPnl?: number;
  currency?: string;
}

export interface SnapTradeOrder {
  id: string;
  accountId: string;
  symbol: string;
  action: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP_LIMIT" | "STOP";
  status: "PENDING" | "EXECUTED" | "CANCELLED" | "FAILED";
  quantity: number;
  filledQuantity?: number;
  price?: number;
  limitPrice?: number;
  stopPrice?: number;
  createdAt: string;
  executedAt?: string;
}

/**
 * Register a new user with SnapTrade
 * This creates a user ID that will be used for all subsequent API calls
 */
export async function registerSnapTradeUser(userId: string): Promise<SnapTradeUser> {
  const client = getSnapTradeClient();
  
  const response = await client.authentication.registerSnapTradeUser({
    userId,
  });

  if (!response.data.userId || !response.data.userSecret) {
    throw new Error("Failed to register SnapTrade user");
  }

  return {
    userId: response.data.userId,
    userSecret: response.data.userSecret,
  };
}

/**
 * Delete a SnapTrade user
 */
export async function deleteSnapTradeUser(userId: string): Promise<void> {
  const client = getSnapTradeClient();
  
  await client.authentication.deleteSnapTradeUser({
    userId,
  });
}

/**
 * Generate a redirect URL for the SnapTrade connection portal
 * Users will be redirected here to connect their brokerage accounts
 */
export async function getConnectionPortalUrl(
  userId: string,
  userSecret: string,
  options?: {
    broker?: string;
    immediateRedirect?: boolean;
    customRedirect?: string;
    reconnect?: string;
    connectionType?: "read" | "trade";
  }
): Promise<string> {
  const client = getSnapTradeClient();

  const response = await client.authentication.loginSnapTradeUser({
    userId,
    userSecret,
    broker: options?.broker,
    immediateRedirect: options?.immediateRedirect,
    customRedirect: options?.customRedirect,
    reconnect: options?.reconnect,
    connectionType: options?.connectionType,
  });

  // Handle both response types
  const redirectURI = 
    "redirectURI" in response.data 
      ? response.data.redirectURI 
      : "redirectURI" in (response.data as any)
        ? (response.data as any).redirectURI
        : null;

  if (!redirectURI) {
    throw new Error("Failed to get connection portal URL");
  }

  return redirectURI as string;
}

/**
 * Get list of supported brokerages
 */
export async function getBrokerages(): Promise<SnapTradeBrokerage[]> {
  const client = getSnapTradeClient();

  const response = await client.referenceData.listAllBrokerages();

  return (response.data || []).map((b) => ({
    id: b.id || "",
    name: b.name || "",
    slug: b.slug || "",
    logoUrl: b.logo || undefined,
    description: b.description || undefined,
    isActive: b.isRealTimeConnection || false,
    allowsTrading: b.allowsTrading || false,
    authType: (b.authorizationTypes?.[0]?.type as "OAUTH" | "CREDENTIALS" | "API") || "OAUTH",
  }));
}

/**
 * Get user's connected accounts
 */
export async function getAccounts(
  userId: string,
  userSecret: string
): Promise<SnapTradeAccount[]> {
  const client = getSnapTradeClient();

  const response = await client.accountInformation.listUserAccounts({
    userId,
    userSecret,
  });

  return (response.data || []).map((a) => ({
    id: a.id || "",
    brokerageId: a.brokerageAuthorization?.brokerage?.id || "",
    brokerageName: a.brokerageAuthorization?.brokerage?.name || "",
    name: a.name || "",
    number: a.number || "",
    type: a.type || "",
    syncStatus: a.syncStatus?.connections?.brokerage?.state || "UNKNOWN",
    balance: a.balance
      ? {
          total: a.balance.total?.amount || undefined,
          cash: a.balance.cash?.amount || undefined,
          currency: a.balance.total?.currency || undefined,
        }
      : undefined,
  }));
}

/**
 * Get positions for an account
 */
export async function getPositions(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<SnapTradePosition[]> {
  const client = getSnapTradeClient();

  const response = await client.accountInformation.getUserAccountPositions({
    userId,
    userSecret,
    accountId,
  });

  return (response.data || []).map((p) => ({
    symbol: p.symbol?.symbol?.symbol || "",
    symbolId: p.symbol?.symbol?.id || undefined,
    quantity: p.units || 0,
    averagePrice: p.averagePrice || 0,
    currentPrice: p.symbol?.symbol?.figiInstrument?.figiShareClass?.lastPrice || undefined,
    marketValue: p.units && p.symbol?.symbol?.figiInstrument?.figiShareClass?.lastPrice
      ? p.units * (p.symbol.symbol.figiInstrument.figiShareClass.lastPrice)
      : undefined,
    openPnl: p.openPnl || undefined,
    currency: p.symbol?.localId || undefined,
  }));
}

/**
 * Get account balances
 */
export async function getBalances(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<{ cash: number; total: number; currency: string } | null> {
  const client = getSnapTradeClient();

  const response = await client.accountInformation.getUserAccountBalance({
    userId,
    userSecret,
    accountId,
  });

  if (!response.data || response.data.length === 0) {
    return null;
  }

  const balance = response.data[0];
  return {
    cash: balance.cash || 0,
    total: (balance.cash || 0), // Total would include positions
    currency: balance.currency?.code || "USD",
  };
}

/**
 * Place a market order
 */
export async function placeMarketOrder(
  userId: string,
  userSecret: string,
  accountId: string,
  symbol: string,
  action: "BUY" | "SELL",
  quantity: number
): Promise<SnapTradeOrder> {
  const client = getSnapTradeClient();

  // First, get the symbol info
  const symbolSearch = await client.referenceData.symbolSearchUserAccount({
    userId,
    userSecret,
    accountId,
    substring: symbol,
  });

  const symbolInfo = symbolSearch.data?.[0];
  if (!symbolInfo?.id) {
    throw new Error(`Symbol ${symbol} not found`);
  }

  // Place the order
  const response = await client.trading.placeForceOrder({
    userId,
    userSecret,
    accountId,
    action,
    orderType: "Market",
    timeInForce: "Day",
    universalSymbolId: symbolInfo.id,
    units: quantity,
  });

  const order = response.data;
  
  return {
    id: order?.brokerageOrderId || "",
    accountId,
    symbol,
    action,
    orderType: "MARKET",
    status: order?.status === "EXECUTED" ? "EXECUTED" : "PENDING",
    quantity,
    filledQuantity: order?.filledPercent ? quantity * (order.filledPercent / 100) : undefined,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Place a limit order
 */
export async function placeLimitOrder(
  userId: string,
  userSecret: string,
  accountId: string,
  symbol: string,
  action: "BUY" | "SELL",
  quantity: number,
  limitPrice: number
): Promise<SnapTradeOrder> {
  const client = getSnapTradeClient();

  // First, get the symbol info
  const symbolSearch = await client.referenceData.symbolSearchUserAccount({
    userId,
    userSecret,
    accountId,
    substring: symbol,
  });

  const symbolInfo = symbolSearch.data?.[0];
  if (!symbolInfo?.id) {
    throw new Error(`Symbol ${symbol} not found`);
  }

  // Place the order
  const response = await client.trading.placeForceOrder({
    userId,
    userSecret,
    accountId,
    action,
    orderType: "Limit",
    timeInForce: "Day",
    universalSymbolId: symbolInfo.id,
    units: quantity,
    price: limitPrice,
  });

  const order = response.data;
  
  return {
    id: order?.brokerageOrderId || "",
    accountId,
    symbol,
    action,
    orderType: "LIMIT",
    status: order?.status === "EXECUTED" ? "EXECUTED" : "PENDING",
    quantity,
    limitPrice,
    filledQuantity: order?.filledPercent ? quantity * (order.filledPercent / 100) : undefined,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get order history for an account
 */
export async function getOrderHistory(
  userId: string,
  userSecret: string,
  accountId: string,
  status?: "all" | "open" | "executed"
): Promise<SnapTradeOrder[]> {
  const client = getSnapTradeClient();

  const response = await client.accountInformation.getUserAccountOrders({
    userId,
    userSecret,
    accountId,
    state: status,
  });

  return (response.data || []).map((o) => ({
    id: o.brokerageOrderId || "",
    accountId,
    symbol: o.symbol || "",
    action: (o.action?.toUpperCase() as "BUY" | "SELL") || "BUY",
    orderType: (o.type?.toUpperCase() as "MARKET" | "LIMIT") || "MARKET",
    status: (o.status?.toUpperCase() as "PENDING" | "EXECUTED" | "CANCELLED" | "FAILED") || "PENDING",
    quantity: o.totalQuantity || 0,
    filledQuantity: o.filledQuantity || undefined,
    price: o.executionPrice || undefined,
    limitPrice: o.limitPrice || undefined,
    stopPrice: o.stopPrice || undefined,
    createdAt: o.createdTime || new Date().toISOString(),
  }));
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  userId: string,
  userSecret: string,
  accountId: string,
  orderId: string
): Promise<void> {
  const client = getSnapTradeClient();

  await client.trading.cancelUserAccountOrder({
    userId,
    userSecret,
    accountId,
    brokerageOrderId: orderId,
  });
}

/**
 * Get a quote for a symbol
 */
export async function getQuote(
  userId: string,
  userSecret: string,
  accountId: string,
  symbol: string
): Promise<{ bid: number; ask: number; last: number; symbol: string } | null> {
  const client = getSnapTradeClient();

  // Search for the symbol
  const symbolSearch = await client.referenceData.symbolSearchUserAccount({
    userId,
    userSecret,
    accountId,
    substring: symbol,
  });

  const symbolInfo = symbolSearch.data?.[0];
  if (!symbolInfo) {
    return null;
  }

  // Get quote
  const response = await client.trading.getUserAccountQuotes({
    userId,
    userSecret,
    accountId,
    symbols: symbolInfo.id!,
  });

  const quote = response.data?.[0];
  if (!quote) {
    return null;
  }

  return {
    symbol,
    bid: quote.bidPrice || 0,
    ask: quote.askPrice || 0,
    last: quote.lastTradePrice || 0,
  };
}

