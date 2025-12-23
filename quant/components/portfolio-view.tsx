"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/contexts/auth-context";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Logo } from "@/components/icons";
import {
  StrategyListView,
  type StrategyItem,
} from "@/components/strategy-list-view";
import { StrategyDetailsView } from "@/components/strategy-details-view";
import { GalleryVerticalEnd, Home } from "lucide-react";
import { ExpandableButton } from "@/components/ui/expandable-button";

// Mock data for strategies
const INITIAL_STRATEGIES: StrategyItem[] = [
  {
    id: "1",
    ticker: "AAPL",
    name: "Trend Pullback",
    type: "active",
    pnl: 1240.5,
    pnlPercent: 5.2,
    startedAt: "2024-03-10T10:00:00Z",
    nextTradeDate: "2024-03-25T09:30:00Z",
    lastTrade: "2024-03-18T11:15:00Z",
    realizedPnl: 850.25,
    unrealizedPnl: 390.25,
    roi: 12.4,
    assetPrice: 178.5,
    assetRoi: 8.5,
    trades: [
      {
        id: "t1",
        type: "buy",
        price: 170.2,
        date: "2024-03-10T10:00:00Z",
        quantity: 10,
      },
      {
        id: "t2",
        type: "sell",
        price: 175.5,
        date: "2024-03-15T14:30:00Z",
        quantity: 5,
      },
      {
        id: "t3",
        type: "buy",
        price: 173.8,
        date: "2024-03-18T11:15:00Z",
        quantity: 8,
      },
    ],
  },
  {
    id: "2",
    ticker: "TSLA",
    name: "Volatility Breakout",
    type: "paused",
    pnl: -320.15,
    pnlPercent: -1.8,
    startedAt: "2024-03-12T14:30:00Z",
    pausedAt: "2024-03-20T15:00:00Z",
    nextTradeDate: "2024-03-26T09:30:00Z",
    lastTrade: "2024-03-14T10:45:00Z",
    realizedPnl: -150.0,
    unrealizedPnl: -170.15,
    roi: -2.5,
    assetPrice: 165.4,
    assetRoi: -1.2,
    trades: [
      {
        id: "t4",
        type: "buy",
        price: 175.0,
        date: "2024-03-12T14:30:00Z",
        quantity: 20,
      },
      {
        id: "t5",
        type: "sell",
        price: 172.5,
        date: "2024-03-14T10:45:00Z",
        quantity: 10,
      },
    ],
  },
  {
    id: "3",
    ticker: "NVDA",
    name: "Mean Reversion",
    type: "active",
    pnl: 4500.0,
    pnlPercent: 12.5,
    startedAt: "2024-03-01T09:15:00Z",
    nextTradeDate: "2024-03-24T09:30:00Z",
    lastTrade: "2024-03-10T10:30:00Z",
    realizedPnl: 3200.0,
    unrealizedPnl: 1300.0,
    roi: 25.8,
    assetPrice: 890.0,
    assetRoi: 18.2,
    trades: [
      {
        id: "t6",
        type: "buy",
        price: 850.0,
        date: "2024-03-01T09:15:00Z",
        quantity: 5,
      },
      {
        id: "t7",
        type: "sell",
        price: 920.0,
        date: "2024-03-05T13:20:00Z",
        quantity: 2,
      },
      {
        id: "t8",
        type: "buy",
        price: 880.0,
        date: "2024-03-10T10:30:00Z",
        quantity: 3,
      },
    ],
  },
];

export function PortfolioView() {
  const router = useRouter();
  const { data: session } = useSession();
  const [strategies, setStrategies] =
    useState<StrategyItem[]>(INITIAL_STRATEGIES);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null,
  );
  const [loadingStrategyId, setLoadingStrategyId] = useState<string | null>(
    null,
  );
  const [fadingOutStrategyId, setFadingOutStrategyId] = useState<string | null>(
    null,
  );

  // Auto-select the first strategy on initial load
  useEffect(() => {
    if (strategies.length > 0 && selectedStrategyId === null) {
      setSelectedStrategyId(strategies[0].id);
    }
  }, [strategies, selectedStrategyId]);

  // Reset fadingOutStrategyId when selecting a new strategy (unless it's the one being faded out)
  useEffect(() => {
    if (
      selectedStrategyId &&
      fadingOutStrategyId &&
      fadingOutStrategyId !== selectedStrategyId
    ) {
      setFadingOutStrategyId(null);
    }
  }, [selectedStrategyId, fadingOutStrategyId]);

  const selectedStrategy =
    strategies.find((s) => s.id === selectedStrategyId) || null;

  const handleStrategyTypeChange = async (
    strategyId: string,
    newType: "active" | "paused" | "completed",
  ) => {
    setLoadingStrategyId(strategyId);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStrategies((prev) =>
        prev.map((strategy) => {
          if (strategy.id === strategyId) {
            const updated = { ...strategy, type: newType };
            // If pausing, set pausedAt to now; if resuming, remove pausedAt
            if (newType === "paused") {
              return { ...updated, pausedAt: new Date().toISOString() };
            } else if (newType === "active") {
              const { pausedAt, ...rest } = updated;
              return rest;
            }
            return updated;
          }
          return strategy;
        }),
      );
    } finally {
      setLoadingStrategyId(null);
    }
  };

  const handleStopStrategy = async (strategyId: string) => {
    setLoadingStrategyId(strategyId);
    setFadingOutStrategyId(strategyId);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update strategy to completed
      setStrategies((prev) =>
        prev.map((strategy) => {
          if (strategy.id === strategyId) {
            return { ...strategy, type: "completed" as const };
          }
          return strategy;
        }),
      );

      // Wait for fade out animation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Keep the strategy selected (it will now be in the completed section)
      setFadingOutStrategyId(null);
    } finally {
      setLoadingStrategyId(null);
    }
  };

  const handleStrategySelect = (strategyId: string) => {
    // Always clear fading out state when selecting a new strategy
    setFadingOutStrategyId(null);
    setSelectedStrategyId(strategyId);
  };

  const handleGoHome = () => {
    // Reset the main view to landing page
    if (typeof window !== "undefined") {
      localStorage.setItem("quant-view", "landing");
    }
    router.push("/");
  };

  return (
    <div className="w-full h-screen bg-[#fdfbf7] flex flex-col relative overflow-hidden overflow-x-hidden">
      {/* Background Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50 text-stone-900">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={handleGoHome}
        >
          <Logo size={20} className="text-stone-900" />
          <span className="text-sm tracking-[0.2em] uppercase font-medium text-stone-900">
            Quant
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ExpandableButton label="Home" icon={Home} onClick={handleGoHome} />

          {session?.user && (
            <button
              onClick={() => router.push("/settings")}
              className="flex items-center gap-3 px-3 py-1.5 border border-stone-300 rounded-full hover:bg-stone-900 hover:text-white transition-all duration-300 group"
            >
              <Avatar
                src={session.user.image || undefined}
                name={session.user.name || "User"}
                size="sm"
                className="w-8 h-8 border border-stone-200 group-hover:border-stone-700"
                showFallback
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                }
              />
              <span className="text-xs uppercase tracking-widest text-stone-900 group-hover:text-white transition-colors">
                Profile
              </span>
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex mt-24 pt-8 pb-8 px-8 gap-8 z-10 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Left Column: Strategy List */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-1/3 flex flex-col relative z-10 overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <StrategyListView
            strategies={strategies}
            selectedId={selectedStrategyId}
            onSelect={handleStrategySelect}
            onNewStrategy={handleGoHome}
          />
        </motion.div>

        {/* Right Column: Strategy Details */}
        <AnimatePresence mode="wait">
          {selectedStrategy &&
            (!fadingOutStrategyId ||
              fadingOutStrategyId !== selectedStrategy.id) && (
              <motion.div
                key={selectedStrategy.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-2/3 flex flex-col -ml-16 relative z-0"
              >
                <StrategyDetailsView
                  strategy={selectedStrategy}
                  onTypeChange={handleStrategyTypeChange}
                  onStop={handleStopStrategy}
                  isLoading={
                    selectedStrategy
                      ? loadingStrategyId === selectedStrategy.id
                      : false
                  }
                />
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
