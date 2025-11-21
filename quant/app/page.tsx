"use client";

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { ChatInterface } from "@/components/chat-interface";
import { StockChart } from "@/components/stock-chart";
import { Card } from "@heroui/card";
import type { ChartMode, StrategyType, ChatMessage } from "@/types";

export default function Home() {
  const { theme } = useTheme();
  const [showChart, setShowChart] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>("events");
  const [strategyType, setStrategyType] = useState<StrategyType | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isReady, setIsReady] = useState(true); // Track if system is ready for new interactions
  const [hasInitialized, setHasInitialized] = useState(false); // Track if initial slide-in has happened
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    // Trigger initial slide-in animation from left
    requestAnimationFrame(() => {
      setHasInitialized(true);
    });
  }, []);

  useEffect(() => {
    const handleResetApp = () => {
      // Mark system as not ready during reset
      setIsReady(false);

      // If chart or messages are showing, animate them out
      if (showChart || messages.length > 0) {
        // Start reset animation - slide everything to the right
        setIsResetting(true);

        // After slide-out animation completes (700ms), reset state
        setTimeout(() => {
          setShowChart(false);
          setChartMode("events");
          setStrategyType(null);
          setMessages([]);
          setCurrentMessage("");
          setIsResetting(false);

          // Position off-screen left first, then trigger slide-in animation
          setHasInitialized(false);
          // Small delay to ensure element is positioned off-screen left before animating
          setTimeout(() => {
            requestAnimationFrame(() => {
              setHasInitialized(true);
              setResetKey((prev) => prev + 1);
              setIsReady(true);
            });
          }, 50); // Small delay to ensure positioning
        }, 700); // Match animation duration
      } else {
        // No chart showing, just reset state immediately
        setChartMode("events");
        setStrategyType(null);
        setMessages([]);
        setCurrentMessage("");
        setResetKey((prev) => prev + 1);
        setIsReady(true);
      }
    };

    window.addEventListener("resetApp", handleResetApp);
    return () => {
      window.removeEventListener("resetApp", handleResetApp);
    };
  }, [showChart, messages.length]);

  const handleSubmit = () => {
    if (!currentMessage.trim() || !isReady) return;

    const messageContent = currentMessage.trim();
    const messageLower = messageContent.toLowerCase();

    // Only show chart if message contains "stockData"
    const shouldShowChart = messageLower.includes("stockdata");

    // Check for chart mode keywords in the message
    const isStrategyQuestion =
      messageLower.includes("strategy") || messageLower.includes("trading");
    const isEventCorrelationQuestion =
      messageLower.includes("event correlation");
    const isAssetCorrelationQuestion =
      messageLower.includes("asset correlation");
    const is3PCorrelationQuestion = messageLower.includes("3p correlation");

    // Detect "buy" keyword - triggers strategy card response (type: "strategy")
    // This creates a strategy card instead of a regular text message
    const shouldShowStrategyCard = messageLower.includes("buy");

    // Add user message and conditionally show chart in flushSync to ensure immediate re-render
    flushSync(() => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageContent, type: "text" },
      ]);

      // Set chart mode based on message content or keep existing mode
      if (isStrategyQuestion) {
        setChartMode("strategy");
      } else if (isEventCorrelationQuestion) {
        setChartMode("event-correlation");
      } else if (isAssetCorrelationQuestion) {
        setChartMode("asset-correlation");
      } else if (is3PCorrelationQuestion) {
        setChartMode("3p-correlation");
      }

      // Only show chart if message contains "stockData"
      if (shouldShowChart) {
        setShowChart(true);
      } else {
        setShowChart(false);
      }
    });

    // Clear input
    setCurrentMessage("");

    // Add assistant response after delay
    // Two message types:
    // 1. type: "strategy" - Renders as a strategy card component
    // 2. type: "text" - Renders as a regular chat bubble
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        // Show strategy card if "buy" is detected OR if it's a strategy question
        shouldShowStrategyCard || isStrategyQuestion
          ? {
              role: "assistant",
              content: "momentum-strategy",
              type: "strategy", // Strategy card message type
              isStrategy: true, // Legacy support
            }
          : {
              role: "assistant",
              content:
                "Based on the current market analysis, here are the key insights from the stock chart...",
              type: "text", // Regular text message type
            },
      ]);
    }, 1000);
  };

  const handleStrategyRequest = () => {
    // Add user message for strategy
    const strategyMessage = "Build a momentum trading strategy for AAPL";
    flushSync(() => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: strategyMessage, type: "text" },
      ]);
      setChartMode("strategy");
      setShowChart(true);
    });

    // Add strategy response after delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "momentum-strategy",
          type: "strategy",
          isStrategy: true, // Legacy support
        },
      ]);
    }, 1000);
  };

  const handleStrategySelect = (strategy: StrategyType, message: string) => {
    flushSync(() => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message, type: "text" },
      ]);
      setStrategyType(strategy);
      setChartMode("strategy");
      // Do NOT set showChart to true - keeps chat in center
    });

    // Add assistant response after delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've set up the ${strategy} strategy workspace. What specific parameters would you like to configure?`,
          type: "text",
        },
      ]);
    }, 1000);
  };

  const handleShowChart = () => {
    flushSync(() => {
      setChartMode("strategy");
      setShowChart(true);
    });
  };

  const bgColor = mounted && theme === "dark" ? "#181818" : "#ECE9E2";

  return (
    <div
      className="h-full w-full overflow-hidden bg-background relative"
      style={{ backgroundColor: bgColor }}
    >
      <div className="h-full w-full relative">
        <main className="max-w-7xl mx-auto py-8 pt-28 h-full flex relative overflow-hidden">
          {/* Chart Layer - Left Side */}
          <div
            className={`flex-1 min-w-0 transition-all duration-700 ease-in-out ${
              isResetting
                ? "translate-x-full opacity-0"
                : showChart
                  ? "opacity-100 translate-x-0 mr-6"
                  : "opacity-0 -translate-x-full pointer-events-none"
            }`}
          >
            <div className="h-full">
              <Card className="h-full p-8 shadow-lg border-stone-300/50 dark:border-stone-800/50 bg-stone-50 dark:bg-stone-900 transition-colors duration-300 flex flex-col">
                <StockChart mode={chartMode} />
              </Card>
            </div>
          </div>

          {/* Chat Layer - Right Side (or Centered) */}
          <div
            className={`z-20 flex-shrink-0
              ${showChart ? "w-[400px]" : "w-full"}
              ${
                isResetting
                  ? "translate-x-full opacity-0 transition-all duration-700 ease-in-out"
                  : hasInitialized
                    ? "translate-x-0 opacity-100 transition-all duration-700 ease-in-out"
                    : "-translate-x-full opacity-0"
              }
            `}
          >
            <div
              className={`w-full h-full ${
                showChart ? "" : "flex items-center justify-center"
              }`}
            >
              <ChatInterface
                key={`chat-interface-${resetKey}`}
                messages={messages}
                setMessages={setMessages}
                message={currentMessage}
                setMessage={setCurrentMessage}
                onSubmit={handleSubmit}
                showChart={showChart}
                onStrategyRequest={handleStrategyRequest}
                resetTrigger={resetKey}
                chartMode={chartMode}
                setChartMode={setChartMode}
                strategyType={strategyType}
                setStrategyType={setStrategyType}
                onStrategySelect={handleStrategySelect}
                onShowChart={handleShowChart}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
