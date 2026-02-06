/**
 * Vibe Trade API Client
 *
 * Client for interacting with vibe-trade-api service.
 */

import { auth } from "./firebase";

// API URLs - can be overridden via environment variables
const VIBE_API_URL =
  process.env.NEXT_PUBLIC_VIBE_API_URL ||
  "https://vibe-trade-api-kff5sbwvca-uc.a.run.app";


/**
 * Get authorization headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers["Authorization"] = `Bearer ${idToken}`;
    } catch (error) {
      console.error("Failed to get ID token:", error);
    }
  }

  return headers;
}

/**
 * Make an authenticated request to the Vibe API
 */
async function vibeApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${VIBE_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.detail || error.error || `API error: ${response.status}`);
  }

  return response.json();
}


// =============================================================================
// Types
// =============================================================================

export interface Strategy {
  id: string;
  owner_id: string | null;
  session_id: string | null;
  thread_id: string | null;
  name: string;
  status: string;
  universe: string[];
  attachments: Attachment[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  card_id: string;
  role: string;
  enabled: boolean;
  follow_latest: boolean;
  card_revision_id: string | null;
}

export interface Card {
  id: string;
  type: string;  // Archetype identifier (e.g., 'entry.trend_pullback')
  slots: Record<string, unknown>;
  schema_etag: string;
  created_at: string;
  updated_at: string;
  // Added by API from attachment:
  role?: string;
  enabled?: boolean;
  // Legacy aliases (for backwards compatibility)
  archetype_id?: string;
  name?: string;
}

export interface StrategyWithCards {
  strategy: Strategy;
  cards: Card[];
  card_count: number;
}

export interface BacktestRequest {
  strategy_id: string;
  lookback: string; // e.g., "3m", "6m", "1y"
  initial_cash?: number;
}

export interface BacktestResponse {
  backtest_id: string;
  status: "pending" | "running" | "completed" | "failed";
  strategy_id: string;
  start_date: string;
  end_date: string;
  symbol: string;
  message?: string;
  results?: BacktestResults;
  error?: string;
}

export interface BacktestResults {
  statistics?: PerformanceStatistics;
  trades?: Trade[];
  equity_curve?: EquityPoint[];
  final_equity?: number;
  ohlcv_bars?: OHLCVBar[];
  indicators?: Record<string, any>;
}

export interface PerformanceStatistics {
  // Basic metrics (existing - keep for backward compatibility)
  total_return: number;
  annual_return: number;
  max_drawdown: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  average_win: number;
  average_loss: number;
  net_profit: number;
  profit_factor?: number;

  // LEAN PortfolioStatistics (Risk-Adjusted Returns)
  sharpe_ratio?: number;
  sortino_ratio?: number;
  probabilistic_sharpe_ratio?: number;
  information_ratio?: number;
  treynor_ratio?: number;

  // LEAN PortfolioStatistics (Performance Metrics)
  compounding_annual_return?: number;
  total_net_profit?: number;
  start_equity?: number;
  end_equity?: number;

  // LEAN PortfolioStatistics (Risk Metrics)
  drawdown?: number;
  annual_standard_deviation?: number;
  annual_variance?: number;
  tracking_error?: number;
  value_at_risk_99?: number;
  value_at_risk_95?: number;

  // LEAN PortfolioStatistics (Market Correlation)
  alpha?: number;
  beta?: number;

  // LEAN PortfolioStatistics (Trade Statistics)
  loss_rate?: number;
  average_win_rate?: number;
  average_loss_rate?: number;
  profit_loss_ratio?: number;
  expectancy?: number;

  // LEAN PortfolioStatistics (Activity Metrics)
  portfolio_turnover?: number;
}

export interface Trade {
  trade_id: string;
  symbol: string;
  direction: "buy" | "sell";
  entry_time: string;
  entry_price: number;
  entry_quantity: number;
  exit_time?: string;
  exit_price?: number;
  pnl?: number;
  pnl_percent?: number;
  exit_reason?: string;
}

export interface EquityPoint {
  time: string;
  equity: number;
  cash: number;
  holdings_value: number;
  drawdown: number;
}

export interface OHLCVBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestListItem {
  backtest_id: string;
  status: string;
  strategy_id: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_cash: number;
  total_return: number | null;
  total_trades: number | null;
  message: string | null;
  error: string | null;
  created_at: string;
}

export interface BacktestListResponse {
  backtests: BacktestListItem[];
  total: number;
}

// =============================================================================
// Strategy API
// =============================================================================

/**
 * Get all strategies for the authenticated user
 */
export async function getStrategies(): Promise<Strategy[]> {
  return vibeApiFetch<Strategy[]>("/api/strategies");
}

/**
 * Get a strategy by ID with all its cards
 */
export async function getStrategy(strategyId: string): Promise<StrategyWithCards> {
  return vibeApiFetch<StrategyWithCards>(`/api/strategies/${strategyId}`);
}

/**
 * Delete a strategy by ID
 */
export async function deleteStrategy(strategyId: string): Promise<void> {
  await vibeApiFetch(`/api/strategies/${strategyId}`, {
    method: "DELETE",
  });
}

/**
 * Get a strategy by thread ID with all its cards
 */
export async function getStrategyByThreadId(
  threadId: string
): Promise<StrategyWithCards> {
  return vibeApiFetch<StrategyWithCards>(
    `/api/strategies/threads/${threadId}/strategy`
  );
}

// =============================================================================
// Backtest API
// =============================================================================

/**
 * Run a backtest for a strategy
 */
export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  return vibeApiFetch<BacktestResponse>(`/backtest/${request.strategy_id}`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get the status/results of a backtest
 */
export async function getBacktestStatus(
  backtestId: string
): Promise<BacktestResponse> {
  return vibeApiFetch<BacktestResponse>(`/backtest/${backtestId}`);
}

/**
 * Get backtest history for a strategy
 */
export async function getBacktestHistory(
  strategyId: string,
  limit: number = 20
): Promise<BacktestListResponse> {
  return vibeApiFetch<BacktestListResponse>(
    `/backtest/strategy/${strategyId}?limit=${limit}`
  );
}

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "draft":
      return "default";
    case "ready":
      return "primary";
    case "running":
      return "success";
    case "paused":
      return "warning";
    case "stopped":
    case "error":
      return "danger";
    default:
      return "default";
  }
}
