import { type ClassValue, clsx } from "clsx"
import type { TradingArchetype } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

type ArchetypeColorScheme = "blue" | "emerald" | "amber"

/**
 * Get the color scheme for an archetype based on its visualization accent color
 */
export function getArchetypeColorScheme(
  archetype: TradingArchetype | null
): ArchetypeColorScheme {
  if (!archetype) return "amber"

  // Blue: momentum, avwap
  if (
    archetype === "signal.xs_momentum" ||
    archetype === "signal.avwap_reversion"
  ) {
    return "blue"
  }

  // Emerald: breakout, trend follow, event, gap, liquidity
  if (
    archetype === "signal.breakout_retest" ||
    archetype === "signal.breakout_trendfollow" ||
    archetype === "signal.event_followthrough" ||
    archetype === "signal.gap_play" ||
    archetype === "signal.liquidity_sweep"
  ) {
    return "emerald"
  }

  // Amber: reversion, pairs, squeeze, intermarket, pullback (default)
  return "amber"
}

/**
 * Get Tailwind classes for archetype colors
 */
export function getArchetypeColorClasses(archetype: TradingArchetype | null) {
  const scheme = getArchetypeColorScheme(archetype)

  const colors = {
    blue: {
      dot: "bg-blue-500",
      chipBg: "bg-blue-100",
      chipText: "text-blue-700",
      chipBorder: "border-blue-200",
    },
    emerald: {
      dot: "bg-emerald-500",
      chipBg: "bg-emerald-100",
      chipText: "text-emerald-700",
      chipBorder: "border-emerald-200",
    },
    amber: {
      dot: "bg-amber-500",
      chipBg: "bg-amber-100",
      chipText: "text-amber-700",
      chipBorder: "border-amber-200",
    },
  }

  return colors[scheme]
}

