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
  | "overlay.seasonality_tod";

export interface ArchetypeConfig {
  name: string;
  displayName: string;
  desc: string;
  keywords: string[];
  icon?: LucideIcon;
}
