"use client";

import type { TradingArchetype } from "@/types";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export interface VisualizationParams {
  label?: string; // Generic label
  subLabel?: string; // Generic sub-label
  value?: string | number; // Generic value
  metricName?: string; // For metric_* viz
  openTime?: string; // For time_window
  closeTime?: string; // For time_window
  frequencyLabels?: string[]; // For scheduled (e.g. ["Mon", "Tue"...])
  profitTargets?: string[]; // For profit_scaling (e.g. ["2x", "5x"])
  [key: string]: any;
}

interface StrategyVisualizerProps {
  type: TradingArchetype;
  variant?: "light" | "dark"; // light = for dark backgrounds, dark = for light backgrounds
  data?: VisualizationParams;
  useCustomData?: boolean;
  runOnLoad?: boolean;
  loop?: boolean;
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
  data = {},
  useCustomData = false,
  runOnLoad = false,
  loop = false,
}: StrategyVisualizerProps) {
  const [animationState, setAnimationState] = useState(
    runOnLoad ? "active" : "static",
  );

  useEffect(() => {
    if (runOnLoad) {
      setAnimationState("active");
      if (!loop) {
        // Reset to static after animation completes to allow hover re-trigger
        const timer = setTimeout(() => {
          setAnimationState("static");
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [runOnLoad, loop]);

  useEffect(() => {
    if (loop) {
      const cycleTime = 5500; // ~2.5s animation + 3s pause
      const interval = setInterval(() => {
        setAnimationState("static");
        // Brief pause to allow reset before restarting
        setTimeout(() => {
          setAnimationState("active");
        }, 100);
      }, cycleTime);
      return () => clearInterval(interval);
    }
  }, [loop]);

  const colors = colorSchemes[variant];

  // Helper to merge defaults with incoming data
  const getConfig = (defaults: VisualizationParams): VisualizationParams => {
    if (useCustomData && data) {
      // Merge: Incoming data overrides defaults
      return { ...defaults, ...data };
    }
    return defaults;
  };

  // Reusable Animated Dot Component
  interface AnimatedDotProps {
    cx: number;
    cy: number;
    color: "green" | "red";
  }

  const AnimatedDot = ({ cx, cy, color }: AnimatedDotProps) => {
    const isGreen = color === "green";
    const dotColor = isGreen ? "#10b981" : "#ef4444";
    const pulseFill = isGreen
      ? "rgba(16, 185, 129, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

    return (
      <g>
        <motion.circle
          variants={pulseVariants}
          cx={cx}
          cy={cy}
          r="20"
          fill={pulseFill}
          stroke={dotColor}
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <motion.circle
          variants={dotVariants}
          cx={cx}
          cy={cy}
          r="4"
          fill={dotColor}
        />
      </g>
    );
  };

  // Animation Variants
  const pathVariants = {
    static: { pathLength: 1, opacity: 1 },
    active: {
      pathLength: [0, 1],
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const delayedPathVariants = {
    static: { pathLength: 1, opacity: 1 },
    active: {
      pathLength: [0, 1],
      opacity: 1,
      transition: {
        duration: 1.5,
        delay: 0.75,
        ease: "easeInOut",
      },
    },
  };

  const dotVariants = {
    static: { scale: 1, opacity: 1 },
    active: {
      scale: [0, 1.2, 1], // Start from 0 scale (invisible) -> Pop -> Settle
      opacity: [0, 1, 1], // Start invisible -> fade in -> stay visible
      transition: {
        duration: 0.5,
        delay: 1.0, // Wait for line to mostly draw
        ease: "backOut",
      },
    },
  };

  // Fade in at same time as dot (for lines/text that shouldn't scale)
  const fadeWithDotVariants = {
    static: { opacity: 1 },
    active: {
      opacity: [0, 1],
      transition: {
        duration: 0.3,
        delay: 1.0, // Same as dot
        ease: "easeOut",
      },
    },
  };

  // For the "pulse" circle around dots - hidden by default, pulses on hover after dot appears
  const pulseVariants = {
    static: { scale: 0, opacity: 0 },
    active: {
      scale: [0, 1.5],
      opacity: [0, 0.2, 0], // Flash and fade
      transition: {
        duration: 2,
        delay: 1.2, // Start after dot appears
        ease: "easeOut",
        repeat: Infinity, // Pulse can repeat gently
        repeatDelay: 1,
      },
    },
  };

  const textVariants = {
    static: { opacity: 1 },
    active: {
      opacity: [0, 1], // Start invisible -> fade in
      transition: {
        duration: 0.8,
        delay: 1.5, // Wait until drawing is complete
        ease: "easeOut",
      },
    },
  };

  // Map archetype to visualization case
  const getVisualizationCase = (archetype: TradingArchetype): string => {
    switch (archetype) {
      case "execution.dca":
        return "dca";
      case "execution.time_window":
        return "time_window";
      case "execution.scheduled":
        return "scheduled";
      case "signal.percent_dip":
        return "percent_dip";
      case "signal.price_limit":
        return "price_limit";
      case "signal.metric_spike":
        return "metric_spike";
      case "signal.supertrend":
        return "supertrend";
      case "manage.trailing_stop":
        return "trailing_stop";
      case "manage.trailing_limit_buy":
        return "trailing_limit_buy";
      case "manage.trailing_buy":
        return "trailing_buy";
      case "manage.profit_scaling":
        return "profit_scaling";
      case "signal.trend_pullback":
        return "pullback";
      case "signal.range_mean_reversion":
        return "reversion";
      case "signal.breakout_retest":
        return "breakout";
      case "signal.xs_momentum":
        return "momentum";
      case "signal.pairs_relative_value":
        return "pairs";
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
      case "execution.dca_sell":
        return "dca_sell";
      case "signal.price_limit_sell":
        return "price_limit_sell";
      case "signal.percent_spike":
        return "percent_spike";
      case "signal.trailing_limit_sell":
        return "trailing_limit_sell";
      case "signal.trailing_limit_buy":
        return "trailing_limit_buy";
      case "signal.metric_spike_down":
        return "metric_spike_down";
      case "signal.metric_dip_up":
        return "metric_dip_up";
      case "signal.metric_dip_down":
        return "metric_dip_down";
      case "manage.trailing_buy":
        return "trailing_buy";
      case "signal.trend_pullback_sell":
        return "pullback_sell";
      case "signal.range_mean_reversion_sell":
        return "reversion_sell";
      case "signal.breakout_retest_sell":
        return "breakout_sell";
      case "signal.xs_momentum_sell":
        return "momentum_sell";
      case "signal.pairs_relative_value_sell":
        return "pairs_sell";
      case "signal.breakout_trendfollow_sell":
        return "trend_follow_sell";
      case "signal.squeeze_expansion_sell":
        return "squeeze_sell";
      case "signal.intermarket_trigger_sell":
        return "intermarket_sell";
      case "signal.avwap_reversion_sell":
        return "avwap_sell";
      case "signal.event_followthrough_sell":
        return "event_sell";
      case "signal.gap_play_sell":
        return "gap_sell";
      default:
        return "pullback";
    }
  };

  const visualizationType = getVisualizationCase(type);

  switch (visualizationType) {
    case "dca":
      // Custom variants for DCA dots - appear in sequence
      const createDcaDotVariants = (delay: number) => ({
        static: { scale: 1, opacity: 1 },
        active: {
          scale: [0, 1.2, 1],
          opacity: [0, 1, 1],
          transition: {
            duration: 0.5,
            ease: "backOut",
            delay: delay,
          },
        },
      });

      const createDcaPulseVariants = (delay: number) => ({
        static: { opacity: 0 },
        active: {
          opacity: [0, 0.3, 0],
          scale: [1, 1.5, 1],
          transition: {
            duration: 2,
            ease: "easeInOut",
            delay: delay,
          },
        },
      });

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <motion.path
            variants={pathVariants}
            d="M 20 120 L 380 60"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            { x: 60, y: 113, delay: 0.2 },
            { x: 140, y: 99, delay: 0.5 },
            { x: 220, y: 86, delay: 0.8 },
            { x: 300, y: 73, delay: 1.1 },
          ].map((point, i) => (
            <g key={i}>
              <motion.circle
                variants={createDcaPulseVariants(point.delay)}
                cx={point.x}
                cy={point.y}
                r="20"
                fill="rgba(16, 185, 129, 0.1)"
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <motion.circle
                variants={createDcaDotVariants(point.delay)}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#10b981"
              />
            </g>
          ))}
          <motion.text
            variants={textVariants}
            x="220"
            y="120"
            textAnchor="middle"
            className="text-[10px] fill-emerald-500 font-bold font-sans uppercase tracking-wide"
          >
            Recurring Buy
          </motion.text>
        </motion.svg>
      );

    case "dca_sell": {
      // Custom variants for DCA sell dots - appear in sequence
      const createDcaSellDotVariants = (delay: number) => ({
        static: { scale: 1, opacity: 1 },
        active: {
          scale: [0, 1.2, 1],
          opacity: [0, 1, 1],
          transition: {
            duration: 0.5,
            ease: "backOut",
            delay: delay,
          },
        },
      });

      const createDcaSellPulseVariants = (delay: number) => ({
        static: { opacity: 0 },
        active: {
          opacity: [0, 0.3, 0],
          scale: [1, 1.5, 1],
          transition: {
            duration: 2,
            ease: "easeInOut",
            delay: delay,
          },
        },
      });

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <motion.path
            variants={pathVariants}
            d="M 20 60 L 380 120"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            { x: 60, y: 67, delay: 0.2 },
            { x: 140, y: 81, delay: 0.5 },
            { x: 220, y: 94, delay: 0.8 },
            { x: 300, y: 107, delay: 1.1 },
          ].map((point, i) => (
            <g key={i}>
              <motion.circle
                variants={createDcaSellPulseVariants(point.delay)}
                cx={point.x}
                cy={point.y}
                r="20"
                fill="rgba(239, 68, 68, 0.1)"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <motion.circle
                variants={createDcaSellDotVariants(point.delay)}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#ef4444"
              />
            </g>
          ))}
          <motion.text
            variants={textVariants}
            x="220"
            y="140"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Recurring Sell
          </motion.text>
        </motion.svg>
      );
    }

    case "time_window": {
      const timeConfig = getConfig({
        label: "Active Window",
        openTime: "09:30",
        closeTime: "16:00",
      });
      const timeRange = `${timeConfig.openTime} - ${timeConfig.closeTime}`;

      return (
        <svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
        >
          {/* Timeline - Animated gray line */}
          <motion.path
            variants={pathVariants}
            d="M 20 80 L 380 80"
            fill="none"
            stroke={colors.gridLine}
            strokeWidth="1"
          />

          {/* Active Window */}
          <rect
            x="120"
            y="40"
            width="160"
            height="80"
            fill="rgba(16, 185, 129, 0.05)"
            stroke={colors.gridLineSoft}
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          <motion.path
            variants={pathVariants}
            d="M 120 40 V 120 M 280 40 V 120"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
          />

          {/* Center dot */}
          <motion.circle
            variants={dotVariants}
            cx="200"
            cy="80"
            r="4"
            fill={colors.priceLine}
            transition={{ delay: 1.0 }}
          />

          <text
            x="200"
            y="55"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            {timeConfig.label}
          </text>
          <text
            x="200"
            y="110"
            textAnchor="middle"
            className={`text-[9px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            {timeRange}
          </text>
        </svg>
      );
    }

    case "scheduled": {
      const scheduledConfig = getConfig({
        frequencyLabels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      });
      const labels = scheduledConfig.frequencyLabels || [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
      ];
      const labelCount = labels.length;
      // Calculate dynamic spacing: start at 80, distribute remaining width (400 - 160 = 240) evenly
      const startX = 80;
      const endX = 320;
      const totalWidth = endX - startX;
      const spacing = labelCount > 1 ? totalWidth / (labelCount - 1) : 0;

      // Custom variants for green dot to appear earlier
      const scheduledBuyDotVariants = {
        static: { scale: 1, opacity: 1 },
        active: {
          scale: [0, 1.2, 1],
          opacity: [0, 1, 1],
          transition: {
            duration: 0.5,
            delay: 0.3, // Much earlier than default 1.0
            ease: "backOut",
          },
        },
      };

      const scheduledBuyPulseVariants = {
        static: { opacity: 0 },
        active: {
          opacity: [0, 0.3, 0],
          scale: [1, 1.5, 1],
          transition: {
            duration: 1.5,
            ease: "easeOut",
            delay: 0.3, // Match the dot delay
          },
        },
      };

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Dynamic Calendar Grid */}
          <g>
            {/* Day labels */}
            {labels.map((label, i) => (
              <text
                key={`label-${i}`}
                x={startX + i * spacing}
                y="30"
                textAnchor="middle"
                className={`text-[9px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
              >
                {label}
              </text>
            ))}

            {/* Day columns */}
            {labels.map((_, i) => (
              <line
                key={`col-${i}`}
                x1={startX + i * spacing}
                y1="40"
                x2={startX + i * spacing}
                y2="120"
                stroke={colors.gridLineSoft}
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            ))}
          </g>

          {/* Animated Stock Price Line */}
          <motion.path
            variants={pathVariants}
            d="M 50 90 L 100 85 L 140 95 L 180 75 L 220 80 L 260 70 L 300 85 L 350 75"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Scheduled Execution Points */}
          {/* Monday 9am - Buy */}
          <g>
            <motion.circle
              variants={scheduledBuyPulseVariants}
              cx="80"
              cy="87"
              r="20"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={scheduledBuyDotVariants}
              cx="80"
              cy="87"
              r="4"
              fill="#10b981"
            />
          </g>

          {/* Friday 3pm - Sell */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="320"
              cy="81"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="320"
              cy="81"
              r="4"
              fill="#ef4444"
            />
          </g>
        </motion.svg>
      );
    }

    case "percent_dip": {
      const dipConfig = getConfig({
        value: "-5%",
        label: "Dip",
      });
      const dipLabel = `${dipConfig.value} ${dipConfig.label}`;

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Reference line showing original price level */}
          <line
            x1="60"
            y1="40"
            x2="380"
            y2="40"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Price line: short flat, sharp dip, slow recovery */}
          <motion.path
            variants={pathVariants}
            d="M 60 40 L 140 40 L 200 120 Q 280 95 380 70"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Vertical dotted line showing the drop - appears before dot */}
          <motion.line
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.7, // Appears before dot (dot is at 1.0)
                  ease: "easeOut",
                },
              },
            }}
            x1="200"
            y1="40"
            x2="200"
            y2="120"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Dynamic Dip label next to vertical line - appears before dot */}
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.7, // Appears before dot (dot is at 1.0)
                  ease: "easeOut",
                },
              },
            }}
            x="210"
            y="85"
            textAnchor="start"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            {dipLabel}
          </motion.text>
          {/* Dip indicator dot */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="200"
              cy="120"
              r="20"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="200"
              cy="120"
              r="4"
              fill="#10b981"
            />
          </g>
        </motion.svg>
      );
    }

    case "percent_spike": {
      const spikeConfig = getConfig({
        value: "+5%",
        label: "Spike",
      });
      const spikeLabel = `${spikeConfig.value} ${spikeConfig.label}`;

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Reference line showing original price level */}
          <line
            x1="60"
            y1="120"
            x2="380"
            y2="120"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Price line: short flat, sharp spike up, slow decline */}
          <motion.path
            variants={pathVariants}
            d="M 60 120 L 140 120 L 200 40 Q 280 65 380 90"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Vertical dotted line showing the spike - appears before dot */}
          <motion.line
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.7,
                  ease: "easeOut",
                },
              },
            }}
            x1="200"
            y1="120"
            x2="200"
            y2="40"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Dynamic Spike label next to vertical line - appears before dot */}
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.7,
                  ease: "easeOut",
                },
              },
            }}
            x="210"
            y="85"
            textAnchor="start"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            {spikeLabel}
          </motion.text>
          {/* Spike indicator dot */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="200"
              cy="40"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="200"
              cy="40"
              r="4"
              fill="#ef4444"
            />
          </g>
        </motion.svg>
      );
    }

    case "price_limit":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <line
            x1="20"
            y1="100"
            x2="380"
            y2="100"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <motion.path
            variants={pathVariants}
            d="M 20 40 Q 100 60 180 80 T 260 100 L 320 70 L 360 50"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={260} cy={100} color="green" />
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: 1,
                transition: {
                  duration: 0,
                  delay: 0,
                },
              },
            }}
            x="20"
            y="114"
            textAnchor="start"
            className="text-[10px] fill-amber-500 font-bold font-sans uppercase tracking-wide"
          >
            Limit Trigger
          </motion.text>
        </motion.svg>
      );

    case "price_limit_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Limit line at the TOP */}
          <line
            x1="20"
            y1="40"
            x2="380"
            y2="40"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Price line rising up to hit the limit */}
          <motion.path
            variants={pathVariants}
            d="M 20 140 Q 100 120 180 80 T 260 40 L 320 70 L 360 90"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={260} cy={40} color="red" />
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: 1,
                transition: {
                  duration: 0,
                  delay: 0,
                },
              },
            }}
            x="20"
            y="30"
            textAnchor="start"
            className="text-[10px] fill-amber-500 font-bold font-sans uppercase tracking-wide"
          >
            Sell Limit
          </motion.text>
        </motion.svg>
      );

    case "metric_spike": {
      const metricConfig = getConfig({
        metricName: "Volume",
      });
      const metricLabel = `${metricConfig.metricName} Spike`;

      // Volume bar variants - visible by default, animate on hover
      const createVolumeBarVariants = (height: number, index: number) => ({
        static: {
          height: height * 5,
          y: 50 - height * 5,
        },
        active: {
          height: [0, height * 5],
          y: [50, 50 - height * 5],
          transition: {
            duration: 0.4,
            delay: index * 0.12, // Staggered, slightly ahead of line
            ease: "easeOut",
          },
        },
      });

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Volume Bars - animate upward from bottom on hover */}
          <g transform="translate(0, 100)">
            {[1, 2, 1, 3, 2, 8, 3, 2].map((h, i) => (
              <motion.rect
                key={i}
                variants={createVolumeBarVariants(h, i)}
                x={40 + i * 40}
                width="20"
                fill={h > 5 ? "#3b82f6" : colors.secondary}
                opacity={h > 5 ? 1 : 0.3}
              />
            ))}
          </g>
          <motion.path
            variants={pathVariants}
            d="M 40 80 L 240 70 L 260 50 L 320 35"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot on price line at volume spike x position */}
          <AnimatedDot cx={248} cy={62} color="green" />
          <motion.text
            variants={textVariants}
            x="250"
            y="100"
            textAnchor="middle"
            className="text-[10px] fill-blue-600 font-bold font-sans uppercase tracking-wide"
          >
            {metricLabel}
          </motion.text>
        </motion.svg>
      );
    }

    case "metric_spike_down": {
      const metricConfig = getConfig({
        metricName: "Volume",
      });
      const metricLabel = `${metricConfig.metricName} Spike`;

      // Volume spike with price DECREASING
      const createVolumeSpikeDownVariants = (
        height: number,
        index: number,
      ) => ({
        static: {
          height: height * 5,
          y: 50 - height * 5,
        },
        active: {
          height: [0, height * 5],
          y: [50, 50 - height * 5],
          transition: {
            duration: 0.4,
            delay: index * 0.12,
            ease: "easeOut",
          },
        },
      });

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Volume Bars - spike pattern */}
          <g transform="translate(0, 100)">
            {[1, 2, 1, 3, 2, 8, 3, 2].map((h, i) => (
              <motion.rect
                key={i}
                variants={createVolumeSpikeDownVariants(h, i)}
                x={40 + i * 40}
                width="20"
                fill={h > 5 ? "#3b82f6" : colors.secondary}
                opacity={h > 5 ? 1 : 0.3}
              />
            ))}
          </g>
          {/* Price line DECREASING */}
          <motion.path
            variants={pathVariants}
            d="M 40 35 L 240 50 L 260 70 L 320 85"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot on price line at volume spike x position */}
          <AnimatedDot cx={248} cy={58} color="red" />
          <motion.text
            variants={textVariants}
            x="250"
            y="100"
            textAnchor="middle"
            className="text-[10px] fill-blue-500 font-bold font-sans uppercase tracking-wide"
          >
            {metricLabel}
          </motion.text>
        </motion.svg>
      );
    }

    case "metric_dip_up": {
      const metricConfig = getConfig({
        metricName: "Volume",
      });
      const metricLabel = `${metricConfig.metricName} Dip`;

      // Volume DIP with price INCREASING - same bar pattern as spike
      const createVolumeBarVariants = (height: number, index: number) => ({
        static: {
          height: height * 5,
          y: 50 - height * 5,
        },
        active: {
          height: [0, height * 5],
          y: [50, 50 - height * 5],
          transition: {
            duration: 0.4,
            delay: index * 0.12, // Staggered, slightly ahead of line
            ease: "easeOut",
          },
        },
      });

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Volume Bars - higher average with a dip */}
          <g transform="translate(0, 100)">
            {[5, 6, 5, 7, 6, 2, 5, 6].map((h, i) => (
              <motion.rect
                key={i}
                variants={createVolumeBarVariants(h, i)}
                x={40 + i * 40}
                width="20"
                fill={h < 3 ? "#3b82f6" : colors.secondary}
                opacity={h < 3 ? 1 : 0.3}
              />
            ))}
          </g>
          {/* Price line INCREASING */}
          <motion.path
            variants={pathVariants}
            d="M 40 80 L 240 70 L 260 50 L 320 35"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot on price line at volume dip x position */}
          <AnimatedDot cx={248} cy={62} color="green" />
          <motion.text
            variants={textVariants}
            x="250"
            y="100"
            textAnchor="middle"
            className="text-[10px] fill-blue-600 font-bold font-sans uppercase tracking-wide"
          >
            {metricLabel}
          </motion.text>
        </motion.svg>
      );
    }

    case "metric_dip_down": {
      const metricConfig = getConfig({
        metricName: "Volume",
      });
      const metricLabel = `${metricConfig.metricName} Dip`;

      // Volume DIP with price DECREASING - same bar pattern as spike
      const createVolumeBarVariants = (height: number, index: number) => ({
        static: {
          height: height * 5,
          y: 50 - height * 5,
        },
        active: {
          height: [0, height * 5],
          y: [50, 50 - height * 5],
          transition: {
            duration: 0.4,
            delay: index * 0.12, // Staggered, slightly ahead of line
            ease: "easeOut",
          },
        },
      });

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Volume Bars - higher average with a dip */}
          <g transform="translate(0, 100)">
            {[5, 6, 5, 7, 6, 2, 5, 6].map((h, i) => (
              <motion.rect
                key={i}
                variants={createVolumeBarVariants(h, i)}
                x={40 + i * 40}
                width="20"
                fill={h < 3 ? "#3b82f6" : colors.secondary}
                opacity={h < 3 ? 1 : 0.3}
              />
            ))}
          </g>
          {/* Price line DECREASING */}
          <motion.path
            variants={pathVariants}
            d="M 40 35 L 240 50 L 260 70 L 320 85"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot on price line at volume dip x position */}
          <AnimatedDot cx={248} cy={58} color="red" />
          <motion.text
            variants={textVariants}
            x="250"
            y="100"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            {metricLabel}
          </motion.text>
        </motion.svg>
      );
    }

    case "supertrend":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Trend Line (Green) */}
          <motion.path
            variants={pathVariants}
            d="M 20 120 L 100 110 L 160 115"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Trend Line (Red) */}
          <motion.path
            variants={delayedPathVariants}
            d="M 160 70 L 240 60 L 320 50"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          <motion.path
            variants={pathVariants}
            d="M 20 100 L 100 90 L 160 95 L 180 60 L 240 50 L 320 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Flip Point */}
          <AnimatedDot cx={170} cy={77} color="green" />
          <motion.text
            variants={textVariants}
            x="170"
            y="140"
            textAnchor="middle"
            className="text-[10px] fill-stone-500 font-bold font-sans uppercase tracking-wide"
          >
            Trend Flip
          </motion.text>
        </motion.svg>
      );

    case "trailing_stop":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Trailing Stop Line */}
          <motion.path
            d="M 20 135 L 100 115 L 180 75 L 240 85"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          <motion.path
            variants={pathVariants}
            d="M 20 120 L 100 100 L 180 60 L 240 85 L 280 110 L 360 130"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <g>
            <motion.circle
              variants={pulseVariants}
              cx="240"
              cy="85"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="240"
              cy="85"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="235"
            y="115"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Stop Hit
          </motion.text>
        </motion.svg>
      );

    case "trailing_limit_buy":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Trailing Stop Line */}
          <motion.path
            d="M 20 135 L 100 115 L 180 75 L 240 85"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          <motion.path
            variants={pathVariants}
            d="M 20 120 L 100 100 L 180 60 L 240 85 L 300 50 L 360 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <AnimatedDot cx={240} cy={85} color="green" />
          <motion.text
            variants={textVariants}
            x="235"
            y="115"
            textAnchor="middle"
            className="text-[10px] fill-emerald-500 font-bold font-sans uppercase tracking-wide"
          >
            Limit Hit
          </motion.text>
        </motion.svg>
      );

    case "trailing_buy":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Trailing Buy Line - follows price down */}
          <motion.path
            d="M 20 25 L 100 45 L 180 85 L 240 75"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Price Action - trending down then rising */}
          <motion.path
            variants={pathVariants}
            d="M 20 40 L 100 60 L 180 100 L 240 75 L 280 50 L 360 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Buy Trigger Point */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="240"
              cy="75"
              r="20"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="240"
              cy="75"
              r="4"
              fill="#10b981"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="240"
            y="105"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Buy Trigger
          </motion.text>
        </motion.svg>
      );

    case "trailing_limit_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Trailing Limit Line - resistance above price */}
          <motion.path
            d="M 20 25 L 100 45 L 180 85 L 240 75"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Price Action - trending up then touching limit */}
          <motion.path
            variants={pathVariants}
            d="M 20 40 L 100 60 L 180 100 L 240 75 L 280 90 L 360 110"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sell Trigger Point where price breaks above trailing limit */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="240"
              cy="75"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="240"
              cy="75"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="240"
            y="55"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Limit Hit
          </motion.text>
        </motion.svg>
      );

    case "profit_scaling": {
      const profitConfig = getConfig({
        profitTargets: ["2x", "3x"],
      });
      const targets = profitConfig.profitTargets || ["2x", "3x"];
      const targetCount = targets.length;

      // Price path coordinates for calculating dot positions
      // Path: M 20 140 L 100 100 L 180 80 L 260 40 L 340 20
      const pathPoints = [
        { x: 20, y: 140 },
        { x: 100, y: 100 },
        { x: 180, y: 80 },
        { x: 260, y: 40 },
        { x: 340, y: 20 },
      ];

      // Calculate positions for each target
      // Distribute targets along the path from the middle section
      const startPathIndex = 2; // Start from index 2 (180, 80)
      const endPathIndex = 3; // End at index 3 (260, 40)
      const startX = pathPoints[startPathIndex].x;
      const endX = pathPoints[endPathIndex].x;
      const startY = pathPoints[startPathIndex].y;
      const endY = pathPoints[endPathIndex].y;

      // Calculate Y positions for lines (distributed from top to bottom)
      const minY = 40;
      const maxY = 80;
      const ySpacing = targetCount > 1 ? (maxY - minY) / (targetCount - 1) : 0;

      // Helper to create variants for each target with staggered delays
      const createScaleOutVariants = (index: number) => ({
        static: { opacity: 1 },
        active: {
          opacity: [0, 1],
          transition: {
            duration: 0.3,
            delay: 0.7 + index * 0.6, // Staggered delays
            ease: "easeOut",
          },
        },
      });

      const createDotVariants = (index: number) => ({
        static: { scale: 1, opacity: 1 },
        active: {
          scale: [0, 1.2, 1],
          opacity: [0, 1, 1],
          transition: {
            duration: 0.5,
            delay: 0.7 + index * 0.6, // Match line delay
            ease: "backOut",
          },
        },
      });

      // Calculate dot positions along the price path
      const calculateDotPosition = (index: number) => {
        if (targetCount === 1) {
          return { x: (startX + endX) / 2, y: (startY + endY) / 2 };
        }
        const t = index / (targetCount - 1); // 0 to 1
        const x = startX + (endX - startX) * t;
        // Linear interpolation for Y along the path segment
        const y = startY + (endY - startY) * t;
        return { x, y };
      };

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <motion.path
            variants={pathVariants}
            d="M 20 140 L 100 100 L 180 80 L 260 40 L 340 20"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dynamically generate lines and labels for each target */}
          {targets.map((target, index) => {
            const yPos = maxY - index * ySpacing;
            const dotPos = calculateDotPosition(index);
            return (
              <g key={`target-${index}`}>
                {/* Horizontal reference line */}
                <motion.line
                  variants={createScaleOutVariants(index)}
                  x1="20"
                  y1={yPos}
                  x2="380"
                  y2={yPos}
                  stroke={colors.gridLine}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <motion.text
                  variants={createScaleOutVariants(index)}
                  x="30"
                  y={yPos - 8}
                  className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
                >
                  {target} Profit
                </motion.text>

                {/* Scale out point dot */}
                <g>
                  <motion.circle
                    variants={pulseVariants}
                    cx={dotPos.x}
                    cy={dotPos.y}
                    r="20"
                    fill="rgba(16, 185, 129, 0.1)"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <motion.circle
                    variants={createDotVariants(index)}
                    cx={dotPos.x}
                    cy={dotPos.y}
                    r="4"
                    fill="#10b981"
                  />
                </g>
              </g>
            );
          })}
        </motion.svg>
      );
    }

    case "pullback":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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
          <motion.path
            variants={pathVariants}
            d="M 50 140 C 80 120, 100 110, 130 90 S 150 70, 170 100 C 180 115, 190 115, 210 80 S 300 40, 350 20"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={182} cy={109} color="green" />
          <motion.text
            variants={textVariants}
            x="182"
            y="136"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Correction
          </motion.text>
        </motion.svg>
      );

    case "pullback_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Downtrend guide line - from top-left to bottom-right */}
          <line
            x1="50"
            y1="20"
            x2="350"
            y2="140"
            stroke={colors.gridLine}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Price path - downtrend with rally (correction up) */}
          <motion.path
            variants={pathVariants}
            d="M 50 20 C 80 40, 100 50, 130 70 S 150 90, 170 60 C 180 45, 190 45, 210 80 S 300 120, 350 140"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Rally Exit Point */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="182"
              cy="51"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="182"
              cy="51"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="182"
            y="30"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Rally Exit
          </motion.text>
        </motion.svg>
      );

    case "reversion":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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
          <motion.path
            variants={pathVariants}
            d="M 20 80 Q 60 130 100 80 T 180 80 T 260 125 T 340 35"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={260} cy={125} color="green" />
          <motion.text
            variants={textVariants}
            x="260"
            y="160"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Mean Reversion
          </motion.text>
        </motion.svg>
      );

    case "reversion_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Range bands */}
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
          {/* Price oscillating and reaching TOP */}
          <motion.path
            variants={pathVariants}
            d="M 20 80 Q 60 30 100 80 T 180 80 T 260 35 T 340 125"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Sell point at top */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="260"
              cy="35"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="260"
              cy="35"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="260"
            y="20"
            textAnchor="middle"
            className="text-[10px] fill-amber-500 font-bold font-sans uppercase tracking-wide"
          >
            Mean Reversion
          </motion.text>
        </motion.svg>
      );

    case "breakout":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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

          <motion.path
            variants={pathVariants}
            d="M 50 120 L 150 60 L 220 100 L 260 60 L 280 60 L 300 30 L 350 10"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={280} cy={60} color="green" />
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.5, // Appears when line first touches resistance
                  ease: "easeOut",
                },
              },
            }}
            x="150"
            y="50"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Resistance
          </motion.text>
          <motion.text
            variants={textVariants}
            x="280"
            y="89"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Breakout
          </motion.text>
        </motion.svg>
      );

    case "breakout_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Support line */}
          <line
            x1="0"
            y1="100"
            x2="400"
            y2="100"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Price breaks below, retests, continues down */}
          <motion.path
            variants={pathVariants}
            d="M 50 40 L 150 100 L 220 60 L 260 100 L 280 100 L 300 130 L 350 150"
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Breakdown retest point */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="280"
              cy="100"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="280"
              cy="100"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.5,
                  ease: "easeOut",
                },
              },
            }}
            x="150"
            y="115"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Support
          </motion.text>
          <motion.text
            variants={textVariants}
            x="280"
            y="75"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Breakdown
          </motion.text>
        </motion.svg>
      );

    case "momentum":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <motion.path
            variants={pathVariants}
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
          <AnimatedDot cx={265} cy={75} color="green" />
          <motion.text
            variants={textVariants}
            x="265"
            y="120"
            textAnchor="middle"
            className="text-[10px] fill-blue-600 font-bold font-sans uppercase tracking-wide"
          >
            Momentum Flag
          </motion.text>
        </motion.svg>
      );

    case "momentum_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Price trending DOWN with flag consolidation */}
          <motion.path
            variants={pathVariants}
            d="M 40 20 C 140 25, 200 40, 240 80 L 260 80 L 350 150"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Flag consolidation box - tilted upward (bear flag) */}
          <rect
            x="235"
            y="70"
            width="30"
            height="20"
            fill="none"
            stroke={colors.gridLineSoft}
            strokeWidth="1"
            strokeDasharray="2 2"
            transform="rotate(10 250 80)"
          />
          {/* Flag breakout point */}
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="265"
              cy="85"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="265"
              cy="85"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="265"
            y="45"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Momentum Flag
          </motion.text>
        </motion.svg>
      );

    case "pairs": {
      // Vertical line variants - visible by default, disappears and reanimates on hover
      const verticalLineVariants = {
        static: { pathLength: 1, opacity: 1 },
        active: {
          pathLength: [0, 1],
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 0.9, // 0.1s before dot appears
            ease: "easeOut",
          },
        },
      };

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <motion.path
            variants={pathVariants}
            d="M 40 80 Q 120 70 200 40 T 360 80"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.path
            variants={pathVariants}
            d="M 40 80 Q 120 90 200 120 T 360 80"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Vertical dotted line - expands from center on hover */}
          <motion.path
            variants={verticalLineVariants}
            d="M 200 80 L 200 40"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          <motion.path
            variants={verticalLineVariants}
            d="M 200 80 L 200 120"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          <AnimatedDot cx={200} cy={120} color="green" />
          <motion.text
            variants={textVariants}
            x="210"
            y="80"
            textAnchor="start"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Max Divergence
          </motion.text>
        </motion.svg>
      );
    }

    case "pairs_sell": {
      // Vertical line variants
      const verticalLineVariantsSell = {
        static: { pathLength: 1, opacity: 1 },
        active: {
          pathLength: [0, 1],
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 0.9,
            ease: "easeOut",
          },
        },
      };

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Amber line goes UP (flipped) */}
          <motion.path
            variants={pathVariants}
            d="M 40 80 Q 120 70 200 40 T 360 80"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Secondary line goes DOWN (flipped) */}
          <motion.path
            variants={pathVariants}
            d="M 40 80 Q 120 90 200 120 T 360 80"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Vertical dotted line - from center to top */}
          <motion.path
            variants={verticalLineVariantsSell}
            d="M 200 80 L 200 40"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          <motion.path
            variants={verticalLineVariantsSell}
            d="M 200 80 L 200 120"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />
          {/* Dot at TOP of divergence */}
          <AnimatedDot cx={200} cy={40} color="red" />
          <motion.text
            variants={textVariants}
            x="210"
            y="80"
            textAnchor="start"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Max Divergence
          </motion.text>
        </motion.svg>
      );
    }

    case "trend_follow":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <line
            x1="20"
            y1="142"
            x2="380"
            y2="26"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4 "
          />
          <motion.path
            variants={pathVariants}
            d="M 20 140 L 80 100 L 120 110 L 200 60 L 240 70 L 320 20 L 360 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="110" r="3" fill={colors.secondary} />
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="240"
              cy="70"
              r="20"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="240"
              cy="70"
              r="4"
              fill="#10b981"
            />
          </g>
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.5, // Appears when line touches the dotted trend line
                  ease: "easeOut",
                },
              },
            }}
            x="120"
            y="130"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Higher Low
          </motion.text>
          <motion.text
            variants={fadeWithDotVariants}
            x="240"
            y="95"
            textAnchor="middle"
            className="text-[10px] fill-emerald-600 font-bold font-sans uppercase tracking-wide"
          >
            Continuation
          </motion.text>
        </motion.svg>
      );

    case "trend_follow_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Downtrend guide line - from top-left to bottom-right */}
          <line
            x1="20"
            y1="18"
            x2="380"
            y2="134"
            stroke={colors.gridLine}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Price with lower highs pattern */}
          <motion.path
            variants={pathVariants}
            d="M 20 20 L 80 60 L 120 50 L 200 100 L 240 90 L 320 140 L 360 130"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Lower high marker */}
          <circle cx="120" cy="50" r="3" fill={colors.secondary} />
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="240"
              cy="90"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="240"
              cy="90"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={{
              static: { opacity: 1 },
              active: {
                opacity: [0, 1],
                transition: {
                  duration: 0.3,
                  delay: 0.5,
                  ease: "easeOut",
                },
              },
            }}
            x="120"
            y="35"
            textAnchor="middle"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Lower High
          </motion.text>
          <motion.text
            variants={fadeWithDotVariants}
            x="240"
            y="75"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Continuation
          </motion.text>
        </motion.svg>
      );

    case "squeeze":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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
          <motion.path
            variants={pathVariants}
            d="M 20 80 L 60 90 L 100 70 L 140 85 L 180 80 L 220 82 L 260 60 L 320 30"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={220} cy={82} color="green" />
          <motion.text
            variants={textVariants}
            x="150"
            y="115"
            textAnchor="middle"
            className="text-[10px] fill-stone-500 font-bold font-sans uppercase tracking-wide"
          >
            Compression
          </motion.text>
          <motion.text
            variants={textVariants}
            x="320"
            y="80"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Expansion
          </motion.text>
        </motion.svg>
      );

    case "squeeze_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Squeeze bands - same shape */}
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
                ? "rgba(239, 68, 68, 0.08)"
                : "rgba(239, 68, 68, 0.05)"
            }
          />
          {/* Price line flipped - goes DOWN through expansion */}
          <motion.path
            variants={pathVariants}
            d="M 20 80 L 60 70 L 100 90 L 140 75 L 180 80 L 220 78 L 260 100 L 320 130"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="235"
              cy="88"
              r="20"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="235"
              cy="88"
              r="4"
              fill="#ef4444"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="150"
            y="45"
            textAnchor="middle"
            className="text-[10px] fill-stone-500 font-bold font-sans uppercase tracking-wide"
          >
            Compression
          </motion.text>
          <motion.text
            variants={textVariants}
            x="320"
            y="80"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Expansion
          </motion.text>
        </motion.svg>
      );

    case "intermarket": {
      // Angled line variants - visible by default, disappears and reanimates on hover
      const angledLineVariants = {
        static: { pathLength: 1, opacity: 1 },
        active: {
          pathLength: [0, 1],
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 0.9,
            ease: "easeOut",
          },
        },
      };

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <motion.path
            variants={pathVariants}
            d="M 20 60 L 100 60 L 150 30 L 250 25"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <motion.text
            variants={textVariants}
            x="150"
            y="20"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Yields (Lead)
          </motion.text>
          <motion.path
            variants={pathVariants}
            d="M 20 120 L 120 120 L 180 120 L 220 140 L 300 90"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Angled dotted line - expands from center on hover */}
          <motion.path
            variants={angledLineVariants}
            d="M 165 75 L 150 30"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 3"
            fill="none"
          />
          <motion.path
            variants={angledLineVariants}
            d="M 165 75 L 180 120"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 3"
            fill="none"
          />
          <AnimatedDot cx={180} cy={120} color="green" />
          <motion.text
            variants={textVariants}
            x="300"
            y="80"
            textAnchor="middle"
            className={`text-[10px] font-bold font-sans uppercase tracking-wide ${colors.textDark}`}
          >
            Tech (Lag)
          </motion.text>
        </motion.svg>
      );
    }

    case "intermarket_sell": {
      // Angled line variants
      const angledLineVariantsSell = {
        static: { pathLength: 1, opacity: 1 },
        active: {
          pathLength: [0, 1],
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 0.9,
            ease: "easeOut",
          },
        },
      };

      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Orange line (was secondary/gray) - Lead indicator */}
          <motion.path
            variants={pathVariants}
            d="M 20 60 L 100 60 L 150 30 L 250 25"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <motion.text
            variants={textVariants}
            x="150"
            y="20"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-sans uppercase tracking-wide"
          >
            Yields (Lead)
          </motion.text>
          {/* Gray line (was orange/price) - Lag indicator */}
          <motion.path
            variants={pathVariants}
            d="M 20 120 L 120 120 L 180 120 L 220 140 L 300 90"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Angled dotted line - connects to the lead indicator end */}
          <motion.path
            variants={angledLineVariantsSell}
            d="M 165 75 L 150 30"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 3"
            fill="none"
          />
          <motion.path
            variants={angledLineVariantsSell}
            d="M 165 75 L 180 120"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 3"
            fill="none"
          />
          {/* Dot at the lead indicator (orange line) end */}
          <AnimatedDot cx={150} cy={30} color="red" />
          <motion.text
            variants={textVariants}
            x="300"
            y="80"
            textAnchor="middle"
            className={`text-[10px] font-bold font-sans uppercase tracking-wide ${colors.textDark}`}
          >
            Tech (Lag)
          </motion.text>
        </motion.svg>
      );
    }

    case "avwap":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          <path
            d="M 20 140 Q 100 100 200 90 T 380 60"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <motion.path
            variants={pathVariants}
            d="M 20 140 L 60 110 L 100 60 L 140 40 L 180 60 L 216 88 L 280 40"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.text
            variants={textVariants}
            x="30"
            y="155"
            className="text-[10px] fill-blue-500 font-bold font-sans uppercase tracking-wide"
          >
            Anchor
          </motion.text>
          <AnimatedDot cx={216} cy={88} color="green" />
          <motion.text
            variants={textVariants}
            x="220"
            y="120"
            textAnchor="middle"
            className="text-[10px] font-bold font-sans uppercase tracking-wide fill-blue-500"
          >
            Mean Reversion
          </motion.text>
        </motion.svg>
      );

    case "avwap_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* VWAP line flipped - curves downward from top */}
          <path
            d="M 20 20 Q 100 60 200 70 T 380 100"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {/* Price line flipped - bounces down from VWAP */}
          <motion.path
            variants={pathVariants}
            d="M 20 20 L 60 50 L 100 100 L 140 120 L 180 100 L 216 72 L 280 120"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.text
            variants={textVariants}
            x="30"
            y="12"
            className="text-[10px] fill-blue-500 font-bold font-sans uppercase tracking-wide"
          >
            Anchor
          </motion.text>
          <AnimatedDot cx={216} cy={72} color="red" />
          <motion.text
            variants={textVariants}
            x="220"
            y="45"
            textAnchor="middle"
            className="text-[10px] font-bold font-sans uppercase tracking-wide fill-blue-500"
          >
            Mean Reversion
          </motion.text>
        </motion.svg>
      );

    case "event": {
      // Animate the vertical catalyst line like in "intermarket" and "pairs"
      const catalystLineVariants = {
        static: { pathLength: 1, opacity: 1 },
        active: {
          pathLength: [0, 1],
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 0.5,
            ease: "easeOut",
          },
        },
      };
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Animated vertical catalyst line */}
          <motion.path
            variants={catalystLineVariants}
            d="M 150 20 L 150 140"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 2"
            fill="none"
          />
          <motion.text
            variants={textVariants}
            x="150"
            y="155"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Catalyst
          </motion.text>
          {/* Continuous path that crosses the catalyst */}
          <motion.path
            variants={pathVariants}
            d="M 20 100 L 80 100 L 150 100 L 170 70 L 190 80 L 220 50 L 250 60 L 280 30 L 320 20"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot closer to the catalyst line */}
          <AnimatedDot cx={165} cy={77} color="green" />
        </motion.svg>
      );
    }

    case "event_sell": {
      // Animate the vertical catalyst line
      const catalystLineVariantsSell = {
        static: { pathLength: 1, opacity: 1 },
        active: {
          pathLength: [0, 1],
          opacity: 1,
          transition: {
            duration: 0.6,
            delay: 0.5,
            ease: "easeOut",
          },
        },
      };
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Catalyst line - unchanged */}
          <motion.path
            variants={catalystLineVariantsSell}
            d="M 150 20 L 150 140"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 2"
            fill="none"
          />
          <motion.text
            variants={textVariants}
            x="150"
            y="155"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Catalyst
          </motion.text>
          {/* Price line flipped - trends down after catalyst */}
          <motion.path
            variants={pathVariants}
            d="M 20 60 L 80 60 L 150 60 L 170 90 L 190 80 L 220 110 L 250 100 L 280 130 L 320 140"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot after the catalyst */}
          <AnimatedDot cx={165} cy={83} color="red" />
        </motion.svg>
      );
    }

    case "gap":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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
          <motion.text
            variants={textVariants}
            x="100"
            y="125"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Close
          </motion.text>
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
          <motion.text
            variants={textVariants}
            x="120"
            y="88"
            textAnchor="middle"
            className="text-[9px] fill-emerald-600 font-bold font-sans uppercase tracking-widest"
          >
            GAP
          </motion.text>
          <motion.path
            variants={pathVariants}
            d="M 140 60 L 180 50 L 220 55 L 280 20 L 340 10"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={140} cy={60} color="green" />
          <motion.text
            variants={textVariants}
            x="140"
            y="45"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Open
          </motion.text>
        </motion.svg>
      );

    case "gap_sell":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
        >
          {/* Previous day close - at top */}
          <line
            x1="20"
            y1="40"
            x2="100"
            y2="50"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="100" cy="50" r="3" fill={colors.priceLine} />
          <motion.text
            variants={textVariants}
            x="100"
            y="35"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Close
          </motion.text>
          {/* Gap down zone */}
          <rect
            x="100"
            y="50"
            width="40"
            height="50"
            fill="rgba(239, 68, 68, 0.05)"
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <motion.text
            variants={textVariants}
            x="120"
            y="78"
            textAnchor="middle"
            className="text-[9px] fill-red-500 font-bold font-sans uppercase tracking-widest"
          >
            GAP
          </motion.text>
          {/* Open lower and continue down */}
          <motion.path
            variants={pathVariants}
            d="M 140 100 L 180 110 L 220 105 L 280 140 L 340 150"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedDot cx={140} cy={100} color="red" />
          <motion.text
            variants={textVariants}
            x="140"
            y="115"
            textAnchor="middle"
            className={`text-[10px] font-sans uppercase tracking-wide ${colors.textMuted}`}
          >
            Open
          </motion.text>
        </motion.svg>
      );

    case "liquidity":
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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
          <motion.text
            variants={textVariants}
            x="30"
            y="125"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Support
          </motion.text>

          {/* Price Action */}
          <motion.path
            variants={pathVariants}
            d="M 20 80 L 60 110 L 100 90 L 140 110 L 180 140 L 220 110 L 260 70 L 320 50"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sweep Zone */}
          <motion.text
            variants={textVariants}
            x="180"
            y="160"
            textAnchor="middle"
            className="text-[10px] fill-red-500 font-bold font-sans uppercase tracking-wide"
          >
            Stop Hunt
          </motion.text>

          {/* Reclaim */}
          <AnimatedDot cx={220} cy={110} color="green" />
        </motion.svg>
      );

    default:
      return (
        <motion.svg
          viewBox="0 0 400 160"
          className="w-full max-w-lg h-40 overflow-visible z-10"
          initial="static"
          animate={animationState}
          whileHover={!loop ? "active" : undefined}
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
          <motion.path
            variants={pathVariants}
            d="M 50 140 C 80 120, 100 110, 130 90 S 150 70, 170 100 C 180 115, 190 115, 210 80 S 300 40, 350 20"
            fill="none"
            stroke={colors.priceLine}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g>
            <motion.circle
              variants={pulseVariants}
              cx="178"
              cy="108"
              r="20"
              fill="rgba(245, 158, 11, 0.1)"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <motion.circle
              variants={dotVariants}
              cx="178"
              cy="108"
              r="4"
              fill="#f59e0b"
            />
          </g>
          <motion.text
            variants={textVariants}
            x="178"
            y="136"
            textAnchor="middle"
            className="text-[10px] fill-amber-600 font-bold font-sans uppercase tracking-wide"
          >
            Correction Entry
          </motion.text>

          <motion.text
            variants={textVariants}
            x="280"
            y="45"
            className={`text-[10px] font-sans font-medium uppercase tracking-wide ${colors.textMuted}`}
          >
            Continuation
          </motion.text>
        </motion.svg>
      );
  }
}
