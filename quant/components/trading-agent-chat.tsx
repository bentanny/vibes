"use client";

import React, { useRef, useEffect } from "react";
import { Bot, Send } from "lucide-react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { ExpandableButton } from "@/components/ui/expandable-button";
import { LoadingSteps } from "@/components/loading-steps";
import type { ChatMessage } from "@/types";

interface TradingAgentChatProps {
  messages: ChatMessage[];
  inputText: string;
  onInputChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  onNewStrategy: () => void;
}

export function TradingAgentChat({
  messages,
  inputText,
  onInputChange,
  onSend,
  onNewStrategy,
}: TradingAgentChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden shadow-lg shadow-stone-200/50 bg-white h-full md:h-auto w-full md:w-auto">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1] flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-stone-700 text-sm md:text-base">
            Trading Agent
          </span>
          <Bot
            size={16}
            className="text-stone-400 ml-1 md:w-[18px] md:h-[18px]"
          />
        </div>
        <ExpandableButton label="New Strategy" onClick={onNewStrategy} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-[#faf8f4] chat-scrollbar min-h-0">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-800 text-white rounded-br-none shadow-md p-3"
                  : msg.isLoading
                    ? "bg-transparent p-0 min-w-[200px] pt-2" // No bubble for loading
                    : "bg-white border border-stone-200 text-stone-700 rounded-bl-none shadow-sm p-3"
              }`}
            >
              {msg.isLoading ? <LoadingSteps /> : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={onSend}
        className="p-3 md:p-4 bg-[#f7f5f1] border-t border-stone-100 flex gap-0 md:gap-2 flex-shrink-0"
      >
        <Input
          type="text"
          value={inputText}
          onValueChange={onInputChange}
          placeholder="Refine strategy..."
          classNames={{
            base: "flex-1 w-full",
            input: "text-sm md:text-base",
            inputWrapper:
              "bg-stone-50 border-transparent focus-within:border-amber-400 hover:border-transparent",
          }}
          variant="bordered"
          size="lg"
          radius="md"
        />
        <Button
          type="submit"
          isIconOnly
          className="hidden md:flex bg-stone-900 text-white hover:bg-stone-700"
          radius="md"
          size="lg"
        >
          <Send size={18} />
        </Button>
      </form>
    </Card>
  );
}
