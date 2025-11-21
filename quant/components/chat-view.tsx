"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { Button } from "@heroui/button";
import { Send, TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { AutomateStrategyModal } from "./automate-strategy-modal";
import { StrategyCard } from "./strategy-card";
import type { ChartMode, StrategyType, ChatMessage } from "@/types";

interface ChatViewProps {
  messages: ChatMessage[];
  message: string;
  setMessage: (message: string) => void;
  onSubmit: () => void;
  onStrategyClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  chartMode?: ChartMode;
  setChartMode?: (mode: ChartMode) => void;
  strategyType?: StrategyType | null;
  setStrategyType?: (type: StrategyType | null) => void;
  onStrategySelect?: (strategy: StrategyType, message: string) => void;
  onShowChart?: () => void;
  showChart?: boolean;
}

export function ChatView({
  messages,
  message,
  setMessage,
  onSubmit,
  onStrategyClick,
  onKeyDown,
  chartMode,
  setChartMode,
  strategyType,
  setStrategyType,
  onStrategySelect,
  onShowChart,
  showChart = false,
}: ChatViewProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAutomateModalOpen, setIsAutomateModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonColor = mounted && theme === "dark" ? "#2a2a2a" : "#E0DACF";
  const buttonTextColor = mounted && theme === "dark" ? "#ffffff" : undefined;

  // Detect if "dev" is typed in the message
  const isDevMode = useMemo(() => {
    return message.toLowerCase().includes("dev");
  }, [message]);

  const chartModes: Array<{ label: string; value: ChartMode }> = [
    { label: "Default", value: "events" },
    { label: "Event Correlation", value: "event-correlation" },
    { label: "Asset Correlation", value: "asset-correlation" },
    { label: "3P Correlation", value: "3p-correlation" },
    { label: "Strategy", value: "strategy" },
  ];

  const strategyTypes: Array<{ label: string; value: StrategyType }> = [
    { label: "Event Correlation", value: "event-correlation" },
    { label: "Asset Correlation", value: "asset-correlation" },
    { label: "3P Correlation", value: "3p-correlation" },
    { label: "Specified Time", value: "specified-time" },
    { label: "Data-related", value: "data-related" },
  ];

  const exampleQuestions = [
    "Auto-buy tech stocks when they dip 5%",
    "Build a momentum strategy that trades for me",
  ];

  const handleExampleClick = (question: string) => {
    setMessage(question);
  };

  const handleModeClick = (mode: ChartMode) => {
    const modeLabel = chartModes.find((m) => m.value === mode)?.label || mode;

    // Create a message that includes the mode name for processing
    const modeMessage = message.trim()
      ? `${message.trim()} ${modeLabel.toLowerCase()}`
      : `Show ${modeLabel.toLowerCase()} chart`;

    // Set the chart mode first
    if (setChartMode) {
      setChartMode(mode);
    }

    // Use flushSync to ensure the message state is updated synchronously
    // before onSubmit reads it
    flushSync(() => {
      setMessage(modeMessage);
    });

    // Now submit with the updated message
    onSubmit();
  };

  const handleStrategyModeClick = (strategy: StrategyType) => {
    const strategyLabel =
      strategyTypes.find((s) => s.value === strategy)?.label || strategy;

    // Create a message that includes the strategy name for processing
    const strategyMessage = message.trim()
      ? `${message.trim()} ${strategyLabel.toLowerCase()}`
      : `Build ${strategyLabel.toLowerCase()} strategy`;

    // If onStrategySelect is provided (from new UX flow), use it
    if (onStrategySelect) {
      onStrategySelect(strategy, strategyMessage);
      return;
    }

    // Fallback to old behavior
    if (setStrategyType) {
      setStrategyType(strategy);
    }

    if (setChartMode) {
      setChartMode("strategy");
    }

    flushSync(() => {
      setMessage(strategyMessage);
    });

    onSubmit();
  };

  // Helper function to determine message type
  const getMessageType = (msg: ChatMessage): "text" | "strategy" => {
    // Explicitly check for strategy card type
    if (msg.type === "strategy" || msg.isStrategy === true) {
      return "strategy";
    }
    // Default to text message
    return msg.type || "text";
  };

  const hasMessages = messages.length > 0;
  const hasStrategyMessage = messages.some(
    (msg) => getMessageType(msg) === "strategy",
  );
  // Show "See Chart" button when chart is not showing and we have messages with strategy context
  const shouldShowChartButton =
    hasMessages &&
    !showChart &&
    onShowChart &&
    (hasStrategyMessage || chartMode === "strategy" || strategyType !== null);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        className={`mb-4 md:mb-6 flex-1 overflow-y-auto ${!hasMessages ? "flex flex-col justify-center items-center" : "space-y-3 md:space-y-4"}`}
      >
        {!hasMessages ? (
          <div className="text-center px-4">
            <h1 className="mb-2 md:mb-3 text-2xl md:text-4xl font-semibold tracking-tight text-balance">
              Your strategy, running 24/7
            </h1>
            <p className="text-default-500 text-sm md:text-lg">
              Build trading strategies that buy and sell for you, so you don't
              have to
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            // Determine message type: "text" for regular messages, "strategy" for strategy cards
            const messageType = getMessageType(msg);
            const isStrategyCard = messageType === "strategy";
            const isTextMessage = messageType === "text";

            return (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Strategy Card Message - Renders as a card with strategy details */}
                {isStrategyCard ? (
                  <div className="w-full">
                    <StrategyCard />
                  </div>
                ) : (
                  /* Text Message - Renders as a simple chat bubble */
                  isTextMessage && (
                    <div
                      className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-3 py-2 md:px-4 md:py-3 transition-colors duration-200 ${
                        msg.role === "user"
                          ? "bg-gray-700 dark:bg-[#171219] text-white dark:text-white"
                          : "bg-white dark:bg-[#171219] text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-900"
                      }`}
                    >
                      <p className="text-xs md:text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="relative w-full">
        {/* Dev Mode Chart Mode Buttons - Left of chat box */}
        {isDevMode && setChartMode && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 flex flex-col gap-2 z-10">
            {chartModes.map((mode) => (
              <Button
                key={mode.value}
                onPress={() => handleModeClick(mode.value)}
                variant="flat"
                size="sm"
                radius="full"
                className="text-xs md:text-sm whitespace-nowrap"
                style={{
                  backgroundColor:
                    mounted && theme === "dark" ? "#1a1a1a" : "#f5f5f5",
                  color: mounted && theme === "dark" ? "#999" : "#666",
                }}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        )}

        {/* Strategy Mode Buttons - Right of chat box */}
        {isDevMode && setStrategyType && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 flex flex-col gap-2 z-10">
            {strategyTypes.map((strategy) => (
              <Button
                key={strategy.value}
                onPress={() => handleStrategyModeClick(strategy.value)}
                variant="flat"
                size="sm"
                radius="full"
                className="text-xs md:text-sm whitespace-nowrap"
                style={{
                  backgroundColor:
                    mounted && theme === "dark" ? "#1a1a1a" : "#f5f5f5",
                  color: mounted && theme === "dark" ? "#999" : "#666",
                }}
              >
                {strategy.label}
              </Button>
            ))}
          </div>
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe the strategy you want to automate..."
          rows={3}
          className="w-full min-h-[100px] md:min-h-[120px] px-3 py-2 pr-12 text-sm md:text-base bg-white dark:bg-[#171219] border border-gray-300 dark:border-zinc-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-800 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-500 transition-colors duration-200"
        />
        <Button
          onPress={onSubmit}
          isDisabled={!message.trim()}
          isIconOnly
          size="sm"
          radius="full"
          className="absolute bottom-3 right-3"
          style={{ backgroundColor: buttonColor }}
        >
          <Send className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>

      {/* Footer / Examples */}
      <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
        {!hasMessages ? (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
            {exampleQuestions.map((question, idx) => (
              <Button
                key={idx}
                onPress={() => handleExampleClick(question)}
                variant="flat"
                size="sm"
                radius="full"
                className="text-xs md:text-sm"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-2">
            {shouldShowChartButton && (
              <Button
                onPress={onShowChart}
                variant="flat"
                size="sm"
                radius="full"
                className="text-xs md:text-sm"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
                startContent={<BarChart3 className="h-3 w-3 md:h-4 md:w-4" />}
              >
                See Chart
              </Button>
            )}
            <Button
              onPress={onStrategyClick}
              variant="flat"
              size="sm"
              radius="full"
              className="text-xs md:text-sm"
              style={{
                backgroundColor: buttonColor,
                color: buttonTextColor,
              }}
              startContent={<TrendingUp className="h-3 w-3 md:h-4 md:w-4" />}
            >
              Automate a strategy
            </Button>
          </div>
        )}

        <p className="text-center text-[10px] md:text-xs text-default-500">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>

      {/* Automate Strategy Modal */}
      <AutomateStrategyModal
        isOpen={isAutomateModalOpen}
        onClose={() => setIsAutomateModalOpen(false)}
      />
    </div>
  );
}
