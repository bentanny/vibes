"use client";

import { useMemo } from "react";
import { Card } from "@heroui/card";
import { ChatView } from "./chat-view";
import type { ChartMode, StrategyType, ChatMessage } from "@/types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  message: string;
  setMessage: (message: string) => void;
  onSubmit?: () => void;
  showChart?: boolean;
  onStrategyRequest?: () => void;
  resetTrigger?: number;
  chartMode?: ChartMode;
  setChartMode?: (mode: ChartMode) => void;
  strategyType?: StrategyType | null;
  setStrategyType?: (type: StrategyType | null) => void;
  onStrategySelect?: (strategy: StrategyType, message: string) => void;
  onShowChart?: () => void;
}

export function ChatInterface({
  messages,
  setMessages,
  message,
  setMessage,
  onSubmit = () => {},
  showChart = false,
  onStrategyRequest = () => {},
  resetTrigger = 0,
  chartMode = "events",
  setChartMode,
  strategyType = null,
  setStrategyType,
  onStrategySelect,
  onShowChart,
}: ChatInterfaceProps) {
  // Note: Parent component handles message reset via resetTrigger
  // We don't need to clear messages here as it causes conflicts

  // Detect "buy" keyword in message to trigger strategy card response
  const detectBuyKeyword = (msg: string): boolean => {
    return msg.trim().toLowerCase().includes("buy");
  };

  const handleSubmit = () => {
    if (!message.trim()) return;

    // Check for "buy" keyword - parent component will handle creating strategy card
    // This detection happens here for clarity, but parent handles the response
    const hasBuyKeyword = detectBuyKeyword(message);

    // Submit to parent - parent will check for "buy" and create appropriate response
    // Message types: "text" for regular messages, "strategy" for strategy cards
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStrategyClick = () => {
    onStrategyRequest();
  };

  // Determine if the card should be visually "active" (shadow, bg, border)
  // This happens when we have messages OR when chart is showing
  const showCard = useMemo(() => {
    return messages.length > 0 || showChart;
  }, [messages.length, showChart]);

  return (
    <Card
      className={`transition-all duration-500 flex flex-col
        ${
          // Size transitions:
          // 1. Initial Query (wide, auto height)
          // 2. Chart Showing (full width/height)
          // 3. Active Chat (narrower, fixed height)
          showChart
            ? "w-full h-full p-6"
            : !showCard
              ? "w-full max-w-3xl h-auto p-4 md:p-8 bg-transparent shadow-none border-none overflow-visible"
              : "w-full max-w-3xl h-[82vh] max-h-[820px] p-6 shadow-2xl border-gray-300 dark:border-zinc-900 bg-[#ECE9E2] dark:bg-black"
        }
      `}
    >
      <ChatView
        messages={messages}
        message={message}
        setMessage={setMessage}
        onSubmit={handleSubmit}
        onStrategyClick={handleStrategyClick}
        onKeyDown={handleKeyDown}
        chartMode={chartMode}
        setChartMode={setChartMode}
        strategyType={strategyType}
        setStrategyType={setStrategyType}
        onStrategySelect={onStrategySelect}
        onShowChart={onShowChart}
        showChart={showChart}
      />
    </Card>
  );
}
