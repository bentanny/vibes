"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { ChartMode } from "@/types";

const stockData = [
  { date: "Jan 1", aapl: 150.5 },
  { date: "Jan 2", aapl: 151.2 },
  { date: "Jan 3", aapl: 149.8 },
  { date: "Jan 4", aapl: 152.4, signal: "buy" },
  { date: "Jan 5", aapl: 153.1 },
  { date: "Jan 6", aapl: 154.2 },
  { date: "Jan 7", aapl: 156.3 },
  { date: "Jan 8", aapl: 157.8 },
  { date: "Jan 9", aapl: 159.2 },
  { date: "Jan 10", aapl: 158.5, signal: "sell" },
  { date: "Jan 11", aapl: 160.1 },
  { date: "Jan 12", aapl: 161.4 },
  { date: "Jan 13", aapl: 162.8 },
  { date: "Jan 14", aapl: 163.2, signal: "buy" },
  { date: "Jan 15", aapl: 162.5 },
  { date: "Jan 16", aapl: 164.3 },
  { date: "Jan 17", aapl: 165.8 },
  { date: "Jan 18", aapl: 167.2 },
  { date: "Jan 19", aapl: 166.9 },
  { date: "Jan 20", aapl: 168.5, signal: "sell" },
  { date: "Jan 21", aapl: 169.2 },
  { date: "Jan 22", aapl: 171.1 },
  { date: "Jan 23", aapl: 170.5 },
  { date: "Jan 24", aapl: 172.3, signal: "buy" },
  { date: "Jan 25", aapl: 173.8 },
  { date: "Jan 26", aapl: 175.2 },
  { date: "Jan 27", aapl: 174.8 },
  { date: "Jan 28", aapl: 176.4 },
  { date: "Jan 29", aapl: 177.9 },
  { date: "Jan 30", aapl: 179.5, signal: "sell" },
];

interface StockChartProps {
  mode?: ChartMode;
}

export function StockChart({ mode = "events" }: StockChartProps) {
  const aaplCurrentPrice = stockData[stockData.length - 1].aapl;
  const aaplPreviousPrice = stockData[0].aapl;
  const aaplPriceChange = aaplCurrentPrice - aaplPreviousPrice;
  const aaplPercentChange = (
    (aaplPriceChange / aaplPreviousPrice) *
    100
  ).toFixed(2);
  const aaplIsPositive = aaplPriceChange >= 0;

  const trades = stockData.filter((d) => d.signal).length;
  const buySignals = stockData.filter((d) => d.signal === "buy");
  const sellSignals = stockData.filter((d) => d.signal === "sell");

  let totalPnL = 0;
  for (let i = 0; i < Math.min(buySignals.length, sellSignals.length); i++) {
    totalPnL += sellSignals[i].aapl - buySignals[i].aapl;
  }

  return (
    <>
      <CardHeader className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4 w-full">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg md:text-2xl font-semibold">
                {mode === "strategy"
                  ? "AAPL · Momentum Strategy Backtest"
                  : mode === "event-correlation"
                    ? "AAPL · Event Correlation"
                    : mode === "asset-correlation"
                      ? "AAPL · Asset Correlation"
                      : mode === "3p-correlation"
                        ? "AAPL · 3P Correlation"
                        : "AAPL · Tim Cook Tweet Impact"}
              </h3>
              <p className="text-xs md:text-sm text-default-500 mt-1">
                Apple Inc. - NASDAQ · January 2025
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-4 md:gap-6">
            <div className="space-y-1">
              <div className="text-xs md:text-sm text-default-500">
                Current Price
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-4xl font-bold">
                  ${aaplCurrentPrice.toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs md:text-sm font-medium ${
                    aaplIsPositive ? "text-success" : "text-danger"
                  }`}
                >
                  {aaplIsPositive ? (
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  ) : (
                    <TrendingDown className="h-3 w-3 md:h-4 md:w-4" />
                  )}
                  <span>
                    {aaplIsPositive ? "+" : ""}
                    {aaplPriceChange.toFixed(2)} ({aaplIsPositive ? "+" : ""}
                    {aaplPercentChange}%)
                  </span>
                </span>
              </div>
            </div>
            {mode === "strategy" && (
              <>
                <div className="space-y-1">
                  <div className="text-xs md:text-sm text-default-500">
                    Total Trades
                  </div>
                  <div className="flex items-center gap-2 text-xl md:text-2xl font-bold">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <span>{trades}</span>
                  </div>
                  <div className="text-[10px] md:text-xs text-default-500">
                    Buy & Sell signals
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs md:text-sm text-default-500">
                    Strategy PnL
                  </div>
                  <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                    <span>+{totalPnL.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] md:text-xs text-primary font-medium">
                    +{((totalPnL / aaplPreviousPrice) * 100).toFixed(2)}% return
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-4 md:p-6 pt-0 overflow-y-auto flex flex-col">
        {/* Placeholder charts for correlation modes */}
        {mode === "event-correlation" ||
        mode === "asset-correlation" ||
        mode === "3p-correlation" ? (
          <>
            <div className="flex-1 min-h-[250px] md:hidden flex items-center justify-center">
              <div className="text-center text-default-400">
                <p className="text-sm font-medium mb-2">
                  {mode === "event-correlation"
                    ? "Event Correlation Chart"
                    : mode === "asset-correlation"
                      ? "Asset Correlation Chart"
                      : "3P Correlation Chart"}
                </p>
                <p className="text-xs">Placeholder - Coming soon</p>
              </div>
            </div>
            <div className="flex-1 min-h-[350px] hidden md:flex items-center justify-center">
              <div className="text-center text-default-400">
                <p className="text-base font-medium mb-2">
                  {mode === "event-correlation"
                    ? "Event Correlation Chart"
                    : mode === "asset-correlation"
                      ? "Asset Correlation Chart"
                      : "3P Correlation Chart"}
                </p>
                <p className="text-sm">Placeholder - Coming soon</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-h-[250px] md:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stockData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.24 0 0)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="oklch(0.65 0 0)"
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 8 }}
                    interval={4}
                  />
                  <YAxis
                    stroke="oklch(0.65 0 0)"
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                    domain={["dataMin - 5", "dataMax + 5"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.16 0 0)",
                      border: "1px solid oklch(0.24 0 0)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "oklch(0.65 0 0)" }}
                  />
                  {mode === "strategy" &&
                    stockData.map((dataPoint, idx) => {
                      if (
                        dataPoint.signal === "buy" &&
                        idx < stockData.length - 1
                      ) {
                        return (
                          <ReferenceArea
                            key={`buy-${idx}`}
                            x1={dataPoint.date}
                            x2={stockData[idx + 1]?.date || dataPoint.date}
                            fill="oklch(0.55 0.15 145)"
                            fillOpacity={0.2}
                            ifOverflow="extendDomain"
                          />
                        );
                      }
                      if (
                        dataPoint.signal === "sell" &&
                        idx < stockData.length - 1
                      ) {
                        return (
                          <ReferenceArea
                            key={`sell-${idx}`}
                            x1={dataPoint.date}
                            x2={stockData[idx + 1]?.date || dataPoint.date}
                            fill="oklch(0.55 0.20 25)"
                            fillOpacity={0.2}
                            ifOverflow="extendDomain"
                          />
                        );
                      }
                      return null;
                    })}
                  <Line
                    type="monotone"
                    dataKey="aapl"
                    name="AAPL"
                    stroke="oklch(0.55 0.15 145)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-h-[350px] hidden md:block">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stockData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.24 0 0)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="oklch(0.65 0 0)"
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis
                    stroke="oklch(0.65 0 0)"
                    tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
                    domain={["dataMin - 5", "dataMax + 5"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.16 0 0)",
                      border: "1px solid oklch(0.24 0 0)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                    }}
                    labelStyle={{ color: "oklch(0.65 0 0)" }}
                  />
                  {mode === "strategy" &&
                    stockData.map((dataPoint, idx) => {
                      if (
                        dataPoint.signal === "buy" &&
                        idx < stockData.length - 1
                      ) {
                        return (
                          <ReferenceArea
                            key={`buy-${idx}`}
                            x1={dataPoint.date}
                            x2={stockData[idx + 1]?.date || dataPoint.date}
                            fill="oklch(0.55 0.15 145)"
                            fillOpacity={0.2}
                            ifOverflow="extendDomain"
                          />
                        );
                      }
                      if (
                        dataPoint.signal === "sell" &&
                        idx < stockData.length - 1
                      ) {
                        return (
                          <ReferenceArea
                            key={`sell-${idx}`}
                            x1={dataPoint.date}
                            x2={stockData[idx + 1]?.date || dataPoint.date}
                            fill="oklch(0.55 0.20 25)"
                            fillOpacity={0.2}
                            ifOverflow="extendDomain"
                          />
                        );
                      }
                      return null;
                    })}
                  <Line
                    type="monotone"
                    dataKey="aapl"
                    name="AAPL"
                    stroke="oklch(0.55 0.15 145)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {mode === "strategy" ? (
          <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
            <div className="space-y-2 md:space-y-3 border-t border-default-200 dark:border-default-100 pt-3 md:pt-4">
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-default-500">
                Trade Signals
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="rounded-lg bg-primary/10 p-3 md:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-primary" />
                    <p className="text-xs md:text-sm font-semibold">
                      Buy Signals
                    </p>
                  </div>
                  <div className="space-y-1">
                    {buySignals.map((signal, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] md:text-xs text-default-500"
                      >
                        {signal.date} · ${signal.aapl.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-danger/10 p-3 md:p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-danger" />
                    <p className="text-xs md:text-sm font-semibold">
                      Sell Signals
                    </p>
                  </div>
                  <div className="space-y-1">
                    {sellSignals.map((signal, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] md:text-xs text-default-500"
                      >
                        {signal.date} · ${signal.aapl.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4 border-t border-default-200 dark:border-default-100 pt-3 md:pt-4">
              <div>
                <p className="text-[10px] md:text-xs text-default-500">Open</p>
                <p className="text-xs md:text-sm font-semibold">
                  ${stockData[0].aapl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-default-500">High</p>
                <p className="text-xs md:text-sm font-semibold">
                  ${Math.max(...stockData.map((d) => d.aapl)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-default-500">Low</p>
                <p className="text-xs md:text-sm font-semibold">
                  ${Math.min(...stockData.map((d) => d.aapl)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
            <div className="grid grid-cols-3 gap-3 md:gap-4 border-t border-default-200 dark:border-default-100 pt-3 md:pt-4">
              <div>
                <p className="text-[10px] md:text-xs text-default-500">Open</p>
                <p className="text-xs md:text-sm font-semibold">
                  ${stockData[0].aapl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-default-500">High</p>
                <p className="text-xs md:text-sm font-semibold">
                  ${Math.max(...stockData.map((d) => d.aapl)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-default-500">Low</p>
                <p className="text-xs md:text-sm font-semibold">
                  ${Math.min(...stockData.map((d) => d.aapl)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </>
  );
}
