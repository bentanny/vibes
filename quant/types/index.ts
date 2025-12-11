import { SVGProps } from "react";
import type { LucideIcon } from "lucide-react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type ChartMode =
  | "events"
  | "event-correlation"
  | "asset-correlation"
  | "3p-correlation"
  | "strategy";

export type StrategyType =
  | "event-correlation"
  | "asset-correlation"
  | "3p-correlation"
  | "specified-time"
  | "data-related";

// Message types: regular text messages vs strategy cards
export type MessageType = "text" | "strategy";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: MessageType; // "text" for regular messages, "strategy" for strategy cards
  isStrategy?: boolean; // Legacy support - maps to type === "strategy"
  isLoading?: boolean; // For loading state with animated ellipsis
}

// Trading Archetypes - 13 different strategy types from schema
export type TradingArchetype =
  | "signal.trend_pullback"
  | "signal.range_mean_reversion"
  | "signal.breakout_trendfollow"
  | "signal.breakout_retest"
  | "signal.squeeze_expansion"
  | "signal.xs_momentum"
  | "signal.pairs_relative_value"
  | "signal.intermarket_trigger"
  | "signal.avwap_reversion"
  | "signal.event_followthrough"
  | "signal.gap_play"
  | "signal.liquidity_sweep"
  | "overlay.seasonality_tod"
  | "execution.dca"
  | "execution.time_window"
  | "execution.scheduled"
  | "signal.percent_dip"
  | "signal.price_limit"
  | "signal.metric_spike"
  | "signal.supertrend"
  | "manage.trailing_stop"
  | "manage.profit_scaling"
  | "execution.dca_sell"
  | "signal.price_limit_sell"
  | "signal.percent_spike"
  | "signal.trailing_limit_sell"
  | "signal.trailing_limit_buy"
  | "signal.metric_spike_down"
  | "signal.metric_dip_up"
  | "signal.metric_dip_down"
  | "manage.trailing_buy"
  | "manage.trailing_limit_buy"
  | "signal.trend_pullback_sell"
  | "signal.range_mean_reversion_sell"
  | "signal.breakout_retest_sell"
  | "signal.xs_momentum_sell"
  | "signal.pairs_relative_value_sell"
  | "signal.breakout_trendfollow_sell"
  | "signal.squeeze_expansion_sell"
  | "signal.intermarket_trigger_sell"
  | "signal.avwap_reversion_sell"
  | "signal.event_followthrough_sell"
  | "signal.gap_play_sell";

export interface ArchetypeConfig {
  name: string;
  displayName: string;
  desc: string;
  keywords: string[];
  icon?: LucideIcon;
}
