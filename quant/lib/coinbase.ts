/**
 * Coinbase API Integration
 * 
 * This module handles OAuth2 authentication and API calls to Coinbase
 * for trading cryptocurrency on behalf of users.
 */

// Coinbase OAuth2 Configuration (CDP - Coinbase Developer Platform)
export const COINBASE_CONFIG = {
  // New CDP OAuth endpoints
  authorizationUrl: "https://login.coinbase.com/oauth2/auth",
  tokenUrl: "https://login.coinbase.com/oauth2/token",
  revokeUrl: "https://login.coinbase.com/oauth2/revoke",
  apiBaseUrl: "https://api.coinbase.com/v2",
  // Scopes needed for trading - comma separated in URL
  scopes: [
    "wallet:accounts:read",      // View accounts and balances
    "wallet:buys:read",          // View buy orders
    "wallet:buys:create",        // Create buy orders
    "wallet:sells:read",         // View sell orders
    "wallet:sells:create",       // Create sell orders
    "wallet:transactions:read",  // View transaction history
    "wallet:user:read",          // View user profile
    "wallet:payment-methods:read", // View payment methods
    "offline_access",            // Get refresh tokens
  ],
};

// Types for Coinbase API responses
export interface CoinbaseUser {
  id: string;
  name: string;
  username: string | null;
  profile_location: string | null;
  profile_bio: string | null;
  profile_url: string | null;
  avatar_url: string;
  resource: "user";
  created_at: string;
  email?: string;
  time_zone?: string;
  native_currency?: string;
  country?: {
    code: string;
    name: string;
  };
}

export interface CoinbaseAccount {
  id: string;
  name: string;
  primary: boolean;
  type: "wallet" | "fiat" | "vault";
  currency: {
    code: string;
    name: string;
    color: string;
    exponent: number;
    type: "crypto" | "fiat";
    address_regex?: string;
    asset_id?: string;
  };
  balance: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
  resource: "account";
  resource_path: string;
  allow_deposits: boolean;
  allow_withdrawals: boolean;
}

export interface CoinbaseTransaction {
  id: string;
  type: "buy" | "sell" | "send" | "receive" | "transfer";
  status: "pending" | "completed" | "failed" | "canceled";
  amount: {
    amount: string;
    currency: string;
  };
  native_amount: {
    amount: string;
    currency: string;
  };
  description: string | null;
  created_at: string;
  updated_at: string;
  resource: "transaction";
  resource_path: string;
}

export interface CoinbaseBuyOrder {
  id: string;
  status: "created" | "completed" | "canceled";
  payment_method: {
    id: string;
    resource: "payment_method";
    resource_path: string;
  };
  transaction: CoinbaseTransaction | null;
  amount: {
    amount: string;
    currency: string;
  };
  total: {
    amount: string;
    currency: string;
  };
  subtotal: {
    amount: string;
    currency: string;
  };
  fee: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
  resource: "buy";
  resource_path: string;
  committed: boolean;
  instant: boolean;
  payout_at: string;
}

export interface CoinbaseSellOrder {
  id: string;
  status: "created" | "completed" | "canceled";
  payment_method: {
    id: string;
    resource: "payment_method";
    resource_path: string;
  };
  transaction: CoinbaseTransaction | null;
  amount: {
    amount: string;
    currency: string;
  };
  total: {
    amount: string;
    currency: string;
  };
  subtotal: {
    amount: string;
    currency: string;
  };
  fee: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
  resource: "sell";
  resource_path: string;
  committed: boolean;
  instant: boolean;
  payout_at: string;
}

export interface CoinbasePrice {
  amount: string;
  currency: string;
  base: string;
}

export interface CoinbasePaymentMethod {
  id: string;
  type: string;
  name: string;
  currency: string;
  primary_buy: boolean;
  primary_sell: boolean;
  instant_buy: boolean;
  instant_sell: boolean;
  created_at: string;
  updated_at: string;
  resource: "payment_method";
  resource_path: string;
  limits: {
    buy: { remaining: { amount: string; currency: string } }[];
    sell: { remaining: { amount: string; currency: string } }[];
  };
  allow_buy: boolean;
  allow_sell: boolean;
  allow_deposit: boolean;
  allow_withdraw: boolean;
  verified: boolean;
}

// API Response wrapper
interface CoinbaseApiResponse<T> {
  data: T;
  pagination?: {
    ending_before: string | null;
    starting_after: string | null;
    limit: number;
    order: "asc" | "desc";
    previous_uri: string | null;
    next_uri: string | null;
  };
  warnings?: Array<{ id: string; message: string; url: string }>;
}

// Error types
export class CoinbaseApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Array<{ id: string; message: string }>
  ) {
    super(message);
    this.name = "CoinbaseApiError";
  }
}

/**
 * Coinbase API Client
 * Handles all API interactions with Coinbase
 */
export class CoinbaseClient {
  private accessToken: string;
  private baseUrl = COINBASE_CONFIG.apiBaseUrl;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "CB-VERSION": "2024-01-01", // API version
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new CoinbaseApiError(
        data.errors?.[0]?.message || "Coinbase API error",
        response.status,
        data.errors
      );
    }

    return data;
  }

  /**
   * Get the authenticated user's profile
   */
  async getUser(): Promise<CoinbaseUser> {
    const response = await this.request<CoinbaseApiResponse<CoinbaseUser>>("/user");
    return response.data;
  }

  /**
   * Get all accounts (wallets) for the user
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const response = await this.request<CoinbaseApiResponse<CoinbaseAccount[]>>("/accounts");
    return response.data;
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: string): Promise<CoinbaseAccount> {
    const response = await this.request<CoinbaseApiResponse<CoinbaseAccount>>(
      `/accounts/${accountId}`
    );
    return response.data;
  }

  /**
   * Get the current price for a cryptocurrency pair
   * @param pair - e.g., "BTC-USD", "ETH-USD"
   */
  async getSpotPrice(pair: string): Promise<CoinbasePrice> {
    const response = await this.request<CoinbaseApiResponse<CoinbasePrice>>(
      `/prices/${pair}/spot`
    );
    return response.data;
  }

  /**
   * Get the buy price (includes Coinbase fee)
   */
  async getBuyPrice(pair: string): Promise<CoinbasePrice> {
    const response = await this.request<CoinbaseApiResponse<CoinbasePrice>>(
      `/prices/${pair}/buy`
    );
    return response.data;
  }

  /**
   * Get the sell price
   */
  async getSellPrice(pair: string): Promise<CoinbasePrice> {
    const response = await this.request<CoinbaseApiResponse<CoinbasePrice>>(
      `/prices/${pair}/sell`
    );
    return response.data;
  }

  /**
   * Get payment methods available for trading
   */
  async getPaymentMethods(): Promise<CoinbasePaymentMethod[]> {
    const response = await this.request<CoinbaseApiResponse<CoinbasePaymentMethod[]>>(
      "/payment-methods"
    );
    return response.data;
  }

  /**
   * Create a buy order
   * @param accountId - The account (wallet) to deposit the crypto into
   * @param amount - Amount to buy
   * @param currency - Currency of the amount (e.g., "USD")
   * @param paymentMethod - Optional payment method ID
   * @param commit - If true, immediately completes the order
   */
  async createBuy(
    accountId: string,
    amount: string,
    currency: string,
    paymentMethod?: string,
    commit: boolean = false
  ): Promise<CoinbaseBuyOrder> {
    const body: Record<string, unknown> = {
      amount,
      currency,
      commit,
    };

    if (paymentMethod) {
      body.payment_method = paymentMethod;
    }

    const response = await this.request<CoinbaseApiResponse<CoinbaseBuyOrder>>(
      `/accounts/${accountId}/buys`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    return response.data;
  }

  /**
   * Commit (execute) a buy order that was created with commit=false
   */
  async commitBuy(accountId: string, buyId: string): Promise<CoinbaseBuyOrder> {
    const response = await this.request<CoinbaseApiResponse<CoinbaseBuyOrder>>(
      `/accounts/${accountId}/buys/${buyId}/commit`,
      { method: "POST" }
    );
    return response.data;
  }

  /**
   * Create a sell order
   * @param accountId - The account (wallet) to sell from
   * @param amount - Amount of crypto to sell
   * @param currency - The crypto currency (e.g., "BTC")
   * @param paymentMethod - Optional payment method ID to receive funds
   * @param commit - If true, immediately completes the order
   */
  async createSell(
    accountId: string,
    amount: string,
    currency: string,
    paymentMethod?: string,
    commit: boolean = false
  ): Promise<CoinbaseSellOrder> {
    const body: Record<string, unknown> = {
      amount,
      currency,
      commit,
    };

    if (paymentMethod) {
      body.payment_method = paymentMethod;
    }

    const response = await this.request<CoinbaseApiResponse<CoinbaseSellOrder>>(
      `/accounts/${accountId}/sells`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    return response.data;
  }

  /**
   * Commit (execute) a sell order that was created with commit=false
   */
  async commitSell(accountId: string, sellId: string): Promise<CoinbaseSellOrder> {
    const response = await this.request<CoinbaseApiResponse<CoinbaseSellOrder>>(
      `/accounts/${accountId}/sells/${sellId}/commit`,
      { method: "POST" }
    );
    return response.data;
  }

  /**
   * Get transactions for an account
   */
  async getTransactions(accountId: string): Promise<CoinbaseTransaction[]> {
    const response = await this.request<CoinbaseApiResponse<CoinbaseTransaction[]>>(
      `/accounts/${accountId}/transactions`
    );
    return response.data;
  }
}

/**
 * Refresh an expired access token using the CDP token endpoint
 */
export async function refreshCoinbaseToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(COINBASE_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.COINBASE_CLIENT_ID!,
      client_secret: process.env.COINBASE_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token refresh failed:", error);
    throw new Error("Failed to refresh Coinbase token");
  }

  return response.json();
}

/**
 * Revoke a Coinbase access token (useful for logout/disconnect)
 */
export async function revokeCoinbaseToken(accessToken: string): Promise<void> {
  await fetch(COINBASE_CONFIG.revokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      token: accessToken,
      client_id: process.env.COINBASE_CLIENT_ID!,
      client_secret: process.env.COINBASE_CLIENT_SECRET!,
    }),
  });
  // Coinbase returns 200 for both success and failure
}

