"use client";

import React from "react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart2,
  AlertTriangle,
  Play,
  Pause,
  StopCircle,
  Settings,
  ArrowRight,
  Clock,
  Eye,
  Pencil,
} from "lucide-react";
import type { StrategyItem } from "./strategy-list-view";
import { RollingText } from "@/components/ui/shadcn-io/rolling-text";
import { ExpandableButton } from "@/components/ui/expandable-button";

interface StrategyDetailsViewProps {
  strategy: StrategyItem | null;
  onTypeChange?: (
    strategyId: string,
    newType: "active" | "paused" | "completed",
  ) => void;
  isLoading?: boolean;
}

export function StrategyDetailsView({
  strategy,
  onTypeChange,
  isLoading = false,
}: StrategyDetailsViewProps) {
  if (!strategy) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f3f1ed] border-none shadow-none h-full text-center">
        <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center mb-4">
          <Activity size={32} className="text-stone-400" />
        </div>
        <h3 className="text-xl font-serif text-stone-600 mb-2">
          No Strategy Selected
        </h3>
        <p className="text-stone-400 text-sm max-w-xs">
          Select a strategy from the list to view its performance details and
          manage settings.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden relative group bg-[#f3f1ed] shadow-lg shadow-stone-300/50 h-full">
      {/* Decorative Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-stone-200 via-amber-400 to-stone-200" />

      {/* Scrollable Content */}
      <div className="p-8 pl-24 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Chip
                variant="flat"
                size="sm"
                radius="sm"
                className="border border-stone-200 bg-white/50"
              >
                <span className="text-[10px] uppercase tracking-widest text-stone-500">
                  Strategy Details
                </span>
              </Chip>
              <Chip
                variant="flat"
                size="sm"
                radius="sm"
                className={`${
                  strategy.type === "active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-amber-100 text-amber-700 border-amber-200"
                } border`}
              >
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  {strategy.type}
                </span>
              </Chip>
            </div>

            <h1 className="text-5xl font-serif text-stone-900 leading-none tracking-tight flex items-center gap-2 mb-2">
              {strategy.ticker}
            </h1>
            <span className="text-lg text-stone-500 italic block">
              {strategy.name}
            </span>

            {/* Next Trade / Last Trade Date Section */}
            {strategy.type === "paused" && strategy.lastTrade ? (
              <div className="flex items-center gap-2 mt-4 text-sm text-stone-500 bg-white/50 px-3 py-1.5 rounded-full w-fit border border-stone-100">
                <Clock size={14} className="text-stone-400" />
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                  Last Trade:
                </span>
                <span className="font-medium text-stone-700">
                  {new Date(strategy.lastTrade).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ) : strategy.nextTradeDate ? (
              <div className="flex items-center gap-2 mt-4 text-sm text-stone-500 bg-white/50 px-3 py-1.5 rounded-full w-fit border border-stone-100">
                <Clock size={14} className="text-stone-400" />
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                  Next Trade:
                </span>
                <span className="font-medium text-stone-700">
                  {new Date(strategy.nextTradeDate).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <ExpandableButton
              label="Edit Strategy"
              icon={Pencil}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* P&L Card */}
          <div className="bg-white p-6 rounded-xl border border-stone-200/60 shadow-sm relative overflow-hidden group/pnl hover:border-stone-300 transition-all cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/pnl:opacity-20 transition-opacity">
              <DollarSign size={48} />
            </div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              Total P&L
            </p>
            <div className="h-10 relative">
              {/* Default View (Total P&L) - Visible by default, hidden on hover */}
              <div className="absolute inset-0 transition-all duration-300 opacity-100 translate-y-0 group-hover/pnl:opacity-0 group-hover/pnl:-translate-y-2 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-mono font-bold ${strategy.pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {strategy.pnl >= 0 ? "+" : ""}
                  {strategy.pnl.toLocaleString()}
                </span>
                <span
                  className={`text-sm font-bold ${strategy.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  ({strategy.pnlPercent}%)
                </span>
              </div>

              {/* Hover View (Realized | Unrealized) - Hidden by default, visible on hover */}
              <div className="absolute inset-0 transition-all duration-300 opacity-0 translate-y-2 group-hover/pnl:opacity-100 group-hover/pnl:translate-y-0 flex items-center w-full justify-start gap-8">
                <div>
                  <div className="text-stone-400 text-[10px] uppercase tracking-wider mb-0.5">
                    Realized
                  </div>
                  <div
                    className={`font-mono font-bold text-lg ${
                      (strategy.realizedPnl || 0) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {(strategy.realizedPnl || 0) >= 0 ? "+" : ""}
                    {(strategy.realizedPnl || 0).toLocaleString()}
                  </div>
                </div>
                <div className="h-8 w-px bg-stone-200" />
                <div>
                  <div className="text-stone-400 text-[10px] uppercase tracking-wider mb-0.5">
                    Unrealized
                  </div>
                  <div
                    className={`font-mono font-bold text-lg ${
                      (strategy.unrealizedPnl || 0) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {(strategy.unrealizedPnl || 0) >= 0 ? "+" : ""}
                    {(strategy.unrealizedPnl || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Card */}
          <div className="bg-white p-6 rounded-xl border border-stone-200/60 shadow-sm relative overflow-hidden group hover:border-stone-300 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart2 size={48} />
            </div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              ROI
            </p>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className={`text-3xl font-mono font-bold ${
                  (strategy.roi || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {(strategy.roi || 0) >= 0 ? "+" : ""}
                {strategy.roi || 0}%
              </span>
              <span className="text-xs text-stone-400 flex items-baseline gap-1">
                <span>vs {strategy.ticker}:</span>
                <span
                  className={`${
                    (strategy.assetRoi || 0) >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {(strategy.assetRoi || 0) >= 0 ? "+" : ""}
                  {strategy.assetRoi || 0}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="w-full h-64 bg-stone-900 rounded-xl mb-8 relative overflow-hidden flex items-center justify-center shadow-inner">
          <svg
            className="w-full h-full absolute inset-0 text-amber-500/20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 Q100,100 200,150 T400,100 T600,180 T800,50 L800,300 L0,300 Z"
              fill="currentColor"
            />
            <path
              d="M0,200 Q100,100 200,150 T400,100 T600,180 T800,50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-amber-500"
            />
          </svg>
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="border-r border-t border-white/5" />
            ))}
          </div>
          <div className="z-10 bg-stone-800/80 backdrop-blur px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs text-stone-300 font-mono">
              Performance Chart Coming Soon
            </span>
          </div>
        </div>

        {/* Trades Table */}
        <div className="mb-8">
          <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-4">
            Recent Trades
          </h4>
          <Table
            aria-label="Recent trades"
            removeWrapper
            classNames={{
              th: "bg-transparent text-stone-500 text-xs uppercase tracking-wider font-medium border-b border-stone-200",
              td: "py-3 text-stone-700 font-mono text-sm border-b border-stone-100",
            }}
          >
            <TableHeader>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>QUANTITY</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No trades recorded yet.">
              {(strategy.trades || []).map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={`uppercase text-[10px] font-bold h-6 ${
                        trade.type === "buy"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {trade.type}
                    </Chip>
                  </TableCell>
                  <TableCell>${trade.price.toLocaleString()}</TableCell>
                  <TableCell>
                    {new Date(trade.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{trade.quantity || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="flat"
                      className="text-stone-400 hover:text-stone-900 h-8"
                    >
                      See Trade Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Fixed Actions Footer */}
      <div className="p-6 pl-24 border-t border-stone-200 bg-[#f3f1ed] z-10 mt-auto">
        <div className="flex gap-4">
          <Button
            className={`flex-1 ${strategy.type === "active" ? "bg-amber-100 text-amber-900 hover:bg-amber-200" : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"}`}
            radius="lg"
            startContent={
              strategy.type === "active" ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )
            }
            isLoading={isLoading}
            isDisabled={isLoading}
            onPress={() => {
              if (onTypeChange && !isLoading) {
                const newType =
                  strategy.type === "active" ? "paused" : "active";
                onTypeChange(strategy.id, newType);
              }
            }}
          >
            {strategy.type === "active" ? "Pause Strategy" : "Resume Strategy"}
          </Button>
          <Button
            className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            variant="bordered"
            radius="lg"
            startContent={<StopCircle size={16} />}
          >
            Stop & Close Positions
          </Button>
        </div>
      </div>
    </Card>
  );
}
