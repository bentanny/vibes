import { type ClassValue, clsx } from "clsx"
import type { TradingArchetype } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Card role types used across the application
 */
export type CardRole = "entry" | "exit" | "gate" | "overlay";

/**
 * HeroUI color types for chips and badges
 */
export type HeroUIColor = "success" | "danger" | "warning" | "primary" | "default" | "secondary";

/**
 * Get the HeroUI color for a card role.
 * Used consistently across strategy list, detail, and editor components.
 */
export function getRoleColor(role: string): HeroUIColor {
  switch (role) {
    case "entry":
      return "success";
    case "exit":
      return "danger";
    case "gate":
      return "warning";
    case "overlay":
      return "primary";
    default:
      return "default";
  }
}

/**
 * Get the Tailwind background class for a card role dot indicator.
 */
export function getRoleDotColor(role: string): string {
  switch (role) {
    case "entry":
      return "bg-success";
    case "exit":
      return "bg-danger";
    case "gate":
      return "bg-warning";
    case "overlay":
      return "bg-primary";
    default:
      return "bg-default";
  }
}

/**
 * Format a date string for display in a consistent manner.
 * @param dateString - ISO date string
 * @param style - Display style: "short" (Jan 15), "medium" (Jan 15, 2024), "long" (January 15, 2024)
 */
export function formatDisplayDate(
  dateString: string,
  style: "short" | "medium" | "long" = "medium"
): string {
  const date = new Date(dateString);

  switch (style) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "medium":
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  }
}

/**
 * Format a date string with time for display.
 */
export function formatDisplayDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date range for display.
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDisplayDate(dateString, "short");
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

