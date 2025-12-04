"use client";

import React, { useState } from "react";
import { Zap } from "lucide-react";
import { Card } from "@heroui/card";
import type { TradingArchetype } from "@/types";

interface Metric {
  label: string;
  value: string;
  sub: string;
}

interface StrategyInfoSectionProps {
  ticker?: string;
  companyName?: string;
  stockPrice?: number;
  metrics?: Metric[];
  archetype?: TradingArchetype | null;
}

const defaultMetrics: Metric[] = [
  {
    label: "Proj. APY",
    value: "142.5%",
    sub: "+2.4% vs Index",
  },
  { label: "Sharpe Ratio", value: "3.12", sub: "Top 5%" },
  {
    label: "Max Drawdown",
    value: "-8.4%",
    sub: "Conservative",
  },
];

export function StrategyInfoSection({
  ticker = "AAPL",
  companyName = "Apple Inc.",
  stockPrice = 179.5,
  metrics = defaultMetrics,
  archetype = null,
}: StrategyInfoSectionProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <>
      {/* Stock Details */}

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {metrics.map((stat, i) => (
          <Card
            key={i}
            className="p-4 bg-stone-50 border-stone-100 hover:border-amber-200/50 transition-colors cursor-default"
            radius="lg"
          >
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-medium text-stone-800">{stat.value}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <Zap size={10} fill="currentColor" /> {stat.sub}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
