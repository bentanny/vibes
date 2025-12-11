"use client";

import React, { useState } from "react";
import {
  DynamicStrategyVisualizer,
  type SimulationConfig,
} from "@/components/dynamic-strategy-visualizer";
import { parseStrategyToConfig } from "@/lib/strategy-parser";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { RefreshCw, Zap } from "lucide-react";

// Updated Examples using the new Logic
const EXAMPLE_CONFIGS: { name: string; desc: string; input: string }[] = [
  {
    name: "RSI Spike Reversion",
    desc: "Buying when RSI spikes aggressively.",
    input: "Buy when RSI spikes",
  },
  {
    name: "Bollinger Breakout",
    desc: "Shorting when price exceeds the upper band.",
    input: "Short bollinger band breakout",
  },
  {
    name: "Trend Pullback",
    desc: "Buying the dip in a strong trend.",
    input: "Buy pullback to SMA in uptrend",
  },
];

export default function PlayPage() {
  const [currentConfig, setCurrentConfig] = useState<SimulationConfig | null>(
    null,
  );
  const [inputValue, setInputValue] = useState(EXAMPLE_CONFIGS[0].input);
  const [key, setKey] = useState(0);

  // Initialize with first example
  React.useEffect(() => {
    handleCustomSubmit();
  }, []); // eslint-disable-line

  const handleCustomSubmit = () => {
    if (!inputValue.trim()) return;
    const config = parseStrategyToConfig(inputValue);
    setCurrentConfig(config);
    setKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Controls */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Strategy Lab</h1>
            <p className="text-stone-500">
              Test strategies against simulated market physics.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <CardBody className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold text-sm uppercase">
                <Zap size={16} fill="currentColor" />
                <span>Describe Strategy</span>
              </div>
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. Buy when RSI spikes..."
                  className="w-full h-24 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomSubmit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  color="primary"
                  className="w-full mt-2"
                  onPress={handleCustomSubmit}
                  isDisabled={!inputValue.trim()}
                >
                  Simulate Physics
                </Button>
              </div>
              <p className="text-[10px] text-stone-400">
                The Director AI will manipulate the market simulation to test
                your logic.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 space-y-4">
              <h3 className="font-semibold text-sm uppercase text-stone-500">
                Physics Presets
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLE_CONFIGS.map((ex, i) => (
                  <Button
                    key={i}
                    variant="flat"
                    className="justify-start h-auto py-3 px-4"
                    onPress={() => {
                      setInputValue(ex.input);
                      // Need to wait for state update in real app, but here we just trigger
                      const config = parseStrategyToConfig(ex.input);
                      setCurrentConfig(config);
                      setKey((k) => k + 1);
                    }}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{ex.name}</div>
                      <div className="text-xs text-stone-500 font-normal">
                        {ex.desc}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Visualization Stage */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[500px]">
          {currentConfig && (
            <DynamicStrategyVisualizer
              key={key}
              config={currentConfig}
              autoPlay={true}
            />
          )}

          <div className="mt-8 max-w-lg text-center text-sm text-stone-500">
            <p>
              <strong>Director Mode:</strong> The simulation engine now injects
              specific market forces (Trend, Volatility, Momentum) based on your
              request to create realistic test scenarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
