"use client";

import React from "react";
import { motion } from "framer-motion";
import { StrategyVisualizer } from "./archetype-visualizations";
import type { TradingArchetype } from "@/types";

// Strategy Card Component
interface StrategyCardProps {
  type: TradingArchetype; // Ensure exact type match
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

      {/* Visualization with Animation Trigger */}
      <div className="h-32 mb-6 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        {/* We wrap StrategyVisualizer in a motion.div that sets the 'animate' state based on hover */}
        <motion.div
          className="w-full h-full"
          initial="static"
          whileHover="active"
        >
          <StrategyVisualizer type={type} variant="light" />
        </motion.div>
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
    type: "execution.dca",
    title: "Recurring Investment",
    description:
      "Automate steady accumulation by buying a fixed dollar amount at regular intervals.",
    color: "blue",
    index: 0,
  },
  {
    type: "execution.dca_sell",
    title: "Recurring Divestment",
    description:
      "Automate steady distribution by selling a fixed dollar amount at regular intervals.",
    color: "red",
    index: 1,
  },
  {
    type: "execution.time_window",
    title: "Time-Based Execution",
    description:
      "Restrict trading to specific market hours to capitalize on peak liquidity periods.",
    color: "blue",
    index: 2,
  },
  {
    type: "execution.scheduled",
    title: "Scheduled Execution",
    description:
      "Execute trades at specific recurring times, such as every Monday at 9am or the 1st of each month.",
    color: "blue",
    index: 3,
  },
  {
    type: "signal.percent_dip",
    title: "Dip Buying",
    description:
      "Enter positions when asset price drops by a defined percentage from local highs.",
    color: "amber",
    index: 4,
  },
  {
    type: "signal.percent_spike",
    title: "Spike Selling",
    description:
      "Exit positions when asset price spikes by a defined percentage from local lows.",
    color: "emerald",
    index: 5,
  },
  {
    type: "signal.price_limit",
    title: "Limit Orders",
    description:
      "Execute trades only when price touches a specific psychological or technical level.",
    color: "emerald",
    index: 6,
  },
  {
    type: "signal.price_limit_sell",
    title: "Limit Order (Sell)",
    description:
      "Execute sell trades when price rises to touch a specific resistance or technical level.",
    color: "red",
    index: 7,
  },
  {
    type: "signal.metric_spike",
    title: "Volume Spike",
    description:
      "Trigger entries when volume or volatility metrics exceed their standard deviation.",
    color: "red",
    index: 8,
  },
  {
    type: "signal.metric_spike_down",
    title: "Volume Spike (Bearish)",
    description:
      "Trigger entries when volume spikes during a price decline, signaling distribution.",
    color: "red",
    index: 9,
  },
  {
    type: "signal.metric_dip_up",
    title: "Volume Dip (Bullish)",
    description:
      "Trade when volume contracts during a price increase, signaling accumulation.",
    color: "blue",
    index: 10,
  },
  {
    type: "signal.metric_dip_down",
    title: "Volume Dip (Bearish)",
    description:
      "Trade when both volume and price decline, signaling distribution.",
    color: "red",
    index: 11,
  },
  {
    type: "signal.supertrend",
    title: "Trend Filtering",
    description:
      "Stay in trades only while the Supertrend indicator confirms the directional bias.",
    color: "emerald",
    index: 12,
  },
  {
    type: "manage.trailing_stop",
    title: "Trailing Stop",
    description:
      "Protect gains by automatically adjusting stop-loss levels as price moves in your favor.",
    color: "red",
    index: 13,
  },
  {
    type: "manage.trailing_limit_buy",
    title: "Trailing Limit Buy",
    description:
      "Enter positions when price breaks above a trailing resistance level.",
    color: "emerald",
    index: 15,
  },
  {
    type: "manage.trailing_buy",
    title: "Trailing Buy",
    description:
      "Enter positions when price breaks above a trailing resistance level.",
    color: "emerald",
    index: 14,
  },
  {
    type: "signal.trailing_limit_sell",
    title: "Trailing Limit Sell",
    description:
      "Trigger sells when price breaks above a trailing resistance level.",
    color: "red",
    index: 38,
  },
  {
    type: "manage.profit_scaling",
    title: "Profit Scaling",
    description:
      "Systematically exit portions of your position at pre-defined profit targets.",
    color: "amber",
    index: 14,
  },
  {
    type: "signal.trend_pullback",
    title: "Trend Pullback",
    description:
      "Enter during temporary corrections within a strong trend, buying dips at key support levels.",
    color: "amber",
    index: 15,
  },
  {
    type: "signal.trend_pullback_sell",
    title: "Trend Pullback Sell",
    description:
      "Exit during temporary rallies within a strong downtrend, selling bounces at key resistance levels.",
    color: "red",
    index: 16,
  },
  {
    type: "signal.range_mean_reversion",
    title: "Mean Reversion",
    description:
      "Capitalize on price extremes that tend to return to their statistical average over time.",
    color: "amber",
    index: 17,
  },
  {
    type: "signal.range_mean_reversion_sell",
    title: "Mean Reversion Sell",
    description:
      "Capitalize on price extremes at the upper band that tend to return to their statistical average.",
    color: "red",
    index: 18,
  },
  {
    type: "signal.breakout_retest",
    title: "Breakout Retest",
    description:
      "Enter when price breaks resistance, pulls back to retest, and confirms the new support level.",
    color: "emerald",
    index: 19,
  },
  {
    type: "signal.breakout_retest_sell",
    title: "Breakdown Retest",
    description:
      "Exit when price breaks support, pulls back to retest, and confirms the new resistance level.",
    color: "red",
    index: 20,
  },
  {
    type: "signal.xs_momentum",
    title: "Momentum Flag",
    description:
      "Identify consolidation patterns during strong moves that signal continuation of the trend.",
    color: "blue",
    index: 21,
  },
  {
    type: "signal.xs_momentum_sell",
    title: "Momentum Flag Sell",
    description:
      "Identify consolidation patterns during strong downward moves that signal continuation of the decline.",
    color: "red",
    index: 22,
  },
  {
    type: "signal.pairs_relative_value",
    title: "Pairs Trading",
    description:
      "Trade the spread between correlated assets when they diverge beyond historical norms.",
    color: "amber",
    index: 23,
  },
  {
    type: "signal.pairs_relative_value_sell",
    title: "Pairs Trading Sell",
    description:
      "Trade the spread by selling the outperforming asset when pairs diverge beyond historical norms.",
    color: "red",
    index: 24,
  },
  {
    type: "signal.breakout_trendfollow",
    title: "Trend Following",
    description:
      "Ride extended directional moves by entering on higher lows and exiting on trend breaks.",
    color: "emerald",
    index: 25,
  },
  {
    type: "signal.breakout_trendfollow_sell",
    title: "Trend Following Sell",
    description:
      "Ride extended downward moves by entering on lower highs and exiting on trend breaks.",
    color: "red",
    index: 26,
  },
  {
    type: "signal.squeeze_expansion",
    title: "Volatility Squeeze",
    description:
      "Enter when Bollinger Bands contract, anticipating an explosive expansion move.",
    color: "amber",
    index: 27,
  },
  {
    type: "signal.squeeze_expansion_sell",
    title: "Volatility Squeeze Sell",
    description:
      "Enter when Bollinger Bands contract, anticipating an explosive downward expansion move.",
    color: "red",
    index: 28,
  },
  {
    type: "signal.intermarket_trigger",
    title: "Intermarket Analysis",
    description:
      "Trade assets based on leading relationships with bonds, currencies, or commodities.",
    color: "blue",
    index: 29,
  },
  {
    type: "signal.intermarket_trigger_sell",
    title: "Intermarket Analysis Sell",
    description:
      "Trade assets based on leading relationships with bonds, currencies, or commodities signaling downside.",
    color: "red",
    index: 30,
  },
  {
    type: "signal.avwap_reversion",
    title: "Anchored VWAP",
    description:
      "Use volume-weighted average price from key events as dynamic support and resistance.",
    color: "blue",
    index: 31,
  },
  {
    type: "signal.avwap_reversion_sell",
    title: "Anchored VWAP Sell",
    description:
      "Use volume-weighted average price from key events as dynamic resistance for short entries.",
    color: "red",
    index: 32,
  },
  {
    type: "signal.event_followthrough",
    title: "Event-Driven",
    description:
      "Position around earnings, catalysts, or news events that create volatility opportunities.",
    color: "red",
    index: 33,
  },
  {
    type: "signal.event_followthrough_sell",
    title: "Event-Driven Sell",
    description:
      "Position around earnings, catalysts, or news events that create downward volatility opportunities.",
    color: "red",
    index: 34,
  },
  {
    type: "signal.gap_play",
    title: "Gap Trading",
    description:
      "Trade opening gaps that show strong continuation momentum with follow-through volume.",
    color: "emerald",
    index: 35,
  },
  {
    type: "signal.gap_play_sell",
    title: "Gap Trading Sell",
    description:
      "Trade opening gaps down that show strong continuation momentum with follow-through volume.",
    color: "red",
    index: 36,
  },
  {
    type: "signal.liquidity_sweep",
    title: "Liquidity Sweep",
    description:
      "Enter after stop hunts clear weak hands below support, then reclaim the key level.",
    color: "red",
    index: 37,
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
            Twenty-one fundamental patterns that power algorithmic trading
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
