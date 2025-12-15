import type { TradingArchetype, ArchetypeConfig } from "@/types";
import { STRATEGY_DEFINITIONS } from "@/lib/strategy-definitions";
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
  Repeat,
  Percent,
  Activity,
  Shield,
  Scale,
  TrendingDown,
  CalendarClock,
} from "lucide-react";

// Configuration for each archetype with keywords for detection
// Based on the 12 archetypes from archetype_schema.json
export const ARCHETYPE_CONFIGS: Record<TradingArchetype, ArchetypeConfig> = {
  "signal.trend_pullback": {
    name: "signal.trend_pullback",
    displayName: STRATEGY_DEFINITIONS["signal.trend_pullback"].title,
    desc: STRATEGY_DEFINITIONS["signal.trend_pullback"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.range_mean_reversion"].title,
    desc: STRATEGY_DEFINITIONS["signal.range_mean_reversion"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.breakout_trendfollow"].title,
    desc: STRATEGY_DEFINITIONS["signal.breakout_trendfollow"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.breakout_retest"].title,
    desc: STRATEGY_DEFINITIONS["signal.breakout_retest"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.squeeze_expansion"].title,
    desc: STRATEGY_DEFINITIONS["signal.squeeze_expansion"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.xs_momentum"].title,
    desc: STRATEGY_DEFINITIONS["signal.xs_momentum"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.pairs_relative_value"].title,
    desc: STRATEGY_DEFINITIONS["signal.pairs_relative_value"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.intermarket_trigger"].title,
    desc: STRATEGY_DEFINITIONS["signal.intermarket_trigger"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.avwap_reversion"].title,
    desc: STRATEGY_DEFINITIONS["signal.avwap_reversion"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.event_followthrough"].title,
    desc: STRATEGY_DEFINITIONS["signal.event_followthrough"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.gap_play"].title,
    desc: STRATEGY_DEFINITIONS["signal.gap_play"].description,
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
    displayName: STRATEGY_DEFINITIONS["signal.liquidity_sweep"].title,
    desc: STRATEGY_DEFINITIONS["signal.liquidity_sweep"].description,
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
    displayName: STRATEGY_DEFINITIONS["overlay.seasonality_tod"].title,
    desc: STRATEGY_DEFINITIONS["overlay.seasonality_tod"].description,
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
  "execution.dca": {
    name: "execution.dca",
    displayName: STRATEGY_DEFINITIONS["execution.dca"].title,
    desc: STRATEGY_DEFINITIONS["execution.dca"].description,
    icon: Repeat,
    keywords: [
      "dca",
      "dollar cost average",
      "recurring buy",
      "recurring investment",
      "periodic buy",
      "auto invest",
    ],
  },
  "execution.dca_sell": {
    name: "execution.dca_sell",
    displayName: STRATEGY_DEFINITIONS["execution.dca_sell"].title,
    desc: STRATEGY_DEFINITIONS["execution.dca_sell"].description,
    icon: Repeat,
    keywords: [
      "dca sell",
      "dollar cost average sell",
      "recurring sell",
      "periodic sell",
      "distribute",
      "auto sell",
    ],
  },
  "execution.time_window": {
    name: "execution.time_window",
    displayName: STRATEGY_DEFINITIONS["execution.time_window"].title,
    desc: STRATEGY_DEFINITIONS["execution.time_window"].description,
    icon: Clock,
    keywords: [
      "time window",
      "trading hours",
      "session",
      "open",
      "close",
      "market hours",
      "9:30",
      "16:00",
    ],
  },
  "execution.scheduled": {
    name: "execution.scheduled",
    displayName: STRATEGY_DEFINITIONS["execution.scheduled"].title,
    desc: STRATEGY_DEFINITIONS["execution.scheduled"].description,
    icon: CalendarClock,
    keywords: [
      "scheduled",
      "schedule",
      "recurring",
      "every monday",
      "weekly",
      "monthly",
      "specific time",
    ],
  },
  "signal.percent_dip": {
    name: "signal.percent_dip",
    displayName: STRATEGY_DEFINITIONS["signal.percent_dip"].title,
    desc: STRATEGY_DEFINITIONS["signal.percent_dip"].description,
    icon: Percent,
    keywords: [
      "percent dip",
      "buy dip",
      "dip buy",
      "drop %",
      "fall %",
      "percentage drop",
      "buy the dip",
    ],
  },
  "signal.percent_spike": {
    name: "signal.percent_spike",
    displayName: STRATEGY_DEFINITIONS["signal.percent_spike"].title,
    desc: STRATEGY_DEFINITIONS["signal.percent_spike"].description,
    icon: Percent,
    keywords: [
      "percent spike",
      "sell spike",
      "spike sell",
      "rise %",
      "jump %",
      "percentage rise",
      "sell the spike",
    ],
  },
  "signal.price_limit": {
    name: "signal.price_limit",
    displayName: STRATEGY_DEFINITIONS["signal.price_limit"].title,
    desc: STRATEGY_DEFINITIONS["signal.price_limit"].description,
    icon: Target,
    keywords: [
      "limit order",
      "price limit",
      "limit buy",
      "buy at",
      "price level",
      "support level",
    ],
  },
  "signal.price_limit_sell": {
    name: "signal.price_limit_sell",
    displayName: STRATEGY_DEFINITIONS["signal.price_limit_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.price_limit_sell"].description,
    icon: Target,
    keywords: [
      "limit sell",
      "sell at",
      "price target",
      "resistance level",
      "take profit level",
    ],
  },
  "signal.metric_spike": {
    name: "signal.metric_spike",
    displayName: STRATEGY_DEFINITIONS["signal.metric_spike"].title,
    desc: STRATEGY_DEFINITIONS["signal.metric_spike"].description,
    icon: Activity,
    keywords: [
      "volume spike",
      "volatility spike",
      "metric spike",
      "high volume",
      "abnormal volume",
      "surge",
    ],
  },
  "signal.metric_spike_down": {
    name: "signal.metric_spike_down",
    displayName: STRATEGY_DEFINITIONS["signal.metric_spike_down"].title,
    desc: STRATEGY_DEFINITIONS["signal.metric_spike_down"].description,
    icon: Activity,
    keywords: [
      "volume spike down",
      "selling volume",
      "high selling volume",
      "distribution volume",
      "capitulation",
    ],
  },
  "signal.metric_dip_up": {
    name: "signal.metric_dip_up",
    displayName: STRATEGY_DEFINITIONS["signal.metric_dip_up"].title,
    desc: STRATEGY_DEFINITIONS["signal.metric_dip_up"].description,
    icon: Activity,
    keywords: [
      "volume dip",
      "low volume rise",
      "price rise low volume",
      "divergence",
      "quiet rise",
    ],
  },
  "signal.metric_dip_down": {
    name: "signal.metric_dip_down",
    displayName: STRATEGY_DEFINITIONS["signal.metric_dip_down"].title,
    desc: STRATEGY_DEFINITIONS["signal.metric_dip_down"].description,
    icon: Activity,
    keywords: [
      "volume dip down",
      "low volume drop",
      "price drop low volume",
      "quiet drop",
      "drift down",
    ],
  },
  "signal.supertrend": {
    name: "signal.supertrend",
    displayName: STRATEGY_DEFINITIONS["signal.supertrend"].title,
    desc: STRATEGY_DEFINITIONS["signal.supertrend"].description,
    icon: TrendingUp,
    keywords: [
      "supertrend",
      "trend filter",
      "trend direction",
      "atr trail",
      "trend bias",
    ],
  },
  "manage.trailing_stop": {
    name: "manage.trailing_stop",
    displayName: STRATEGY_DEFINITIONS["manage.trailing_stop"].title,
    desc: STRATEGY_DEFINITIONS["manage.trailing_stop"].description,
    icon: Shield,
    keywords: [
      "trailing stop",
      "trail stop",
      "protect profit",
      "lock in gains",
      "moving stop",
      "trailing exit",
    ],
  },
  "manage.trailing_limit_buy": {
    name: "manage.trailing_limit_buy",
    displayName: STRATEGY_DEFINITIONS["manage.trailing_limit_buy"].title,
    desc: STRATEGY_DEFINITIONS["manage.trailing_limit_buy"].description,
    icon: Target,
    keywords: [
      "trailing limit buy",
      "trail buy",
      "buy stop limit",
      "chase buy",
    ],
  },
  "manage.trailing_buy": {
    name: "manage.trailing_buy",
    displayName: STRATEGY_DEFINITIONS["manage.trailing_buy"].title,
    desc: STRATEGY_DEFINITIONS["manage.trailing_buy"].description,
    icon: Target,
    keywords: [
      "trailing buy",
      "trailing entry",
      "dynamic entry",
    ],
  },
  "signal.trailing_limit_sell": {
    name: "signal.trailing_limit_sell",
    displayName: STRATEGY_DEFINITIONS["signal.trailing_limit_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.trailing_limit_sell"].description,
    icon: Target,
    keywords: [
      "trailing limit sell",
      "trail sell",
      "chase sell",
    ],
  },
  "manage.profit_scaling": {
    name: "manage.profit_scaling",
    displayName: STRATEGY_DEFINITIONS["manage.profit_scaling"].title,
    desc: STRATEGY_DEFINITIONS["manage.profit_scaling"].description,
    icon: Scale,
    keywords: [
      "profit scaling",
      "scale out",
      "take profit",
      "partial exit",
      "targets",
      "tp1",
      "tp2",
    ],
  },
  "signal.trend_pullback_sell": {
    name: "signal.trend_pullback_sell",
    displayName: STRATEGY_DEFINITIONS["signal.trend_pullback_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.trend_pullback_sell"].description,
    icon: GitPullRequest,
    keywords: [
      "trend pullback sell",
      "sell rally",
      "short bounce",
      "downtrend pullback",
    ],
  },
  "signal.range_mean_reversion_sell": {
    name: "signal.range_mean_reversion_sell",
    displayName: STRATEGY_DEFINITIONS["signal.range_mean_reversion_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.range_mean_reversion_sell"].description,
    icon: RefreshCw,
    keywords: [
      "mean reversion sell",
      "range sell",
      "fade",
      "overbought",
      "top of range",
      "fade resistance",
    ],
  },
  "signal.breakout_retest_sell": {
    name: "signal.breakout_retest_sell",
    displayName: STRATEGY_DEFINITIONS["signal.breakout_retest_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.breakout_retest_sell"].description,
    icon: Target,
    keywords: [
      "breakout retest sell",
      "breakdown retest",
      "bearish retest",
      "support turned resistance",
    ],
  },
  "signal.xs_momentum_sell": {
    name: "signal.xs_momentum_sell",
    displayName: STRATEGY_DEFINITIONS["signal.xs_momentum_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.xs_momentum_sell"].description,
    icon: Zap,
    keywords: [
      "momentum sell",
      "bear flag",
      "downside momentum",
      "continuation sell",
      "relative weakness",
    ],
  },
  "signal.pairs_relative_value_sell": {
    name: "signal.pairs_relative_value_sell",
    displayName: STRATEGY_DEFINITIONS["signal.pairs_relative_value_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.pairs_relative_value_sell"].description,
    icon: Layers,
    keywords: [
      "pairs sell",
      "relative value sell",
      "short leg",
      "divergence sell",
    ],
  },
  "signal.breakout_trendfollow_sell": {
    name: "signal.breakout_trendfollow_sell",
    displayName: STRATEGY_DEFINITIONS["signal.breakout_trendfollow_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.breakout_trendfollow_sell"].description,
    icon: TrendingDown,
    keywords: [
      "trend follow sell",
      "breakdown sell",
      "ride downtrend",
      "lower highs",
      "bearish trend",
    ],
  },
  "signal.squeeze_expansion_sell": {
    name: "signal.squeeze_expansion_sell",
    displayName: STRATEGY_DEFINITIONS["signal.squeeze_expansion_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.squeeze_expansion_sell"].description,
    icon: Maximize2,
    keywords: [
      "squeeze sell",
      "volatility expansion down",
      "breakdown squeeze",
      "bands expand down",
    ],
  },
  "signal.intermarket_trigger_sell": {
    name: "signal.intermarket_trigger_sell",
    displayName: STRATEGY_DEFINITIONS["signal.intermarket_trigger_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.intermarket_trigger_sell"].description,
    icon: Network,
    keywords: [
      "intermarket sell",
      "correlation sell",
      "lead lag sell",
      "macro trigger sell",
    ],
  },
  "signal.avwap_reversion_sell": {
    name: "signal.avwap_reversion_sell",
    displayName: STRATEGY_DEFINITIONS["signal.avwap_reversion_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.avwap_reversion_sell"].description,
    icon: BarChart3,
    keywords: [
      "avwap sell",
      "vwap resistance",
      "anchored vwap sell",
      "revert to mean sell",
    ],
  },
  "signal.event_followthrough_sell": {
    name: "signal.event_followthrough_sell",
    displayName: STRATEGY_DEFINITIONS["signal.event_followthrough_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.event_followthrough_sell"].description,
    icon: Calendar,
    keywords: [
      "event sell",
      "news sell",
      "earnings miss",
      "bad news followthrough",
      "macro sell",
    ],
  },
  "signal.gap_play_sell": {
    name: "signal.gap_play_sell",
    displayName: STRATEGY_DEFINITIONS["signal.gap_play_sell"].title,
    desc: STRATEGY_DEFINITIONS["signal.gap_play_sell"].description,
    icon: ArrowRight,
    keywords: [
      "gap sell",
      "gap down",
      "gap and go down",
      "fade gap up",
    ],
  },
  "signal.trailing_limit_buy": {
    name: "signal.trailing_limit_buy",
    displayName: STRATEGY_DEFINITIONS["signal.trailing_limit_buy"].title,
    desc: STRATEGY_DEFINITIONS["signal.trailing_limit_buy"].description,
    icon: Target,
    keywords: ["trailing limit buy", "trailing buy limit", "chase buy"],
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
    const nameWithoutPrefix = fullName
      .replace("signal.", "")
      .replace("overlay.", "");
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
  
  // Return detailed config if available
  if (ARCHETYPE_CONFIGS[archetype]) {
    return ARCHETYPE_CONFIGS[archetype];
  }

  // Fallback to basic definition if available
  const def = STRATEGY_DEFINITIONS[archetype];
  if (def) {
    return {
      name: def.type,
      displayName: def.title,
      desc: def.description,
      keywords: [], // No keywords for strategies without detection logic
    };
  }

  return null;
}
