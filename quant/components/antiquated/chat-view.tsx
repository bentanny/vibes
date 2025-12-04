"use client";

import { useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { Button } from "@heroui/button";
import { Send, TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { AutomateStrategyModal } from "../automate-strategy-modal";
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
  const [isAutomateModalOpen, setIsAutomateModalOpen] = useState(false);

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
          <div className="text-left px-4">
            <h1 className="mb-3 md:mb-4 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance transition-colors duration-300">
              Your strategy, running 24/7
            </h1>
            <p className="text-default-500 text-lg md:text-xl lg:text-2xl transition-colors duration-300 max-w-2xl">
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
                      className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-4 py-3 md:px-5 md:py-4 ${
                        msg.role === "user"
                          ? "bg-default-200 text-default-foreground"
                          : "bg-default-100 dark:bg-zinc-900 text-default-foreground"
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed">
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
          className="w-full min-h-[100px] md:min-h-[120px] px-4 py-3 pr-12 text-base md:text-lg bg-default-100 dark:bg-zinc-900 border border-default-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-default-300 focus:border-transparent resize-none text-default-foreground placeholder:text-default-500"
        />
        <Button
          onPress={onSubmit}
          isDisabled={!message.trim()}
          isIconOnly
          size="sm"
          radius="full"
          className="absolute bottom-3 right-3"
        >
          <Send className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>

      {/* Footer / Examples */}
      <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
        {!hasMessages ? (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-start">
            {exampleQuestions.map((question, idx) => (
              <Button
                key={idx}
                onPress={() => handleExampleClick(question)}
                variant="flat"
                size="md"
                radius="full"
                className="text-sm md:text-base"
              >
                {question}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex justify-start gap-2">
            {shouldShowChartButton && (
              <Button
                onPress={onShowChart}
                variant="flat"
                size="md"
                radius="full"
                className="text-sm md:text-base"
                startContent={<BarChart3 className="h-4 w-4 md:h-5 md:w-5" />}
              >
                See Chart
              </Button>
            )}
            <Button
              onPress={onStrategyClick}
              variant="flat"
              size="md"
              radius="full"
              className="text-sm md:text-base"
              startContent={<TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
            >
              Automate a strategy
            </Button>
          </div>
        )}

        <p className="text-left text-xs md:text-sm text-default-500">
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
