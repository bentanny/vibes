"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Pause } from "lucide-react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { runSimulation, SimulationConfig } from "@/lib/simulation-engine";

// Re-export for compatibility
export type { SimulationConfig };

interface DynamicStrategyVisualizerProps {
  config: SimulationConfig;
  autoPlay?: boolean;
}

export function DynamicStrategyVisualizer({
  config,
  autoPlay = false,
}: DynamicStrategyVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0); // 0 to 100

  // 1. Run the Simulation (Memoized)
  const simulation = useMemo(() => {
    return runSimulation(config);
  }, [config]);

  const { data, events } = simulation;

  // Animation Loop
  useEffect(() => {
    let animationFrame: number;
    if (isPlaying) {
      const startTime = Date.now() - progress * 50; // 5s duration
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(100, elapsed / 50);
        setProgress(newProgress);
        if (newProgress < 100) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const togglePlay = () => {
    if (progress >= 100) {
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  // Find the most recent event
  const currentEvent = events
    .filter((e) => e.time <= progress)
    .sort((a, b) => b.time - a.time)[0];

  // Helper to scale values
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = data.map((d) => d.close);
    const mins = [Math.min(...prices)];
    const maxs = [Math.max(...prices)];

    // Include indicators in range calculation so they don't clip
    config.indicators.forEach((ind) => {
      if (ind.type === "rsi") return; // RSI has its own scale (0-100)
      const vals = data
        .map((d) => d[ind.id])
        .filter((v) => typeof v === "number");
      if (vals.length) {
        mins.push(Math.min(...vals));
        maxs.push(Math.max(...vals));
      }
    });

    return {
      minPrice: Math.min(...mins) - 5,
      maxPrice: Math.max(...maxs) + 5,
    };
  }, [data, config.indicators]);

  const scaleX = (index: number) => (index / (data.length - 1)) * 400;

  const scaleY = (val: number, type?: string) => {
    if (type === "rsi") {
      return 160 - (val / 100) * 160;
    }
    const range = maxPrice - minPrice;
    const normalized = (val - minPrice) / range;
    return 160 - normalized * 160;
  };

  // Generate SVG Paths
  const pricePath = useMemo(() => {
    return `M ${data.map((d, i) => `${scaleX(i).toFixed(1)},${scaleY(d.close).toFixed(1)}`).join(" L ")}`;
  }, [data, minPrice, maxPrice]); // eslint-disable-line

  // Calculate Indicator Paths
  const indicatorPaths = useMemo(() => {
    return config.indicators.map((ind) => {
      const pathData = data
        .map((d, i) => {
          const val = d[ind.id];
          if (val === undefined || isNaN(val)) return null;
          return `${scaleX(i).toFixed(1)},${scaleY(val, ind.type).toFixed(1)}`;
        })
        .filter(Boolean)
        .join(" L ");
      return { ...ind, path: `M ${pathData}` };
    });
  }, [data, config.indicators, minPrice, maxPrice]); // eslint-disable-line

  return (
    <Card className="w-full max-w-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
            Simulation
          </span>
          <span className="text-sm font-semibold text-stone-700 dark:text-stone-200 capitalize">
            {config.story.length} Scene Story
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={togglePlay}
            className="bg-stone-200 dark:bg-stone-800"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={handleReset}
            className="bg-stone-200 dark:bg-stone-800"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      <div className="relative p-6 h-64 bg-stone-50 dark:bg-black/20">
        {/* Event Overlay */}
        <AnimatePresence mode="wait">
          {currentEvent && (
            <motion.div
              key={currentEvent.index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 right-4 bg-white/90 dark:bg-stone-800/90 backdrop-blur px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm z-20 max-w-[200px]"
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider ${currentEvent.type === "buy" ? "text-emerald-500" : currentEvent.type === "sell" ? "text-red-500" : "text-blue-500"}`}
              >
                {currentEvent.label} Signal
              </div>
              <div className="text-[10px] text-stone-500 mt-1 leading-tight">
                {currentEvent.reason}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                Price: {currentEvent.price.toFixed(2)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid */}
          <g stroke="currentColor" strokeOpacity="0.1" strokeWidth="1">
            <line x1="0" y1="40" x2="400" y2="40" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="400" y2="80" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="400" y2="120" strokeDasharray="4 4" />
          </g>

          {/* Indicators */}
          {indicatorPaths.map((ind) => (
            <motion.path
              key={ind.id}
              d={ind.path}
              fill="none"
              stroke={ind.color}
              strokeWidth={ind.type === "bollinger" ? 1.5 : 2}
              strokeDasharray={ind.type === "bollinger" ? "4 4" : ""}
              strokeOpacity="0.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0, ease: "linear" }}
            />
          ))}

          {/* Price Line */}
          <motion.path
            d={pricePath}
            fill="none"
            stroke="#57534e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0, ease: "linear" }}
          />

          {/* Events Markers */}
          {events.map((e) => {
            if (progress < e.time) return null;
            const x = scaleX(e.index);
            const y = scaleY(e.price);
            const color =
              e.type === "buy"
                ? "#10b981"
                : e.type === "sell"
                  ? "#ef4444"
                  : "#3b82f6";

            return (
              <g key={e.index}>
                <circle cx={x} cy={y} r="3" fill={color} />
                {/* Subtler breathing animation */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  initial={{ opacity: 0.1, scale: 0.8 }}
                  animate={{ opacity: 0.3, scale: 1.2 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Scrubber */}
      <div
        className="h-1 bg-stone-200 dark:bg-stone-800 w-full relative cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const p = ((e.clientX - rect.left) / rect.width) * 100;
          setProgress(p);
          setIsPlaying(false);
        }}
      >
        <motion.div
          className="h-full bg-stone-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  );
}
