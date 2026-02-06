/**
 * Expand compact backtest formats from the API into verbose formats
 * expected by chart components.
 *
 * Compact indicator format (from API):
 *   { "_offsets": { "ema_20": 20 }, "ema_20": [45.2, 45.5, ...] }
 *   Band: { "bb_20": [[lower, middle, upper], ...] }
 *
 * Verbose indicator format (for charts):
 *   { "ema_20": [{ time: "...", value: 45.2 }, ...] }
 *   Band: { "bb_20": [{ time: "...", lower: 44.0, middle: 45.2, upper: 46.4 }, ...] }
 */

import type { OHLCVBar } from "./vibe-api";

type VerboseIndicatorPoint = Record<string, any>;
type VerboseIndicators = Record<string, VerboseIndicatorPoint[]>;

/**
 * Expand compact indicator format to verbose format for chart rendering.
 *
 * Returns undefined if indicators are missing or empty.
 * Expects compact format (flat arrays). Must be deployed alongside vibe-trade compact format.
 */
export function expandIndicators(
  indicators: Record<string, any> | undefined | null,
  ohlcvBars: OHLCVBar[] | undefined | null,
): VerboseIndicators | undefined {
  if (!indicators || !ohlcvBars?.length) return undefined;

  const offsets: Record<string, number> = indicators._offsets ?? {};
  const result: VerboseIndicators = {};

  for (const [name, values] of Object.entries(indicators)) {
    if (name === "_offsets") continue;
    if (!Array.isArray(values) || values.length === 0) continue;

    const offset = offsets[name] ?? 0;
    const expanded: VerboseIndicatorPoint[] = [];

    for (let i = 0; i < values.length; i++) {
      const barIndex = offset + i;
      if (barIndex >= ohlcvBars.length) break;

      const time = ohlcvBars[barIndex].time;
      const val = values[i];

      if (Array.isArray(val) && val.length === 3) {
        // Band indicator: [lower, middle, upper]
        expanded.push({ time, lower: val[0], middle: val[1], upper: val[2] });
      } else {
        // Simple indicator: float
        expanded.push({ time, value: val });
      }
    }

    result[name] = expanded;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
