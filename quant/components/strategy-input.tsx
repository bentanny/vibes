"use client";

import React from "react";
import { motion } from "framer-motion";
import { Send, Lock } from "lucide-react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

interface StrategyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function StrategyInput({
  value,
  onChange,
  onSubmit,
  placeholder = "e.g. Buy ETH when RSI < 30 and volume spikes...",
}: StrategyInputProps) {
  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="mt-12 relative max-w-lg mx-auto"
    >
      <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-1.5 md:p-2 hover:bg-white/15 focus-within:bg-white/15">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onValueChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          classNames={{
            base: "w-full",
            input:
              "bg-transparent !text-white placeholder:text-white/60 font-light tracking-wide text-base",
            inputWrapper:
              "bg-transparent shadow-none border-none hover:bg-transparent hover:border-none focus-within:bg-transparent focus-within:border-none data-[hover=true]:bg-transparent h-10 md:h-12",
          }}
          variant="flat"
          size="md"
        />
        <Button
          onPress={handleSubmit}
          isDisabled={!value.trim()}
          isIconOnly
          className="ml-2 min-w-8 w-8 h-8 md:min-w-10 md:w-10 md:h-10 bg-white text-black rounded-md hover:bg-white/90 transition-colors"
          radius="md"
        >
          <Send className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40 font-light tracking-wide">
        <Lock size={12} />
        <span>Non-custodial execution. End-to-end encrypted.</span>
      </div>
    </motion.div>
  );
}
