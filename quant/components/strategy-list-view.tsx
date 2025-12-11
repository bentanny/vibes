"use client";

import React from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { ExpandableButton } from "@/components/ui/expandable-button";

export interface StrategyItem {
  id: string;
  ticker: string;
  name: string;
  type: "active" | "paused" | "completed";
  pnl: number;
  pnlPercent: number;
  startedAt: string;
  pausedAt?: string;
  lastTrade?: string;
  nextTradeDate?: string;
  realizedPnl?: number;
  unrealizedPnl?: number;
  roi?: number;
  assetPrice?: number;
  assetRoi?: number;
  trades?: {
    id: string;
    type: "buy" | "sell";
    price: number;
    date: string;
    quantity?: number;
    pnl?: number;
  }[];
}

interface StrategyListViewProps {
  strategies: StrategyItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewStrategy: () => void;
}

export function StrategyListView({
  strategies,
  selectedId,
  onSelect,
  onNewStrategy,
}: StrategyListViewProps) {
  return (
    <Card className="flex-1 flex flex-col overflow-hidden shadow-lg shadow-stone-200/50 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-stone-700">Active Strategies</span>
          <Activity size={18} className="text-stone-400 ml-1" />
        </div>
        <ExpandableButton label="New Strategy" onClick={onNewStrategy} />
      </div>

      {/* Strategy List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf8f4]">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            onClick={() => onSelect(strategy.id)}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
              selectedId === strategy.id
                ? "bg-stone-900 border-stone-900 shadow-md transform scale-[1.005]"
                : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-bold text-lg font-serif ${
                      selectedId === strategy.id
                        ? "text-white"
                        : "text-stone-900"
                    }`}
                  >
                    {strategy.ticker}
                  </h3>
                  <Chip
                    size="sm"
                    variant="flat"
                    className={`h-5 text-[10px] uppercase tracking-wider ${
                      strategy.type === "active"
                        ? "bg-emerald-500/20 text-emerald-600"
                        : strategy.type === "paused"
                          ? "bg-amber-500/20 text-amber-600"
                          : "bg-stone-500/20 text-stone-600"
                    }`}
                  >
                    {strategy.type}
                  </Chip>
                </div>
                <p
                  className={`text-xs ${
                    selectedId === strategy.id
                      ? "text-stone-400"
                      : "text-stone-500"
                  }`}
                >
                  {strategy.name}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`flex items-center justify-end gap-1 font-mono font-medium ${
                    strategy.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {strategy.pnl >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  <span>
                    {strategy.pnl >= 0 ? "+" : ""}
                    {strategy.pnlPercent}%
                  </span>
                </div>
                <span
                  className={`text-xs ${
                    selectedId === strategy.id
                      ? "text-stone-500"
                      : "text-stone-400"
                  }`}
                >
                  {strategy.pnl >= 0 ? "+" : ""}$
                  {Math.abs(strategy.pnl).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-dashed border-stone-200/20 mt-2">
              <div className="flex items-center gap-1.5">
                <Clock
                  size={12}
                  className={
                    selectedId === strategy.id
                      ? "text-stone-500"
                      : "text-stone-400"
                  }
                />
                <span
                  className={`text-[10px] ${
                    selectedId === strategy.id
                      ? "text-stone-500"
                      : "text-stone-400"
                  }`}
                >
                  {strategy.type === "paused" && strategy.pausedAt
                    ? `Paused ${new Date(strategy.pausedAt).toLocaleDateString()}`
                    : `Started ${new Date(strategy.startedAt).toLocaleDateString()}`}
                </span>
              </div>
              {strategy.type === "active" && (
                <PlayCircle
                  size={14}
                  className="text-emerald-500 animate-pulse"
                />
              )}
              {strategy.type === "paused" && (
                <PauseCircle size={14} className="text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
