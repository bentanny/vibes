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
  "overlay.seasonality_tod": null,
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

