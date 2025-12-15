"use client";

import React from "react";
import { TrendPullbackVisualization } from "./trend-pullback";
import type { TradingArchetype } from "@/types";

// Map archetypes to their visualization components
const visualizationMap: Record<
  TradingArchetype,
  React.ComponentType | null
> = {
  "signal.trend_pullback": TrendPullbackVisualization,
  "signal.range_mean_reversion": null,
  "signal.breakout_trendfollow": null,
  "signal.breakout_retest": null,
  "signal.squeeze_expansion": null,
  "signal.xs_momentum": null,
  "signal.pairs_relative_value": null,
  "signal.intermarket_trigger": null,
  "signal.avwap_reversion": null,
  "signal.event_followthrough": null,
  "signal.gap_play": null,
  "signal.liquidity_sweep": null,
  "overlay.seasonality_tod": null,
  "execution.dca": null,
  "execution.time_window": null,
  "execution.scheduled": null,
  "signal.percent_dip": null,
  "signal.price_limit": null,
  "signal.metric_spike": null,
  "signal.supertrend": null,
  "manage.trailing_stop": null,
  "manage.profit_scaling": null,
  "execution.dca_sell": null,
  "signal.price_limit_sell": null,
  "signal.percent_spike": null,
  "signal.trailing_limit_sell": null,
  "signal.trailing_limit_buy": null,
  "signal.metric_spike_down": null,
  "signal.metric_dip_up": null,
  "signal.metric_dip_down": null,
  "manage.trailing_buy": null,
  "manage.trailing_limit_buy": null,
  "signal.trend_pullback_sell": null,
  "signal.range_mean_reversion_sell": null,
  "signal.breakout_retest_sell": null,
  "signal.xs_momentum_sell": null,
  "signal.pairs_relative_value_sell": null,
  "signal.breakout_trendfollow_sell": null,
  "signal.squeeze_expansion_sell": null,
  "signal.intermarket_trigger_sell": null,
  "signal.avwap_reversion_sell": null,
  "signal.event_followthrough_sell": null,
  "signal.gap_play_sell": null,
};

/**
 * Gets the visualization component for a given archetype
 */
export function getArchetypeVisualization(
  archetype: TradingArchetype | null,
): React.ComponentType | null {
  if (!archetype) return null;
  return visualizationMap[archetype] || null;
}

// Export individual components for direct use if needed
export { TrendPullbackVisualization };

