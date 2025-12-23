"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/contexts/auth-context";
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
  GalleryVerticalEnd,
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
import { streamRun } from "@/lib/langgraph";
import { MobileDashboardLayout } from "@/components/mobile-dashboard-layout";
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
  threadId?: string;
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

// Safe UUID generator that works in all environments
function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

  const [threadId, setThreadId] = useState<string>(() => {
    if (persistedState.current?.threadId) {
      return persistedState.current.threadId;
    }
    return generateUUID();
  });

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
        content: "",
        isLoading: true,
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
  const hasStartedInitialRun = useRef(false);

  // Track when the agent has finished its initial loading state
  const [hasAgentResponded, setHasAgentResponded] = useState(() => {
    if (!persistedState.current?.messages) return false;
    const msgs = persistedState.current.messages;
    const lastMsg = msgs[msgs.length - 1];
    // Only true if the last message is from assistant and NOT loading
    return lastMsg?.role === "assistant" && !lastMsg.isLoading;
  });

  const [isStrategyVisible, setIsStrategyVisible] = useState(() => {
    if (!persistedState.current?.messages) return false;
    const msgs = persistedState.current.messages;
    const lastMsg = msgs[msgs.length - 1];
    // Only true if the last message is from assistant and NOT loading
    return lastMsg?.role === "assistant" && !lastMsg.isLoading;
  });

  // Toggle for testing visualization parameters (set to true to enable custom data)
  const ENABLE_AGENT_VISUALIZATION = false;

  // Mock visualization data - simulates agent output
  // This will be replaced with actual agent data when ready
  const getMockVisualizationData = () => {
    if (!detectedArchetype) return {};

    const visualizationType = detectedArchetype.includes("time_window")
      ? "time_window"
      : detectedArchetype.includes("scheduled")
        ? "scheduled"
        : detectedArchetype.includes("percent_dip")
          ? "percent_dip"
          : detectedArchetype.includes("percent_spike")
            ? "percent_spike"
            : detectedArchetype.includes("metric_spike") ||
                detectedArchetype.includes("metric_dip")
              ? "metric"
              : detectedArchetype.includes("profit_scaling")
                ? "profit_scaling"
                : null;

    switch (visualizationType) {
      case "time_window":
        return {
          openTime: "08:00",
          closeTime: "12:00",
          label: "Active Window",
        };
      case "scheduled":
        return {
          frequencyLabels: ["Mon", "Wed", "Fri"],
        };
      case "percent_dip":
        return {
          value: "-8%",
          label: "Dip",
        };
      case "percent_spike":
        return {
          value: "+12%",
          label: "Spike",
        };
      case "metric":
        return {
          metricName: "RSI",
        };
      case "profit_scaling":
        return {
          profitTargets: ["1.5x", "3x", "5x"],
        };
      default:
        return {};
    }
  };

  const mockVisualizationData = getMockVisualizationData();

  // Watch messages to detect when the agent response arrives (loading stops)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!hasAgentResponded && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Check if we have an assistant message that is done loading
      if (lastMsg.role === "assistant" && !lastMsg.isLoading) {
        // Add a 2-second delay before sliding down
        timeoutId = setTimeout(() => {
          setHasAgentResponded(true);
        }, 2000);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messages, hasAgentResponded]);

  useEffect(() => {
    if (hasAgentResponded && !isStrategyVisible) {
      setIsStrategyVisible(true);
    }
  }, [hasAgentResponded, isStrategyVisible]);

  // Persist state changes to sessionStorage
  useEffect(() => {
    savePersistedState(ticker, {
      isInitialized,
      messages,
      ticker,
      threadId,
    });
  }, [isInitialized, messages, ticker, threadId]);

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

  const processStream = async (newMessages: any[]) => {
    try {
      const stream = streamRun(
        { messages: newMessages },
        { threadId, assistantId: "agent" },
      );

      for await (const chunk of stream) {
        if (chunk.messages && Array.isArray(chunk.messages)) {
          const lastMsg = chunk.messages[chunk.messages.length - 1];
          // Check if it's an AI message (assistant)
          if (lastMsg.type === "ai" || lastMsg.role === "assistant") {
            const content =
              typeof lastMsg.content === "string"
                ? lastMsg.content
                : JSON.stringify(lastMsg.content);

            setMessages((prev) => {
              const newMsgs = [...prev];
              const lastIdx = newMsgs.length - 1;
              if (newMsgs[lastIdx].role === "assistant") {
                const isLoading = content.trim() === "";
                newMsgs[lastIdx] = {
                  ...newMsgs[lastIdx],
                  content: content,
                  isLoading: isLoading,
                };
              }
              return newMsgs;
            });
          }
        }
      }
    } catch (e) {
      console.error("Stream error:", e);
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.length - 1;
        if (newMsgs[lastIdx].role === "assistant") {
          newMsgs[lastIdx] = {
            ...newMsgs[lastIdx],
            content: "Error connecting to agent. Please try again.",
            isLoading: false,
          };
        }
        return newMsgs;
      });
    }
  };

  // Trigger initial run if new session
  useEffect(() => {
    const isNewSession = !persistedState.current?.messages;
    if (isNewSession && !hasStartedInitialRun.current && strategy) {
      hasStartedInitialRun.current = true;
      processStream([{ role: "user", content: strategy }]);
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userMessage = inputText;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isLoading: true },
    ]);
    setInputText("");

    await processStream([{ role: "user", content: userMessage }]);
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

  function PortfolioButton({
    router,
  }: {
    router: ReturnType<typeof useRouter>;
  }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="relative flex items-center cursor-pointer"
        onClick={() => router.push("/portfolio")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center overflow-hidden">
          <span
            className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-300 ease-out ${
              isHovered
                ? "max-w-[120px] opacity-100 mr-2 text-amber-600"
                : "max-w-0 opacity-0 text-stone-500"
            }`}
          >
            Portfolio
          </span>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border ${
            isHovered
              ? "bg-stone-900 text-white border-transparent rotate-90"
              : "bg-transparent border-stone-300 text-stone-500"
          }`}
        >
          <GalleryVerticalEnd size={14} className="transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#fdfbf7] relative overflow-hidden">
      <div className="md:hidden w-full h-full absolute inset-0 z-50">
        <MobileDashboardLayout
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSend}
          handleGoBack={handleGoBack}
          isInitialized={isInitialized}
          setIsInitialized={setIsInitialized}
          isStrategyVisible={isStrategyVisible}
          hasAgentResponded={hasAgentResponded}
          ticker={ticker}
          companyName={companyName}
          stockPrice={stockPrice}
          changePercent={changePercent}
          isPriceLoading={isPriceLoading}
          isConnected={isConnected}
          imgSrc={imgSrc}
          detectedArchetype={detectedArchetype}
          currentLogic={currentLogic}
          mockVisualizationData={mockVisualizationData}
          ENABLE_AGENT_VISUALIZATION={ENABLE_AGENT_VISUALIZATION}
          session={session}
          status={status}
          router={router}
          isSignInOpen={isSignInOpen}
          setIsSignInOpen={setIsSignInOpen}
          onGoBack={handleGoBack}
        />
      </div>
      <div className="hidden md:flex w-full h-full flex-col relative overflow-hidden overflow-x-hidden">
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
            <div className="flex items-center gap-3">
              <PortfolioButton router={router} />
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
            </div>
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

        <div
          className={`flex-1 flex mt-16 md:mt-24 pt-4 pb-4 md:pt-8 md:pb-8 px-4 md:px-8 gap-4 md:gap-8 z-10 max-w-[1600px] mx-auto w-full overflow-y-auto overflow-x-hidden ${
            !isStrategyVisible ? "justify-center" : ""
          }`}
        >
          {/* 
          ====================================================================
          CHAT COMPONENT ANIMATION - CRITICAL: DO NOT MODIFY WITHOUT REVIEW
          ====================================================================
          
          IMPORTANT: This component does NOT use the `layout` prop on the outer
          motion.div. Here's why:
          
          When navigating from the landing page (app/page.tsx), the entire
          DashboardView animates in with a slide-up transition. If we use the
          `layout` prop here, Framer Motion's layout animation system tries to
          compensate for the parent's transform, causing the chat component to
          drift/move independently from top to bottom during the initial load.
          
          The chat should stay FIXED relative to the dashboard background during
          the page transition. Only AFTER the page has loaded should it animate
          when isInitialized changes (sliding off to the left when user clicks
          "Initialize Strategy").
          
          Animation behavior:
          1. Initial page load: Chat stays fixed in position (no layout prop)
          2. User clicks "Initialize Strategy": Chat slides left (-120% x) and
             width collapses to 0 (handled by outer motion.div)
          3. User clicks back arrow: Chat slides back in (x: 0) and width expands
          
          If you need to modify this animation, test the transition from landing
          page to dashboard to ensure the chat doesn't drift on initial load.
          ====================================================================
        */}
          {/* Left Column: Chat Experience */}
          <motion.div
            initial={false}
            animate={{
              width: isInitialized ? 0 : "33.333333%",
              marginRight: isInitialized ? 0 : undefined,
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
            className="flex-shrink-0 flex flex-col relative z-10"
            style={{ minWidth: 0 }}
          >
            {/* 
            ANIMATION NOTE: 
            To create a smooth "slide off" effect without squashing the content:
            1. The outer motion.div handles the layout collapse (width -> 0)
            2. This inner motion.div handles the visual slide (-120% x-axis)
            3. The fixed/min/max width on this inner container prevents text reflow
            4. Removing overflow-hidden from parent allows it to slide past the edge
          */}
            <motion.div
              animate={{
                x: isInitialized ? "-120%" : 0,
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
              className="flex-1 flex flex-col h-full w-[30vw] min-w-[450px] max-w-[600px]"
            >
              <TradingAgentChat
                messages={messages}
                inputText={inputText}
                onInputChange={setInputText}
                onSend={handleSend}
                onNewStrategy={handleGoBack}
              />
            </motion.div>
          </motion.div>

          {/* Right Column: Strategy Card */}
          <AnimatePresence>
            {isStrategyVisible && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{ opacity: 0, x: 50 }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
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
                              const config =
                                getArchetypeConfig(detectedArchetype);
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
                            useCustomData={ENABLE_AGENT_VISUALIZATION}
                            data={mockVisualizationData}
                            runOnLoad={true}
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
                      <div className="flex flex-col md:flex-row gap-4 items-stretch">
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
                        <div className="flex-shrink-0 flex md:flex-col items-center justify-center relative py-2 md:py-0 my-0 md:my-4">
                          <div className="w-full h-px md:w-px md:h-full bg-stone-300/50 absolute top-1/2 left-0 md:top-0 md:left-1/2 -translate-y-1/2 md:translate-y-0 md:-translate-x-1/2" />
                          <div className="relative p-1 bg-[#f3f1ed] text-stone-300 border border-stone-200 rounded-full z-10">
                            <Zap size={12} />
                          </div>
                        </div>

                        {/* SELL SIDE */}
                        <div className="flex-1 bg-[#edece8] p-5 rounded-xl border border-stone-200/60 relative group hover:border-red-300/50 transition-all shadow-sm flex flex-col justify-center">
                          <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 rounded border border-stone-200 text-[9px] font-bold tracking-widest text-red-400 uppercase shadow-sm flex items-center gap-1">
                            <DollarSign size={10} className="text-red-400" />{" "}
                            Selling Conditions
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
                    <div className="mt-auto flex flex-col md:flex-row justify-between items-center pt-6 border-t border-stone-100 gap-4 md:gap-0">
                      <div className="flex gap-4 text-xs text-stone-400 font-medium tracking-wider uppercase order-2 md:order-1">
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
                      <Button
                        className={`w-full md:w-auto px-8 py-3 bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-lg shadow-amber-900/10 order-1 md:order-2 ${
                          isInitialized
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                        }`}
                        radius="lg"
                        size="lg"
                        endContent={<ArrowRight size={14} />}
                        onPress={() => setIsInitialized(true)}
                      >
                        Initialize Strategy
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Strategy Confirmation Panel: Slides in/out from right - only rendered when initialized */}
        <AnimatePresence mode="sync">
          {isInitialized && (
            <motion.div
              key="confirmation-panel"
              initial={{ x: "120%" }}
              animate={{ x: 0 }}
              exit={{
                x: "120%",
                transition: { duration: 0.5, ease: "easeInOut" },
              }}
              transition={{
                duration: 0.5,
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
    </div>
  );
}
