import type { TradingArchetype, ArchetypeConfig } from "@/types";
import {
  GitPullRequest,
  RefreshCw,
  Target,
  Zap,
  Layers,
  Waves,
  TrendingUp,
  Maximize2,
  Network,
  BarChart3,
  Calendar,
  ArrowRight,
  Clock,
} from "lucide-react";

// Configuration for each archetype with keywords for detection
// Based on the 12 archetypes from archetype_schema.json
export const ARCHETYPE_CONFIGS: Record<TradingArchetype, ArchetypeConfig> = {
  "signal.trend_pullback": {
    name: "signal.trend_pullback",
    displayName: "Trend Pullback",
    desc: "Buying when the price temporarily dips during an uptrend, or selling when it bounces during a downtrend.",
    icon: GitPullRequest,
    keywords: [
      "trend pullback",
      "pullback",
      "buy dips",
      "dip",
      "keltner",
      "bollinger",
      "uptrend",
      "downtrend",
    ],
  },
  "signal.range_mean_reversion": {
    name: "signal.range_mean_reversion",
    displayName: "Range Mean Reversion",
    desc: "Buying when the price drops too far below its average, or selling when it rises too far above, expecting it to return to normal.",
    icon: RefreshCw,
    keywords: [
      "mean reversion",
      "range mean reversion",
      "fade",
      "bollinger",
      "keltner",
      "donchian",
      "vwap",
      "exit to mean",
      "reversion",
    ],
  },
  "signal.breakout_trendfollow": {
    name: "signal.breakout_trendfollow",
    displayName: "Breakout Trend Follow",
    desc: "Buying when the price breaks above a resistance level with high trading volume, expecting the trend to continue upward.",
    icon: TrendingUp,
    keywords: [
      "breakout",
      "trend follow",
      "trend following",
      "breakout trend",
      "lookback",
      "atr trail",
      "trail",
      "volume spike",
    ],
  },
  "signal.breakout_retest": {
    name: "signal.breakout_retest",
    displayName: "Breakout Retest",
    desc: "Waiting for the price to break a key level, then buying when it comes back to test that same level and holds.",
    icon: Target,
    keywords: [
      "breakout retest",
      "retest",
      "break retest",
      "pullback",
      "reclaim",
      "wick reject",
      "invalidation",
    ],
  },
  "signal.squeeze_expansion": {
    name: "signal.squeeze_expansion",
    displayName: "Squeeze Expansion",
    desc: "Buying when the price has been trading in a tight range and then breaks out with a big move, like a coiled spring releasing.",
    icon: Maximize2,
    keywords: [
      "squeeze",
      "squeeze expansion",
      "bb width",
      "bollinger width",
      "keltner",
      "donchian",
      "close outside band",
      "pctile",
    ],
  },
  "signal.xs_momentum": {
    name: "signal.xs_momentum",
    displayName: "Cross-Sectional Momentum",
    desc: "Buying stocks that are performing better than others in the market, then switching to new leaders as they emerge.",
    icon: Zap,
    keywords: [
      "momentum",
      "cross sectional",
      "xs momentum",
      "top",
      "rank",
      "rebalance",
      "universe",
      "relative strength",
    ],
  },
  "signal.pairs_relative_value": {
    name: "signal.pairs_relative_value",
    displayName: "Pairs Relative Value",
    desc: "Buying one stock and selling another related stock when their prices drift apart, expecting them to come back together.",
    icon: Layers,
    keywords: [
      "pairs",
      "pairs trading",
      "relative value",
      "spread",
      "log spread",
      "beta hedged",
      "z score",
      "z entry",
      "z exit",
    ],
  },
  "signal.intermarket_trigger": {
    name: "signal.intermarket_trigger",
    displayName: "Intermarket Trigger",
    desc: "Using movements in one market (like bonds or commodities) to predict and trade movements in stocks.",
    icon: Network,
    keywords: [
      "intermarket",
      "leader",
      "follower",
      "trigger",
      "ret move",
      "vol spike",
      "correlation",
    ],
  },
  "signal.avwap_reversion": {
    name: "signal.avwap_reversion",
    displayName: "AVWAP Reversion",
    desc: "Buying when the price drops far below its volume-weighted average price from a specific date, expecting it to return to that average.",
    icon: BarChart3,
    keywords: [
      "avwap",
      "vwap",
      "anchor vwap",
      "ytd",
      "year to date",
      "revert",
      "reversion",
      "sigma",
      "distance",
    ],
  },
  "signal.event_followthrough": {
    name: "signal.event_followthrough",
    displayName: "Event Followthrough",
    desc: "Buying or selling after major news events (like earnings reports) when the price continues moving in the same direction.",
    icon: Calendar,
    keywords: [
      "event",
      "event followthrough",
      "earnings",
      "listing",
      "macro",
      "cpi",
      "news",
      "token unlock",
      "surprise",
      "strength",
    ],
  },
  "signal.gap_play": {
    name: "signal.gap_play",
    displayName: "Gap Play",
    desc: "Trading when the stock opens much higher or lower than yesterday's close, either following the gap direction or betting it will reverse.",
    icon: ArrowRight,
    keywords: [
      "gap",
      "gap play",
      "gap fade",
      "gap go",
      "gap and go",
      "session",
      "us session",
      "eu session",
      "asia session",
    ],
  },
  "signal.liquidity_sweep": {
    name: "signal.liquidity_sweep",
    displayName: "Liquidity Sweep",
    desc: "Buying when the price briefly breaks below a support level (triggering stop losses) then quickly bounces back up.",
    icon: Waves,
    keywords: [
      "liquidity",
      "liquidity sweep",
      "stop hunt",
      "failed break",
      "reclaim",
      "wick reject",
      "liquidity grab",
      "false breakout",
    ],
  },
  "overlay.seasonality_tod": {
    name: "overlay.seasonality_tod",
    displayName: "Seasonality Time of Day",
    desc: "Trading based on patterns that repeat at certain times of day, days of the week, or times of the year.",
    icon: Clock,
    keywords: [
      "seasonality",
      "time of day",
      "tod",
      "windows",
      "trading hours",
      "session",
      "dow",
      "day of week",
      "holiday",
      "turn of month",
    ],
  },
};

/**
 * Detects trading archetype from strategy text input
 * Checks if any archetype name or keywords appear in the text
 */
export function detectArchetype(strategyText: string): TradingArchetype | null {
  const normalizedText = strategyText.toLowerCase().trim();

  // First, check for exact archetype name matches (highest priority)
  // Check both the full type_id and simplified versions
  for (const [archetype, config] of Object.entries(ARCHETYPE_CONFIGS)) {
    // Check full type_id (e.g., "signal.trend_pullback")
    const fullName = config.name.toLowerCase();
    if (normalizedText.includes(fullName)) {
      return archetype as TradingArchetype;
    }

    // Check simplified name (e.g., "trend pullback")
    const simplifiedName = config.displayName.toLowerCase();
    if (normalizedText.includes(simplifiedName)) {
      return archetype as TradingArchetype;
    }

    // Check name without "signal." prefix (e.g., "trend_pullback")
    const nameWithoutPrefix = fullName.replace("signal.", "").replace("overlay.", "");
    if (normalizedText.includes(nameWithoutPrefix)) {
      return archetype as TradingArchetype;
    }

    // Check name with underscores replaced (e.g., "trend pullback")
    const nameWithSpaces = nameWithoutPrefix.replace(/_/g, " ");
    if (normalizedText.includes(nameWithSpaces)) {
      return archetype as TradingArchetype;
    }
  }

  // Then check for keyword matches
  let bestMatch: { archetype: TradingArchetype; score: number } | null = null;

  for (const [archetype, config] of Object.entries(ARCHETYPE_CONFIGS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { archetype: archetype as TradingArchetype, score };
    }
  }

  return bestMatch?.archetype || null;
}

/**
 * Gets the display configuration for an archetype
 */
export function getArchetypeConfig(
  archetype: TradingArchetype | null,
): ArchetypeConfig | null {
  if (!archetype) return null;
  return ARCHETYPE_CONFIGS[archetype] || null;
}

