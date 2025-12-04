"use client";

import type { TradingArchetype } from "@/types";

interface StrategyVisualizerProps {
  type: TradingArchetype;
  variant?: "light" | "dark"; // light = for dark backgrounds, dark = for light backgrounds
}

// Color schemes for different backgrounds
const colorSchemes = {
  light: {
    // For dark backgrounds (like intelligence view)
    gridLine: "#e5e7eb",
    gridLineSoft: "#d6d3d1",
    priceLine: "#57534e",
    secondary: "#a8a29e",
    textMuted: "fill-stone-400",
    textDark: "fill-stone-800 dark:fill-stone-200",
  },
  dark: {
    // For light backgrounds (like dashboard)
    gridLine: "#a8a29e",
    gridLineSoft: "#78716c",
    priceLine: "#57534e",
    secondary: "#78716c",
    textMuted: "fill-stone-500",
    textDark: "fill-stone-700",
  },
};

export function StrategyVisualizer({
  type,
  variant = "dark",
}: StrategyVisualizerProps) {
  const colors = colorSchemes[variant];

  // Map archetype to visualization case
  const getVisualizationCase = (archetype: TradingArchetype): string => {
    switch (archetype) {
      case "signal.range_mean_reversion":
        return "reversion";
      case "signal.breakout_retest":
        return "breakout";
      case "signal.xs_momentum":
        return "momentum";
      case "signal.pairs_relative_value":
        return "pairs";
      case "signal.trend_pullback":
        return "pullback";
      case "signal.breakout_trendfollow":
        return "trend_follow";
      case "signal.squeeze_expansion":
        return "squeeze";
      case "signal.intermarket_trigger":
        return "intermarket";
      case "signal.avwap_reversion":
        return "avwap";
      case "signal.event_followthrough":
        return "event";
      case "signal.gap_play":
        return "gap";
      case "signal.liquidity_sweep":
        return "liquidity";
      default:
        return "pullback";
    }
  };

  const visualizationType = getVisualizationCase(type);

  switch (visualizationType) {
    case "reversion":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <g stroke={colors.gridLine} strokeWidth="1">
            <line x1="0" y1="30" x2="400" y2="30" strokeDasharray="4 4" />
            <line x1="0" y1="130" x2="400" y2="130" strokeDasharray="4 4" />
          </g>
          <rect
            x="0"
            y="30"
            width="400"
            height="100"
            fill="rgba(245, 158, 11, 0.03)"
          />
          <path
            d="M 20 80 Q 60 130 100 80 T 180 80 T 260 125 T 340 35"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="260"
              cy="125"
              r="20"
              fill="rgba(245, 158, 11, 0.1)"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="260" cy="125" r="4" fill="#f59e0b" />
          </g>
          <text
            x="260"
            y="160"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Mean Reversion
          </text>
        </svg>
      );

    case "breakout":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <line
            x1="0"
            y1="60"
            x2="400"
            y2="60"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 120 L 150 60 L 220 100 L 260 60"
            fill="none"
            stroke={colors.gridLineSoft}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <path
            d="M 50 120 L 150 60 L 220 100 L 260 60 L 280 60 L 300 30 L 350 10"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="280"
              cy="60"
              r="20"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="280" cy="60" r="4" fill="#10b981" />
          </g>
          <text
            x="150"
            y="50"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Resistance
          </text>
          <text
            x="280"
            y="95"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Retest Entry
          </text>
        </svg>
      );

    case "momentum":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <path
            d="M 40 140 C 140 135, 200 120, 240 80 L 260 80 L 350 10"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="235"
            y="70"
            width="30"
            height="20"
            fill="none"
            stroke={colors.gridLineSoft}
            strokeWidth="1"
            strokeDasharray="2 2"
            transform="rotate(-10 250 80)"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="265"
              cy="75"
              r="20"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="265" cy="75" r="4" fill="#3b82f6" />
          </g>
          <text
            x="265"
            y="120"
            textAnchor="middle"
            className="text-[10px] fill-blue-600 font-bold font-sans uppercase tracking-wide"
          >
            Momentum Flag
          </text>
        </svg>
      );

    case "pairs":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <line
            x1="40"
            y1="80"
            x2="360"
            y2="80"
            stroke={colors.gridLine}
            strokeWidth="2"
          />
          <path
            d="M 40 80 Q 120 70 200 40 T 360 80"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 40 80 Q 120 90 200 120 T 360 80"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="200"
            y1="40"
            x2="200"
            y2="120"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle cx="200" cy="80" r="4" fill="#f59e0b" />
          </g>
          <text
            x="200"
            y="20"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Max Divergence
          </text>
        </svg>
      );

    case "trend_follow":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <line
            x1="20"
            y1="140"
            x2="380"
            y2="20"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M 20 140 L 80 100 L 120 110 L 200 60 L 240 70 L 320 20 L 360 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="110" r="3" fill={colors.secondary} />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="240"
              cy="70"
              r="20"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="240" cy="70" r="4" fill="#10b981" />
          </g>
          <text
            x="120"
            y="130"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Higher Low
          </text>
          <text
            x="240"
            y="95"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Continuation
          </text>
        </svg>
      );

    case "squeeze":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <path
            d="M 20 50 Q 150 70 200 75 Q 300 70 380 20"
            fill="none"
            stroke={colors.gridLineSoft}
            strokeWidth="1"
          />
          <path
            d="M 20 110 Q 150 90 200 85 Q 300 90 380 140"
            fill="none"
            stroke={colors.gridLineSoft}
            strokeWidth="1"
          />
          <path
            d="M 20 50 Q 150 70 200 75 Q 300 70 380 20 V 140 Q 300 90 200 85 Q 150 90 20 110 Z"
            fill={
              variant === "dark"
                ? "rgba(59, 130, 246, 0.08)"
                : "rgba(59, 130, 246, 0.05)"
            }
          />
          <path
            d="M 20 80 L 60 90 L 100 70 L 140 85 L 180 80 L 220 82 L 260 60 L 320 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="220"
              cy="82"
              r="20"
              fill="rgba(245, 158, 11, 0.1)"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="220" cy="82" r="4" fill="#f59e0b" />
          </g>
          <text
            x="200"
            y="105"
            textAnchor="middle"
            className="text-[10px] fill-stone-500 font-bold font-sans uppercase tracking-wide"
          >
            Compression
          </text>
          <text
            x="320"
            y="50"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Expansion
          </text>
        </svg>
      );

    case "intermarket":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <path
            d="M 20 60 L 100 60 L 150 30 L 250 25"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x="150"
            y="20"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Yields (Lead)
          </text>
          <path
            d="M 20 120 L 120 120 L 180 120 L 220 140 L 300 90"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="150"
            y1="30"
            x2="180"
            y2="120"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle cx="180" cy="120" r="4" fill="#f59e0b" />
          </g>
          <text
            x="300"
            y="80"
            textAnchor="middle"
            className={`text-[10px] font-bold font-sans uppercase tracking-wide ${colors.textDark}`}
          >
            Tech (Lag)
          </text>
          <text
            x="165"
            y="80"
            textAnchor="middle"
            transform="rotate(70 165 80)"
            className="text-[9px] fill-amber-600 font-mono uppercase tracking-widest"
          >
            Correlation Trigger
          </text>
        </svg>
      );

    case "avwap":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <path
            d="M 20 140 Q 100 100 200 90 T 380 60"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <path
            d="M 20 140 L 60 110 L 100 60 L 140 40 L 180 60 L 220 92 L 280 70"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="140" r="3" fill="#3b82f6" />
          <text
            x="30"
            y="155"
            className="text-[10px] fill-blue-500 font-bold font-sans uppercase tracking-wide"
          >
            Anchor
          </text>
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="220"
              cy="92"
              r="20"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="220" cy="92" r="4" fill="#3b82f6" />
          </g>
          <text
            x="220"
            y="120"
            textAnchor="middle"
            className={`text-[10px] font-bold font-sans uppercase tracking-wide ${colors.textDark}`}
          >
            Mean Reversion
          </text>
        </svg>
      );

    case "event":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <line
            x1="150"
            y1="20"
            x2="150"
            y2="140"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <text
            x="150"
            y="155"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Catalyst
          </text>
          <path
            d="M 20 100 L 80 95 L 140 100"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="2"
          />
          <path
            d="M 160 80 L 180 40 L 220 50 L 260 30 L 320 10"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="155"
            y="40"
            width="10"
            height="60"
            fill="rgba(239, 68, 68, 0.1)"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle cx="220" cy="50" r="4" fill="#10b981" />
          </g>
          <text
            x="260"
            y="70"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Follow Through
          </text>
        </svg>
      );

    case "gap":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <line
            x1="20"
            y1="120"
            x2="100"
            y2="110"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="100" cy="110" r="3" fill={colors.priceLine} />
          <text
            x="100"
            y="125"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Close
          </text>
          <rect
            x="100"
            y="60"
            width="40"
            height="50"
            fill="rgba(16, 185, 129, 0.05)"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x="120"
            y="88"
            textAnchor="middle"
            className="text-[9px] fill-emerald-600 font-bold font-sans uppercase tracking-widest"
          >
            GAP
          </text>
          <path
            d="M 140 60 L 180 50 L 220 55 L 280 20 L 340 10"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle cx="140" cy="60" r="4" fill="#10b981" />
          </g>
          <text
            x="140"
            y="45"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textDark}`}
          >
            Open
          </text>
          <text
            x="280"
            y="40"
            textAnchor="middle"
            className={`text-[10px] font-bold font-sans uppercase tracking-wide ${colors.textDark}`}
          >
            Gap & Go
          </text>
        </svg>
      );

    case "liquidity":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          {/* Support Line */}
          <line
            x1="20"
            y1="110"
            x2="380"
            y2="110"
            stroke={colors.secondary}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="50"
            y="100"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Key Support
          </text>

          {/* Price Action */}
          <path
            d="M 20 80 L 60 110 L 100 90 L 140 110 L 180 140 L 220 110 L 260 70 L 320 50"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sweep Zone */}
          <circle
            cx="180"
            cy="140"
            r="15"
            fill="rgba(239, 68, 68, 0.1)"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x="180"
            y="160"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Stop Hunt
          </text>

          {/* Reclaim */}
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle cx="220" cy="110" r="4" fill="#10b981" />
          </g>
          <text
            x="240"
            y="100"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Reclaim
          </text>
        </svg>
      );

    case "pullback":
    default:
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          <line
            x1="50"
            y1="140"
            x2="350"
            y2="20"
            stroke={colors.gridLine}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 140 C 80 120, 100 110, 130 90 S 150 70, 170 100 C 180 115, 190 115, 210 80 S 300 40, 350 20"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="animate-[pulse_3s_ease-in-out_infinite]">
            <circle
              cx="178"
              cy="105"
              r="20"
              fill="rgba(245, 158, 11, 0.1)"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="178" cy="105" r="4" fill="#f59e0b" />
          </g>
          <text
            x="90"
            y="85"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Impulse
          </text>
          <text
            x="178"
            y="145"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Correction Entry
          </text>
          <line
            x1="178"
            y1="125"
            x2="178"
            y2="135"
            stroke="#f59e0b"
            strokeWidth="1"
          />
          <text
            x="280"
            y="45"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Continuation
          </text>
        </svg>
      );
  }
}
