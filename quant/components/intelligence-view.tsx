"use client";

import React from "react";
import { motion } from "framer-motion";

// Strategy Visualizer Component
const StrategyVisualizer = ({ type }: { type: string }) => {
  switch (type) {
    case "reversion":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible z-10"
        >
          <g stroke="#e5e7eb" strokeWidth="1">
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
          className="w-full h-full overflow-visible z-10"
        >
          <line
            x1="0"
            y1="60"
            x2="400"
            y2="60"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 120 L 150 60 L 220 100 L 260 60"
            fill="none"
            stroke="#d6d3d1"
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
            className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
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
          className="w-full h-full overflow-visible z-10"
        >
          <path
            d="M 40 140 C 140 135, 200 120, 240 80 L 260 80 L 350 10"
            fill="none"
            stroke="#57534e"
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
            stroke="#d6d3d1"
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
          className="w-full h-full overflow-visible z-10"
        >
          <line
            x1="40"
            y1="80"
            x2="360"
            y2="80"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <path
            d="M 40 80 Q 120 70 200 40 T 360 80"
            fill="none"
            stroke="#a8a29e"
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
            className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
          >
            Max Divergence
          </text>
        </svg>
      );

    case "trend_follow":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible z-10"
        >
          <line
            x1="20"
            y1="140"
            x2="380"
            y2="20"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M 20 140 L 80 100 L 120 110 L 200 60 L 240 70 L 320 20 L 360 30"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="110" r="3" fill="#a8a29e" />
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
            className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
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
          className="w-full h-full overflow-visible z-10"
        >
          <path
            d="M 20 50 Q 150 70 200 75 Q 300 70 380 20"
            fill="none"
            stroke="#d6d3d1"
            strokeWidth="1"
          />
          <path
            d="M 20 110 Q 150 90 200 85 Q 300 90 380 140"
            fill="none"
            stroke="#d6d3d1"
            strokeWidth="1"
          />
          <path
            d="M 20 50 Q 150 70 200 75 Q 300 70 380 20 V 140 Q 300 90 200 85 Q 150 90 20 110 Z"
            fill="rgba(59, 130, 246, 0.05)"
          />
          <path
            d="M 20 80 L 60 90 L 100 70 L 140 85 L 180 80 L 220 82 L 260 60 L 320 30"
            fill="none"
            stroke="#57534e"
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
          className="w-full h-full overflow-visible z-10"
        >
          <path
            d="M 20 60 L 100 60 L 150 30 L 250 25"
            fill="none"
            stroke="#a8a29e"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x="150"
            y="20"
            textAnchor="middle"
            className="text-[10px] fill-stone-400 font-sans uppercase tracking-wide"
          >
            Yields (Lead)
          </text>
          <path
            d="M 20 120 L 120 120 L 180 120 L 220 140 L 300 90"
            fill="none"
            stroke="#57534e"
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
            className="text-[10px] fill-stone-800 dark:fill-stone-200 font-bold font-sans uppercase tracking-wide"
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
          className="w-full h-full overflow-visible z-10"
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
            stroke="#57534e"
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
            className="text-[10px] fill-stone-600 dark:fill-stone-300 font-bold font-sans uppercase tracking-wide"
          >
            Mean Reversion
          </text>
        </svg>
      );

    case "event":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible z-10"
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
            stroke="#a8a29e"
            strokeWidth="2"
          />
          <path
            d="M 160 80 L 180 40 L 220 50 L 260 30 L 320 10"
            fill="none"
            stroke="#57534e"
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
          className="w-full h-full overflow-visible z-10"
        >
          <line
            x1="20"
            y1="120"
            x2="100"
            y2="110"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="100" cy="110" r="3" fill="#57534e" />
          <text
            x="100"
            y="125"
            textAnchor="middle"
            className="text-[10px] fill-stone-400 font-sans uppercase tracking-wide"
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
            stroke="#57534e"
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
            className="text-[10px] fill-stone-800 dark:fill-stone-200 font-sans uppercase tracking-wide"
          >
            Open
          </text>
          <text
            x="280"
            y="40"
            textAnchor="middle"
            className="text-[10px] fill-stone-600 dark:fill-stone-300 font-bold font-sans uppercase tracking-wide"
          >
            Gap & Go
          </text>
        </svg>
      );

    case "liquidity":
      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible z-10"
        >
          {/* Support Line */}
          <line
            x1="20"
            y1="110"
            x2="380"
            y2="110"
            stroke="#a8a29e"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="50"
            y="100"
            className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
          >
            Key Support
          </text>

          {/* Price Action */}
          <path
            d="M 20 80 L 60 110 L 100 90 L 140 110 L 180 140 L 220 110 L 260 70 L 320 50"
            fill="none"
            stroke="#57534e"
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
          className="w-full h-full overflow-visible z-10"
        >
          <line
            x1="50"
            y1="140"
            x2="350"
            y2="20"
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 140 C 80 120, 100 110, 130 90 S 150 70, 170 100 C 180 115, 190 115, 210 80 S 300 40, 350 20"
            fill="none"
            stroke="#57534e"
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
            className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
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
            className="text-[10px] fill-stone-400 font-sans font-medium uppercase tracking-wide"
          >
            Continuation
          </text>
        </svg>
      );
  }
};

// Strategy Card Component
interface StrategyCardProps {
  type: string;
  title: string;
  description: string;
  color: "amber" | "emerald" | "blue" | "red";
  index: number;
}

const colorClasses = {
  amber: {
    border: "border-amber-500/20 hover:border-amber-500/40",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    glow: "group-hover:shadow-amber-500/5",
  },
  emerald: {
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/5",
  },
  blue: {
    border: "border-blue-500/20 hover:border-blue-500/40",
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    glow: "group-hover:shadow-blue-500/5",
  },
  red: {
    border: "border-red-500/20 hover:border-red-500/40",
    badge: "bg-red-500/10 text-red-500 border-red-500/30",
    glow: "group-hover:shadow-red-500/5",
  },
};

const StrategyCard = ({
  type,
  title,
  description,
  color,
  index,
}: StrategyCardProps) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={`group relative bg-white/5 backdrop-blur-sm border ${colors.border} rounded-2xl p-6 transition-all duration-500 hover:bg-white/8 ${colors.glow} hover:shadow-2xl cursor-pointer`}
    >
      {/* Badge */}
      <div
        className={`absolute top-4 right-4 px-2.5 py-1 text-[10px] uppercase tracking-widest font-medium border rounded-full ${colors.badge}`}
      >
        {color === "emerald"
          ? "Trend"
          : color === "blue"
            ? "Technical"
            : color === "red"
              ? "Event"
              : "Mean Reversion"}
      </div>

      {/* Visualization */}
      <div className="h-32 mb-6 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        <StrategyVisualizer type={type} />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-md font-medium text-white/90 group-hover:text-white transition-colors tracking-wide uppercase">
          {title}
        </h3>
        <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
          {description}
        </p>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:w-3/4 transition-all duration-500" />
    </motion.div>
  );
};

// Strategy data
const strategies: StrategyCardProps[] = [
  {
    type: "pullback",
    title: "Trend Pullback",
    description:
      "Enter during temporary corrections within a strong trend, buying dips at key support levels.",
    color: "amber",
    index: 0,
  },
  {
    type: "reversion",
    title: "Mean Reversion",
    description:
      "Capitalize on price extremes that tend to return to their statistical average over time.",
    color: "amber",
    index: 1,
  },
  {
    type: "breakout",
    title: "Breakout Retest",
    description:
      "Enter when price breaks resistance, pulls back to retest, and confirms the new support level.",
    color: "emerald",
    index: 2,
  },
  {
    type: "momentum",
    title: "Momentum Flag",
    description:
      "Identify consolidation patterns during strong moves that signal continuation of the trend.",
    color: "blue",
    index: 3,
  },
  {
    type: "pairs",
    title: "Pairs Trading",
    description:
      "Trade the spread between correlated assets when they diverge beyond historical norms.",
    color: "amber",
    index: 4,
  },
  {
    type: "trend_follow",
    title: "Trend Following",
    description:
      "Ride extended directional moves by entering on higher lows and exiting on trend breaks.",
    color: "emerald",
    index: 5,
  },
  {
    type: "squeeze",
    title: "Volatility Squeeze",
    description:
      "Enter when Bollinger Bands contract, anticipating an explosive expansion move.",
    color: "amber",
    index: 6,
  },
  {
    type: "intermarket",
    title: "Intermarket Analysis",
    description:
      "Trade assets based on leading relationships with bonds, currencies, or commodities.",
    color: "blue",
    index: 7,
  },
  {
    type: "avwap",
    title: "Anchored VWAP",
    description:
      "Use volume-weighted average price from key events as dynamic support and resistance.",
    color: "blue",
    index: 8,
  },
  {
    type: "event",
    title: "Event-Driven",
    description:
      "Position around earnings, catalysts, or news events that create volatility opportunities.",
    color: "red",
    index: 9,
  },
  {
    type: "gap",
    title: "Gap Trading",
    description:
      "Trade opening gaps that show strong continuation momentum with follow-through volume.",
    color: "emerald",
    index: 10,
  },
  {
    type: "liquidity",
    title: "Liquidity Sweep",
    description:
      "Enter after stop hunts clear weak hands below support, then reclaim the key level.",
    color: "red",
    index: 11,
  },
];

// Main Intelligence View Component
export const IntelligenceView = ({ imgSrc }: { imgSrc: string }) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "https://images.unsplash.com/photo-1544084944-15a3ad96e9d4?q=80&w=1920&auto=format&fit=crop";
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] text-white overflow-y-auto">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={imgSrc}
            onError={handleImgError}
            alt="Classical Fresco"
            className="w-full h-full object-cover opacity-25 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-32 pb-20 px-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
              Strategy Library
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif font-medium leading-tight text-white/90">
            Trading <span className="italic text-amber-100">Archetypes</span>
          </h2>
          <p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Twelve fundamental patterns that power algorithmic trading
            strategies. Select a pattern to deploy with our AI execution engine.
          </p>
          <div className="w-24 h-[1px] bg-white/30 mx-auto mt-8" />
        </motion.div>

        {/* Strategy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.type} {...strategy} />
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-white/30 uppercase tracking-[0.2em]">
            Select a strategy to configure and deploy
          </p>
        </motion.div>
      </div>
    </div>
  );
};
