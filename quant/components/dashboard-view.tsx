"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  ArrowLeft,
  Activity,
  Info,
  Zap,
  AlertTriangle,
  Clock,
  Check,
  DollarSign,
} from "lucide-react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Logo } from "@/components/icons";
import { Spacer } from "@heroui/spacer";
import { StrategyInfoSection } from "@/components/strategy-info-section";
import { StrategyVisualizer } from "@/components/archetype-visualizations";
import { SignInModal } from "@/components/sign-in-modal";
import { StrategyConfirmationPanel } from "@/components/strategy-confirmation-panel";
import { TradingAgentChat } from "@/components/trading-agent-chat";
import { detectArchetype, getArchetypeConfig } from "@/lib/archetype-detector";
import { getArchetypeColorClasses } from "@/lib/utils";
import { useStockPrice } from "@/hooks/use-stock-price";
import { Spinner } from "@heroui/spinner";
import { RollingText } from "@/components/ui/shadcn-io/rolling-text";
import type { ChatMessage, TradingArchetype } from "@/types";

interface DashboardViewProps {
  strategy: string;
  imgSrc: string;
  onGoBack?: () => void;
  ticker?: string;
  companyName?: string;
}

// Storage key for persisting dashboard state
const DASHBOARD_STORAGE_KEY = "quant_dashboard_state";

interface DashboardPersistedState {
  isInitialized: boolean;
  messages: ChatMessage[];
  ticker: string;
}

function getDashboardStorageKey(ticker: string) {
  return `${DASHBOARD_STORAGE_KEY}_${ticker}`;
}

function loadPersistedState(
  ticker: string,
): Partial<DashboardPersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(getDashboardStorageKey(ticker));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load dashboard state:", e);
  }
  return null;
}

function savePersistedState(ticker: string, state: DashboardPersistedState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      getDashboardStorageKey(ticker),
      JSON.stringify(state),
    );
  } catch (e) {
    console.error("Failed to save dashboard state:", e);
  }
}

function clearPersistedState(ticker: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(getDashboardStorageKey(ticker));
    // Also clear the confirmation panel state
    sessionStorage.removeItem(`quant_confirmation_panel_state_${ticker}`);
  } catch (e) {
    console.error("Failed to clear dashboard state:", e);
  }
}

export function DashboardView({
  strategy,
  imgSrc,
  onGoBack,
  ticker = "AAPL",
  companyName = "Apple Inc.",
}: DashboardViewProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  // Real-time stock price from Finnhub
  const {
    price: stockPrice,
    changePercent,
    isLoading: isPriceLoading,
    isConnected,
  } = useStockPrice(ticker);

  // Load persisted state on mount
  const persistedState = useRef<Partial<DashboardPersistedState> | null>(null);
  if (persistedState.current === null && typeof window !== "undefined") {
    persistedState.current = loadPersistedState(ticker);
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Try to restore messages from session storage
    if (
      persistedState.current?.messages &&
      persistedState.current.ticker === ticker
    ) {
      return persistedState.current.messages;
    }
    return [
      {
        role: "user",
        content: strategy,
      },
      {
        role: "assistant",
        content:
          "Blueprint generated. Please review parameters before execution.",
      },
    ];
  });

  const [inputText, setInputText] = useState("");
  const [detectedArchetype, setDetectedArchetype] =
    useState<TradingArchetype | null>(null);
  const [isInitialized, setIsInitialized] = useState(() => {
    // Try to restore isInitialized from session storage
    if (persistedState.current?.ticker === ticker) {
      return persistedState.current.isInitialized ?? false;
    }
    return false;
  });
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const isInitialMount = useRef(true);

  // Persist state changes to sessionStorage
  useEffect(() => {
    savePersistedState(ticker, {
      isInitialized,
      messages,
      ticker,
    });
  }, [isInitialized, messages, ticker]);

  // Track initial mount for animation delay (skip animation if restoring state)
  useEffect(() => {
    // If we restored state, skip the initial animation
    if (persistedState.current?.isInitialized) {
      isInitialMount.current = false;
    } else {
      const timer = setTimeout(() => {
        isInitialMount.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Detect archetype from strategy text, messages, and input
  useEffect(() => {
    // Combine all text sources for detection
    const allText = [
      strategy,
      inputText,
      ...messages
        .filter((msg) => msg.role === "user")
        .map((msg) => msg.content),
    ].join(" ");

    const archetype = detectArchetype(allText);
    setDetectedArchetype(archetype);
  }, [strategy, inputText, messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userMessage = inputText;
    setMessages([
      ...messages,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isLoading: true },
    ]);
    setInputText("");
    setTimeout(() => {
      setMessages((prev) => {
        // Find and replace the loading message
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex(
          (msg) => msg.isLoading === true,
        );
        if (loadingIndex !== -1) {
          newMessages[loadingIndex] = {
            role: "assistant",
            content: "Parameter updated. Re-calculating risk metrics.",
            isLoading: false,
          };
        }
        return newMessages;
      });
    }, 1500);
  };

  const logicMap = {
    pullback: {
      buy: [
        {
          label: "Technical Trigger",
          value: "RSI < 30",
          sub: "Must be above 200-EMA Trendline",
        },
        {
          label: "Volume Confirmation",
          value: "Vol > 150%",
          sub: "Vs 20-period Moving Average",
        },
      ],
      sell: [
        {
          label: "Dynamic Stop",
          value: "Swing Low - 2ATR",
          sub: "Trailing volatility stop",
        },
        {
          label: "Profit Target",
          value: "1.5x Risk",
          sub: "Fibonacci Extension 1.272",
        },
      ],
    },
    reversion: {
      buy: [
        {
          label: "Band Deviation",
          value: "Price < Lower BB",
          sub: "2.5 Standard Deviations",
        },
        {
          label: "Momentum Shift",
          value: "RSI Divergence",
          sub: "Higher Low on Oscillator",
        },
      ],
      sell: [
        {
          label: "Mean Reversion",
          value: "Touch VWAP",
          sub: "Or 20 SMA Centerline",
        },
        {
          label: "Hard Stop",
          value: "3.0 StdDev",
          sub: "Statistical invalidation",
        },
      ],
    },
    breakout: {
      buy: [
        {
          label: "Level Break",
          value: "Close > Resistance",
          sub: "Multi-touch key level",
        },
        {
          label: "Flow Verify",
          value: "Delta > +500",
          sub: "Aggressive buying absorption",
        },
      ],
      sell: [
        {
          label: "Invalidation",
          value: "Close < Break Level",
          sub: "Failed breakout pattern",
        },
        {
          label: "Expansion",
          value: "Measured Move",
          sub: "Projected range height",
        },
      ],
    },
    momentum: {
      buy: [
        {
          label: "Velocity Trigger",
          value: "Price > VWAP",
          sub: "Trading above Opening Range",
        },
        {
          label: "Pattern Break",
          value: "Bull Flag Clear",
          sub: "5m Candle Close",
        },
      ],
      sell: [
        {
          label: "Trailing Stop",
          value: "Prev Candle Low",
          sub: "Tight momentum leash",
        },
        {
          label: "Extension",
          value: "3R Target",
          sub: "Parabolic climax exit",
        },
      ],
    },
    pairs: {
      buy: [
        {
          label: "Z-Score Peak",
          value: "Spread > 2.0",
          sub: "Statistical Extreme",
        },
        {
          label: "Reversion Turn",
          value: "Spread Delta < 0",
          sub: "Convergence beginning",
        },
      ],
      sell: [
        {
          label: "Mean Revert",
          value: "Z-Score = 0",
          sub: "Fair value return",
        },
        { label: "Stop Loss", value: "Spread > 3.0", sub: "Model breakage" },
      ],
    },
    liquidity: {
      buy: [
        {
          label: "Sweep Low",
          value: "Price < Support",
          sub: "Takes sell-side liquidity",
        },
        {
          label: "Rapid Reclaim",
          value: "Close > Support",
          sub: "Within 2 candles (V-Shape)",
        },
      ],
      sell: [
        {
          label: "Structure Low",
          value: "Sweep Low",
          sub: "Invalidation point",
        },
        {
          label: "Liquidity High",
          value: "Opposing High",
          sub: "Next liquidity pool",
        },
      ],
    },
  };

  const currentLogic =
    logicMap[detectedArchetype as keyof typeof logicMap] || logicMap.pullback;

  // Fallback image handling
  const handleImgError = () => {
    // Image error handled by parent
  };

  // Handle going back - clears persisted state so user starts fresh
  const handleGoBack = () => {
    clearPersistedState(ticker);
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <div className="w-full h-screen bg-[#fdfbf7] flex flex-col relative overflow-hidden overflow-x-hidden">
      {/* Background Texture - Light Mode */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Faint watermark of the art */}
      <img src={imgSrc} className="hidden" alt="" onError={handleImgError} />

      {/* Header */}
      <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50 text-stone-900">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={handleGoBack}
        >
          <Logo size={20} className="text-stone-900" />
          <span className="text-sm tracking-[0.2em] uppercase font-medium">
            Quant
          </span>
        </div>

        {status === "authenticated" && session?.user ? (
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
        ) : (
          <Button
            className="px-6 py-2 border border-stone-300 rounded-full text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent"
            variant="bordered"
            radius="full"
            onPress={() => setIsSignInOpen(true)}
          >
            Sign In
          </Button>
        )}
      </nav>

      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onOpenChange={setIsSignInOpen} />

      <div className="flex-1 flex mt-24 pt-8 pb-8 px-8 gap-8 z-10 max-w-[1600px] mx-auto w-full overflow-y-auto overflow-x-hidden">
        {/* Left Column: Chat Experience */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: isInitialized ? 0 : 1,
            x: isInitialized ? -100 : 0,
            width: isInitialized ? 0 : "33.333333%",
            marginRight: isInitialized ? 0 : undefined,
          }}
          transition={{
            duration: 0.35,
            ease: "easeInOut",
            delay: isInitialMount.current ? 0.4 : 0,
          }}
          className="flex-shrink-0 flex flex-col relative z-10 overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <TradingAgentChat
            messages={messages}
            inputText={inputText}
            onInputChange={setInputText}
            onSend={handleSend}
            onNewStrategy={handleGoBack}
          />
        </motion.div>

        {/* Right Column: Strategy Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 0.8,
          }}
          className="w-2/3 flex flex-col -ml-16 relative z-0"
        >
          <Card className="flex-1 flex flex-col overflow-hidden relative group bg-[#f3f1ed] shadow-lg shadow-stone-300/50">
            {/* Decorative Top Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-stone-200 via-amber-400 to-stone-200" />

            {/* Back Arrow - Only visible when initialized */}
            {isInitialized && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="absolute top-6 left-3 z-20"
              >
                <Button
                  isIconOnly
                  variant="light"
                  radius="full"
                  className=" hover:bg-white  text-stone-600 hover:text-stone-900"
                  onPress={() => setIsInitialized(false)}
                >
                  <ArrowLeft size={18} />
                </Button>
              </motion.div>
            )}

            <div
              className={`p-8 ${isInitialized ? "pl-16" : "pl-24"} flex-1 flex flex-col relative transition-all duration-500`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Chip
                      variant="flat"
                      size="sm"
                      radius="sm"
                      className="border border-stone-200 bg-transparent"
                    >
                      <span className="text-[10px] uppercase tracking-widest text-stone-500">
                        Proposed Strategy
                      </span>
                    </Chip>
                    {(() => {
                      const config = detectedArchetype
                        ? getArchetypeConfig(detectedArchetype)
                        : null;
                      if (!config) return null;
                      const IconComponent = config.icon;
                      const colors =
                        getArchetypeColorClasses(detectedArchetype);
                      return (
                        <Chip
                          variant="flat"
                          size="sm"
                          radius="sm"
                          className={`${colors.chipBg} ${colors.chipText} border ${colors.chipBorder}`}
                          startContent={
                            IconComponent ? (
                              <IconComponent size={10} />
                            ) : undefined
                          }
                        >
                          <span className="text-[10px] uppercase tracking-widest font-bold">
                            {config.displayName}
                          </span>
                        </Chip>
                      );
                    })()}
                  </div>
                  <div className="flex items-baseline gap-4 mb-2">
                    {/* <div className="flex items-center gap-2">
                      <img
                        src={`https://img.logo.dev/${companyName?.toLowerCase().replace(/\s+/g, "") || ticker.toLowerCase()}?token=${process.env.NEXT_PUBLIC_LOGODEV_TOKEN || "pk_RZs6nh7dTBSce8pi4IKWbg"}&size=32&retina=true`}
                        alt={`${companyName || ticker} logo`}
                        className="w-8 h-8 rounded-md border border-stone-100 object-cover bg-white"
                        style={{ background: "#fff" }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    </div> */}
                    <h1 className="text-5xl font-serif text-stone-900 leading-none tracking-tight flex items-center gap-2">
                      {ticker}
                      {isConnected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </h1>
                    {isPriceLoading ? (
                      <Spinner size="sm" color="default" />
                    ) : (
                      <>
                        {stockPrice !== null ? (
                          <RollingText
                            key={stockPrice.toFixed(2)}
                            text={`$${stockPrice.toFixed(2)}`}
                            className="text-3xl font-mono text-stone-600 tracking-tighter"
                            transition={{
                              duration: 0.4,
                              delay: 0.05,
                              ease: "easeOut",
                            }}
                          />
                        ) : (
                          <span className="text-3xl font-mono text-stone-600 tracking-tighter">
                            —
                          </span>
                        )}
                        {changePercent !== null ? (
                          <RollingText
                            key={changePercent.toFixed(2)}
                            text={`${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
                            className={`text-sm font-bold px-2.5 py-1 rounded-md border transform -translate-y-1 ${
                              changePercent >= 0
                                ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                                : "text-red-600 bg-red-50 border-red-100"
                            }`}
                            transition={{
                              duration: 0.4,
                              delay: 0.05,
                              ease: "easeOut",
                            }}
                          />
                        ) : (
                          <span className="text-sm font-bold px-2.5 py-1 rounded-md border transform -translate-y-1 text-stone-400 bg-stone-50 border-stone-100">
                            —
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-1">
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                      {companyName}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                      Equity
                    </span>
                  </div>
                  <Spacer y={4} />
                  <div className="flex flex-col gap-4">
                    {detectedArchetype &&
                      (() => {
                        const config = getArchetypeConfig(detectedArchetype);
                        if (!config || !config.desc) return null;
                        return (
                          <span className="text-lg text-stone-500 italic">
                            Trading {companyName} using{" "}
                            {config.desc.toLowerCase()}
                          </span>
                        );
                      })()}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center bg-stone-50 text-amber-600 shadow-inner">
                  <Activity size={24} />
                </div>
              </div>

              {/* Archetype Visualization */}
              {detectedArchetype && (
                <div className="w-full h-48 relative mb-8 group/viz flex items-center justify-center overflow-hidden rounded-xl border border-stone-100/50 bg-[#edece8]">
                  {/* Top label overlay - keeping absolute position */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${getArchetypeColorClasses(detectedArchetype).dot}`}
                    />
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                      Logic:{" "}
                      {getArchetypeConfig(detectedArchetype)?.displayName}
                    </span>
                  </div>

                  {/* Info button - top right */}
                  <Button className="absolute top-4 right-4 isIconOnly h-6 rounded-full bg-[#edece8]  flex items-center justify-center">
                    <Info size={14} className="text-stone-500" />
                  </Button>

                  <motion.div
                    key={detectedArchetype}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex items-center justify-center transform transition-transform duration-500 group-hover/viz:scale-105"
                  >
                    <StrategyVisualizer
                      type={detectedArchetype}
                      variant="dark"
                    />
                  </motion.div>
                </div>
              )}

              {/* <StrategyInfoSection
                ticker={ticker}
                companyName={companyName}
                stockPrice={stockPrice}
                archetype={detectedArchetype}
              /> */}
              {/* --- Logic Pipeline (Buy/Sell Split) --- */}
              <div className="mb-2">
                <div className="flex flex-row gap-4 items-stretch">
                  {/* BUY SIDE */}
                  <div className="flex-1 bg-[#edece8] p-5 rounded-xl border border-stone-200/60 relative group hover:border-emerald-300/50 transition-all shadow-sm flex flex-col justify-center">
                    <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 rounded border border-stone-200 text-[9px] font-bold tracking-widest text-emerald-600 uppercase shadow-sm flex items-center gap-1">
                      <Check size={10} /> Buying Conditions
                    </div>

                    {/* Condition 1 */}
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-emerald-500 transition-colors" />
                      <div>
                        <h4 className="font-serif text-lg text-stone-800 leading-none">
                          {currentLogic.buy[0].value}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                          {currentLogic.buy[0].label}
                        </span>
                      </div>
                    </div>

                    {/* AND Connector */}
                    <div className="ml-0.5 pl-3 border-l border-dashed border-stone-300 my-1 py-1">
                      <span className="text-[9px] text-stone-400 font-bold bg-[#edece8] px-1 -ml-1.5">
                        AND
                      </span>
                    </div>

                    {/* Condition 2 */}
                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-emerald-500 transition-colors" />
                      <div>
                        <h4 className="font-serif text-lg text-stone-800 leading-none">
                          {currentLogic.buy[1].value}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                          {currentLogic.buy[1].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CENTER DIVIDER */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-px bg-stone-300/50 my-4 relative">
                    <div className="absolute p-1 bg-[#f3f1ed] text-stone-300 border border-stone-200 rounded-full">
                      <Zap size={12} />
                    </div>
                  </div>

                  {/* SELL SIDE */}
                  <div className="flex-1 bg-[#edece8] p-5 rounded-xl border border-stone-200/60 relative group hover:border-red-300/50 transition-all shadow-sm flex flex-col justify-center">
                    <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 rounded border border-stone-200 text-[9px] font-bold tracking-widest text-red-400 uppercase shadow-sm flex items-center gap-1">
                      <DollarSign size={10} className="text-red-400" /> Selling
                      Conditions
                    </div>

                    {/* Stop Loss */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-200/50">
                      <div>
                        <h4 className="font-serif text-lg text-stone-800 leading-none">
                          {currentLogic.sell[0].value}
                        </h4>
                        <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">
                          {currentLogic.sell[0].label}
                        </span>
                      </div>
                      <AlertTriangle
                        size={14}
                        className="text-stone-300 group-hover:text-red-400 transition-colors"
                      />
                    </div>

                    {/* Target */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-lg text-stone-800 leading-none">
                          {currentLogic.sell[1].value}
                        </h4>
                        <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                          {currentLogic.sell[1].label}
                        </span>
                      </div>
                      <Clock
                        size={14}
                        className="text-stone-300 group-hover:text-blue-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Visualization Placeholder */}
              {/* <div className="flex-1 rounded-lg bg-stone-900 relative overflow-hidden flex items-end justify-center mb-8 shadow-inner group/chart min-h-[300px]">
                <svg
                  className="w-full h-full absolute inset-0 text-amber-500/20"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,200 Q100,100 200,150 T400,100 T600,180 T800,50 L800,300 L0,300 Z"
                    fill="url(#gradient)"
                  />
                  <path
                    d="M0,200 Q100,100 200,150 T400,100 T600,180 T800,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="0.5"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>Fake Chart Lines 

                
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="border-r border-t border-white/5" />
                  ))}
                </div>

                <div className="absolute top-4 left-4 flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-stone-400 uppercase tracking-wider">
                      Backtest
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-600" />
                    <span className="text-xs text-stone-600 uppercase tracking-wider">
                      Benchmark
                    </span>
                  </div>
                </div>
              </div>
              */}

              {/* Footer / Actions */}
              <div className="mt-auto flex justify-between items-center pt-6 border-t border-stone-100">
                <div className="flex gap-4 text-xs text-stone-400 font-medium tracking-wider uppercase">
                  <span className="hover:text-stone-800 cursor-pointer transition-colors">
                    Risk Parameters
                  </span>
                  <span className="hover:text-stone-800 cursor-pointer transition-colors">
                    Exchanges
                  </span>
                  <span className="hover:text-stone-800 cursor-pointer transition-colors">
                    API Keys
                  </span>
                </div>
                {!isInitialized && (
                  <Button
                    className="px-8 py-3 bg-stone-900 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-900/10"
                    radius="lg"
                    size="lg"
                    endContent={<ArrowRight size={14} />}
                    onPress={() => setIsInitialized(true)}
                  >
                    Initialize Strategy
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Right Panel: Slides in/out from right - only rendered when initialized */}
      <AnimatePresence mode="sync">
        {isInitialized && (
          <motion.div
            key="confirmation-panel"
            initial={{ x: "120%" }}
            animate={{ x: 0 }}
            exit={{
              x: "120%",
              transition: { duration: 0.35, ease: "easeInOut" },
            }}
            transition={{
              duration: 0.35,
              ease: "easeInOut",
            }}
            className="absolute top-24 right-8 bottom-8 z-20 flex flex-col pt-8"
            style={{ width: "calc(33.333% - 24px)" }}
          >
            <StrategyConfirmationPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
