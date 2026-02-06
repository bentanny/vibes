"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Tabs,
  Tab,
  Pagination,
  Select,
  SelectItem,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Scatter,
  Legend,
  Customized,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import {
  BacktestResponse,
  EquityPoint,
  Trade,
  PerformanceStatistics,
  OHLCVBar,
  formatCurrency,
  formatPercent,
  formatDate,
} from "@/lib/vibe-api";
import { expandIndicators } from "@/lib/compact-format";

interface BacktestVisualizationProps {
  result: BacktestResponse;
  initialCash?: number;
}

export function BacktestVisualization({
  result,
  initialCash = 100000,
}: BacktestVisualizationProps) {
  const isSuccess = result.status === "completed";
  const isFailed = result.status === "failed";
  const isPending = result.status === "pending" || result.status === "running";

  // Process equity curve data for the chart
  const equityData = useMemo(() => {
    if (!result.results?.equity_curve) return [];
    return result.results.equity_curve.map((point) => ({
      time: new Date(point.time).getTime(),
      timeStr: formatShortDate(point.time),
      equity: point.equity,
      cash: point.cash,
      holdings: point.holdings_value,
      drawdown: point.drawdown * 100, // Convert to percentage
      return: ((point.equity - initialCash) / initialCash) * 100,
    }));
  }, [result.results?.equity_curve, initialCash]);

  // Process trades for scatter plot overlay
  const tradeMarkers = useMemo(() => {
    if (!result.results?.trades || !equityData.length) return { entries: [], exits: [] };

    const entries: { time: number; equity: number; price: number }[] = [];
    const exits: { time: number; equity: number; price: number; pnl: number }[] = [];

    result.results.trades.forEach((trade) => {
      const entryTime = new Date(trade.entry_time).getTime();
      const entryPoint = findClosestEquityPoint(equityData, entryTime);
      if (entryPoint) {
        entries.push({
          time: entryTime,
          equity: entryPoint.equity,
          price: trade.entry_price,
        });
      }

      if (trade.exit_time) {
        const exitTime = new Date(trade.exit_time).getTime();
        const exitPoint = findClosestEquityPoint(equityData, exitTime);
        if (exitPoint) {
          exits.push({
            time: exitTime,
            equity: exitPoint.equity,
            price: trade.exit_price || 0,
            pnl: trade.pnl || 0,
          });
        }
      }
    });

    return { entries, exits };
  }, [result.results?.trades, equityData]);

  if (isPending) {
    return (
      <Card className="border-warning-200">
        <CardBody className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 text-warning animate-pulse" />
          <p className="ml-4 text-default-500">
            {result.message || "Backtest is running..."}
          </p>
        </CardBody>
      </Card>
    );
  }

  if (isFailed) {
    return (
      <Card className="border-danger-200">
        <CardBody className="bg-danger-50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-danger" />
            <div>
              <p className="font-semibold text-danger">Backtest Failed</p>
              <p className="text-sm text-danger-600">{result.error}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!isSuccess || !result.results) {
    return null;
  }

  const { statistics, trades } = result.results;

  return (
    <div className="space-y-6">
      {/* Warning banner if there's a message (e.g., persistence errors) */}
      {result.message && (
        <Card className="border-warning-200 bg-warning-50">
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0" />
              <p className="text-sm text-warning-700">{result.message}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Header with status */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold">Backtest Results</h2>
          </div>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat">
              {result.symbol}
            </Chip>
            <Chip size="sm" variant="bordered">
              {formatDate(result.start_date)} - {formatDate(result.end_date)}
            </Chip>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      {statistics && <PerformanceMetrics stats={statistics} initialCash={initialCash} />}

      {/* Advanced Statistics */}
      {statistics && <AdvancedStatistics stats={statistics} />}

      {/* Charts */}
      <Card>
        <CardBody className="p-0">
          <Tabs aria-label="Backtest charts" classNames={{ tabList: "px-4 pt-4" }}>
            <Tab
              key="equity"
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Equity Curve</span>
                </div>
              }
            >
              <div className="p-4">
                <EquityCurveChart
                  data={equityData}
                  entries={tradeMarkers.entries}
                  exits={tradeMarkers.exits}
                  initialCash={initialCash}
                />
              </div>
            </Tab>
            <Tab
              key="drawdown"
              title={
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Drawdown</span>
                </div>
              }
            >
              <div className="p-4">
                <DrawdownChart
                  data={equityData}
                  entries={tradeMarkers.entries}
                  exits={tradeMarkers.exits}
                />
              </div>
            </Tab>
            <Tab
              key="returns"
              title={
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Returns</span>
                </div>
              }
            >
              <div className="p-4">
                <ReturnsChart
                  data={equityData}
                  entries={tradeMarkers.entries}
                  exits={tradeMarkers.exits}
                />
              </div>
            </Tab>
            <Tab
              key="price"
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Price Chart</span>
                </div>
              }
            >
              <div className="p-4">
                <PriceChart
                  ohlcvBars={result.results.ohlcv_bars}
                  indicators={expandIndicators(result.results.indicators, result.results.ohlcv_bars)}
                  trades={result.results.trades}
                />
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Trades Table */}
      {trades && trades.length > 0 && <TradesTable trades={trades} />}
    </div>
  );
}

function PerformanceMetrics({
  stats,
  initialCash,
}: {
  stats: PerformanceStatistics;
  initialCash: number;
}) {
  const metrics = [
    {
      label: "Total Return",
      value: formatPercent(stats.total_return),
      positive: stats.total_return > 0,
      icon: stats.total_return >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: "Net Profit",
      value: formatCurrency(stats.net_profit),
      positive: stats.net_profit > 0,
    },
    {
      label: "Sharpe Ratio",
      value: stats.sharpe_ratio?.toFixed(2) || "N/A",
      positive: (stats.sharpe_ratio || 0) > 1,
    },
    {
      label: "Max Drawdown",
      value: formatPercent(stats.max_drawdown),
      positive: false,
    },
    {
      label: "Win Rate",
      value: formatPercent(stats.win_rate),
      positive: stats.win_rate > 0.5,
    },
    {
      label: "Profit Factor",
      value: stats.profit_factor?.toFixed(2) || "N/A",
      positive: (stats.profit_factor || 0) > 1,
    },
    {
      label: "Total Trades",
      value: stats.total_trades.toString(),
    },
    {
      label: "Avg Win / Loss",
      value: `${formatCurrency(stats.average_win)} / ${formatCurrency(Math.abs(stats.average_loss))}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-default-50">
          <CardBody className="py-3 px-4">
            <p className="text-xs text-default-500 uppercase tracking-wide">
              {metric.label}
            </p>
            <p
              className={`text-lg font-bold mt-1 ${
                metric.positive === true
                  ? "text-success"
                  : metric.positive === false
                    ? "text-danger"
                    : ""
              }`}
            >
              {metric.value}
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function AdvancedStatistics({ stats }: { stats: PerformanceStatistics }) {
  const metrics = [
    stats.sortino_ratio,
    stats.information_ratio,
    stats.treynor_ratio,
    stats.compounding_annual_return,
    stats.annual_standard_deviation,
    stats.value_at_risk_95,
    stats.alpha,
    stats.beta,
    stats.expectancy,
    stats.profit_loss_ratio,
    stats.loss_rate,
  ];

  const hasAdvancedStats = metrics.some((value) => value !== undefined && value !== null);
  if (!hasAdvancedStats) return null;

  const renderValue = (
    value: number | undefined,
    formatter: (val: number) => string = (val) => val.toFixed(2)
  ) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "N/A";
    return formatter(value);
  };

  const valueClass = (value: number | undefined, tone: "neutral" | "signed" = "signed") => {
    if (value === undefined || value === null || Number.isNaN(value)) return "text-default-400";
    if (tone === "neutral") return "text-default-600";
    return value >= 0 ? "text-success" : "text-danger";
  };

  const groups = [
    {
      key: "risk-adjusted",
      title: "Risk-Adjusted Returns",
      grid: "grid grid-cols-1 md:grid-cols-3 gap-4",
      items: [
        {
          label: "Sortino",
          value: renderValue(stats.sortino_ratio),
          className: valueClass(stats.sortino_ratio),
          description: "Downside risk-adjusted return using negative volatility.",
        },
        {
          label: "Information Ratio",
          value: renderValue(stats.information_ratio),
          className: valueClass(stats.information_ratio),
          description: "Active return versus tracking error to the benchmark.",
        },
        {
          label: "Treynor",
          value: renderValue(stats.treynor_ratio),
          className: valueClass(stats.treynor_ratio),
          description: "Return per unit of market risk (beta).",
        },
      ],
    },
    {
      key: "performance-risk",
      title: "Performance & Risk",
      grid: "grid grid-cols-1 md:grid-cols-3 gap-4",
      items: [
        {
          label: "CAGR",
          value: renderValue(stats.compounding_annual_return, (val) =>
            formatPercent(val / 100)
          ),
          className: valueClass(stats.compounding_annual_return),
          description: "Compounded annual growth rate of equity.",
        },
        {
          label: "Annual Volatility",
          value: renderValue(stats.annual_standard_deviation, formatPercent),
          className: valueClass(stats.annual_standard_deviation),
          description: "Annualized standard deviation of returns.",
        },
        {
          label: "VaR 95%",
          value: renderValue(stats.value_at_risk_95, formatPercent),
          className: valueClass(stats.value_at_risk_95),
          description: "Estimated 95% value at risk.",
        },
      ],
    },
    {
      key: "market-correlation",
      title: "Market Correlation",
      grid: "grid grid-cols-1 md:grid-cols-2 gap-4",
      items: [
        {
          label: "Alpha",
          value: renderValue(stats.alpha),
          className: valueClass(stats.alpha),
          description: "Excess return relative to the benchmark.",
        },
        {
          label: "Beta",
          value: renderValue(stats.beta),
          className: valueClass(stats.beta, "neutral"),
          description: "Sensitivity of returns to market moves.",
        },
      ],
    },
    {
      key: "trade-quality",
      title: "Trade Quality",
      grid: "grid grid-cols-1 md:grid-cols-3 gap-4",
      items: [
        {
          label: "Expectancy",
          value: renderValue(stats.expectancy),
          className: valueClass(stats.expectancy),
          description: "Average expected return per trade.",
        },
        {
          label: "P/L Ratio",
          value: renderValue(stats.profit_loss_ratio),
          className: valueClass(stats.profit_loss_ratio),
          description: "Average win size divided by average loss size.",
        },
        {
          label: "Loss Rate",
          value: renderValue(stats.loss_rate, formatPercent),
          className: valueClass(stats.loss_rate),
          description: "Percentage of trades that ended in a loss.",
        },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-default-500" />
        <div>
          <h3 className="text-sm font-semibold">Advanced Statistics</h3>
          <p className="text-xs text-default-500">Additional LEAN portfolio metrics</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-0">
        <Accordion>
          {groups.map((group) => (
            <AccordionItem key={group.key} aria-label={group.title} title={group.title}>
              <div className={`${group.grid} pb-2`}>
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-default-200 bg-default-50 p-3"
                  >
                    <p className="text-xs text-default-500 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${item.className}`}>
                      {item.value}
                    </p>
                    <p className="text-xs text-default-500 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </CardBody>
    </Card>
  );
}

function EquityCurveChart({
  data,
  entries,
  exits,
  initialCash,
}: {
  data: ReturnType<typeof useMemo>;
  entries: { time: number; equity: number }[];
  exits: { time: number; equity: number; pnl: number }[];
  initialCash: number;
}) {
  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center text-default-500">
        No equity data available
      </div>
    );
  }

  // Combine data for the chart
  const chartData = data.map((point: { time: number; timeStr: string; equity: number }) => {
    const entry = entries.find((e) => Math.abs(e.time - point.time) < 3600000);
    const exit = exits.find((e) => Math.abs(e.time - point.time) < 3600000);
    return {
      ...point,
      entry: entry ? point.equity : null,
      exit: exit ? point.equity : null,
      exitPnl: exit?.pnl,
    };
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="timeStr"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="text-xs text-default-500">{data.timeStr}</p>
                  <p className="font-semibold">{formatCurrency(data.equity)}</p>
                  <p
                    className={`text-sm ${data.return >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {data.return >= 0 ? "+" : ""}
                    {data.return.toFixed(2)}%
                  </p>
                  {data.entry && (
                    <p className="text-xs text-success mt-1">
                      <ArrowUpCircle className="w-3 h-3 inline mr-1" />
                      Entry
                    </p>
                  )}
                  {data.exit && (
                    <p className={`text-xs mt-1 ${data.exitPnl >= 0 ? "text-success" : "text-danger"}`}>
                      <ArrowDownCircle className="w-3 h-3 inline mr-1" />
                      Exit ({data.exitPnl >= 0 ? "+" : ""}
                      {formatCurrency(data.exitPnl)})
                    </p>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine
            y={initialCash}
            stroke="#888"
            strokeDasharray="5 5"
            label={{ value: "Initial", position: "right", fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="hsl(var(--heroui-primary))"
            fill="hsl(var(--heroui-primary))"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Scatter
            dataKey="entry"
            fill="hsl(var(--heroui-success))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--heroui-success))" />;
            }}
          />
          <Scatter
            dataKey="exit"
            fill="hsl(var(--heroui-danger))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--heroui-danger))" />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-xs text-default-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-success" /> Entry
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-danger" /> Exit
        </span>
      </div>
    </div>
  );
}

function DrawdownChart({
  data,
  entries,
  exits,
}: {
  data: { time: number; timeStr: string; drawdown: number }[];
  entries: { time: number; equity: number }[];
  exits: { time: number; equity: number; pnl: number }[];
}) {
  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center text-default-500">
        No drawdown data available
      </div>
    );
  }

  const maxDrawdown = Math.min(...data.map((d) => -Math.abs(d.drawdown)));

  // Combine data with trade markers
  const chartData = data.map((point) => {
    const entry = entries.find((e) => Math.abs(e.time - point.time) < 3600000);
    const exit = exits.find((e) => Math.abs(e.time - point.time) < 3600000);
    const drawdownValue = -Math.abs(point.drawdown);
    return {
      ...point,
      drawdownValue,
      entry: entry ? drawdownValue : null,
      exit: exit ? drawdownValue : null,
      exitPnl: exit?.pnl,
    };
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="timeStr"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            domain={[maxDrawdown * 1.1, 0]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="text-xs text-default-500">{data.timeStr}</p>
                  <p className="font-semibold text-danger">
                    {(-Math.abs(data.drawdown)).toFixed(2)}%
                  </p>
                  {data.entry && (
                    <p className="text-xs text-success mt-1">
                      <ArrowUpCircle className="w-3 h-3 inline mr-1" />
                      Entry
                    </p>
                  )}
                  {data.exit && (
                    <p className={`text-xs mt-1 ${data.exitPnl >= 0 ? "text-success" : "text-danger"}`}>
                      <ArrowDownCircle className="w-3 h-3 inline mr-1" />
                      Exit ({data.exitPnl >= 0 ? "+" : ""}
                      {formatCurrency(data.exitPnl)})
                    </p>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#888" />
          <Area
            type="monotone"
            dataKey="drawdownValue"
            stroke="hsl(var(--heroui-danger))"
            fill="hsl(var(--heroui-danger))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Scatter
            dataKey="entry"
            fill="hsl(var(--heroui-success))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--heroui-success))" />;
            }}
          />
          <Scatter
            dataKey="exit"
            fill="hsl(var(--heroui-danger))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--heroui-danger))" stroke="white" strokeWidth={1} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-xs text-default-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-success" /> Entry
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-danger" /> Exit
        </span>
      </div>
    </div>
  );
}

function ReturnsChart({
  data,
  entries,
  exits,
}: {
  data: { time: number; timeStr: string; return: number }[];
  entries: { time: number; equity: number }[];
  exits: { time: number; equity: number; pnl: number }[];
}) {
  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center text-default-500">
        No returns data available
      </div>
    );
  }

  // Combine data with trade markers
  const chartData = data.map((point) => {
    const entry = entries.find((e) => Math.abs(e.time - point.time) < 3600000);
    const exit = exits.find((e) => Math.abs(e.time - point.time) < 3600000);
    return {
      ...point,
      entry: entry ? point.return : null,
      exit: exit ? point.return : null,
      exitPnl: exit?.pnl,
    };
  });

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="timeStr"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="text-xs text-default-500">{data.timeStr}</p>
                  <p
                    className={`font-semibold ${data.return >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {data.return >= 0 ? "+" : ""}
                    {data.return.toFixed(2)}%
                  </p>
                  {data.entry && (
                    <p className="text-xs text-success mt-1">
                      <ArrowUpCircle className="w-3 h-3 inline mr-1" />
                      Entry
                    </p>
                  )}
                  {data.exit && (
                    <p className={`text-xs mt-1 ${data.exitPnl >= 0 ? "text-success" : "text-danger"}`}>
                      <ArrowDownCircle className="w-3 h-3 inline mr-1" />
                      Exit ({data.exitPnl >= 0 ? "+" : ""}
                      {formatCurrency(data.exitPnl)})
                    </p>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#888" strokeDasharray="5 5" />
          <Line
            type="monotone"
            dataKey="return"
            stroke="hsl(var(--heroui-primary))"
            strokeWidth={2}
            dot={false}
          />
          <Scatter
            dataKey="entry"
            fill="hsl(var(--heroui-success))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--heroui-success))" />;
            }}
          />
          <Scatter
            dataKey="exit"
            fill="hsl(var(--heroui-danger))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--heroui-danger))" />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-xs text-default-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-success" /> Entry
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-danger" /> Exit
        </span>
      </div>
    </div>
  );
}

/**
 * Downsample OHLCV bars to a target count by aggregating multiple bars.
 * Preserves OHLCV semantics: open from first bar, high/low from all bars, close from last bar.
 */
function downsampleOHLCV(bars: OHLCVBar[], targetCount: number = 500): OHLCVBar[] {
  if (bars.length <= targetCount) return bars;

  const step = Math.ceil(bars.length / targetCount);
  const downsampled: OHLCVBar[] = [];

  for (let i = 0; i < bars.length; i += step) {
    const chunk = bars.slice(i, Math.min(i + step, bars.length));
    if (chunk.length === 0) continue;

    downsampled.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map((b) => b.high)),
      low: Math.min(...chunk.map((b) => b.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, b) => sum + b.volume, 0),
    });
  }

  return downsampled;
}

function PriceChart({
  ohlcvBars,
  indicators,
  trades,
}: {
  ohlcvBars?: OHLCVBar[];
  indicators?: Record<string, Array<Record<string, any>>>;
  trades?: Trade[];
}) {

  const downsampledBars = useMemo(() => {
    if (!ohlcvBars) return undefined;
    return downsampleOHLCV(ohlcvBars, 100);
  }, [ohlcvBars]);

  const { chartData, indicatorLabels } = useMemo(() => {
    if (!downsampledBars?.length) {
      console.log('No OHLCV bars - returning empty');
      return { chartData: [], indicatorLabels: {} as Record<string, string> };
    }

    const indicatorByTime = new Map<number, Record<string, number>>();
    const labels: Record<string, string> = {};

    if (indicators) {
      for (const [name, series] of Object.entries(indicators)) {
        if (!Array.isArray(series)) continue;
        for (const point of series) {
          if (!point || typeof point !== "object") continue;
          const timeValue = typeof point.time === "string" ? point.time : null;
          if (!timeValue) continue;
          const timeMs = new Date(timeValue).getTime();
          if (Number.isNaN(timeMs)) continue;

          const existing = indicatorByTime.get(timeMs) || {};
          for (const [key, value] of Object.entries(point)) {
            if (key === "time" || typeof value !== "number") continue;
            const normalizedName = normalizeIndicatorKey(name);
            const normalizedKey = normalizeIndicatorKey(key);
            const outKey = name === "BB" ? `bb_${normalizedKey}` : `${normalizedName}_${normalizedKey}`;
            existing[outKey] = value;
            labels[outKey] = name === "BB" ? `BB ${capitalizeWord(key)}` : `${name} ${key}`;
          }
          indicatorByTime.set(timeMs, existing);
        }
      }
    }

    // Build arrays of trade times for entry/exit
    const entryTrades: { time: number; price: number }[] = [];
    const exitTrades: { time: number; price: number; pnl: number }[] = [];

    if (trades) {
      trades.forEach((trade) => {
        const entryTime = new Date(trade.entry_time).getTime();
        entryTrades.push({ time: entryTime, price: trade.entry_price });

        if (trade.exit_time && trade.exit_price) {
          const exitTime = new Date(trade.exit_time).getTime();
          exitTrades.push({ time: exitTime, price: trade.exit_price, pnl: trade.pnl || 0 });
        }
      });
    }

    // Get all bar timestamps for finding closest matches
    const barTimes = downsampledBars.map((bar) => new Date(bar.time).getTime());

    // Find closest bar index for a given timestamp
    const findClosestBarIndex = (targetTime: number): number => {
      let closestIdx = 0;
      let closestDiff = Math.abs(barTimes[0] - targetTime);
      for (let i = 1; i < barTimes.length; i++) {
        const diff = Math.abs(barTimes[i] - targetTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIdx = i;
        }
      }
      return closestIdx;
    };

    // Map bar indices to trade data
    const entryByIndex = new Map<number, number>();
    const exitByIndex = new Map<number, { price: number; pnl: number }>();

    entryTrades.forEach(({ time, price }) => {
      const idx = findClosestBarIndex(time);
      entryByIndex.set(idx, price);
    });

    exitTrades.forEach(({ time, price, pnl }) => {
      const idx = findClosestBarIndex(time);
      exitByIndex.set(idx, { price, pnl });
    });

    const data = downsampledBars.map((bar, idx) => {
      const timeMs = new Date(bar.time).getTime();
      const entryPrice = entryByIndex.get(idx);
      const exitData = exitByIndex.get(idx);

      return {
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        time: timeMs,
        timeStr: formatShortDate(bar.time),
        // Use close price for dot positioning (on the line), store actual prices for tooltip
        entry: entryPrice !== undefined ? bar.close : undefined,
        entryPrice,
        exit: exitData ? bar.close : undefined,
        exitPrice: exitData?.price,
        exitPnl: exitData?.pnl,
        ...(indicatorByTime.get(timeMs) || {}),
      };
    });

    return { chartData: data, indicatorLabels: labels };
  }, [downsampledBars, indicators, trades]);

  if (!downsampledBars?.length) {
    return (
      <div className="h-80 flex items-center justify-center text-default-500">
        No price data available
      </div>
    );
  }

  const hasBollinger =
    "bb_upper" in indicatorLabels ||
    "bb_middle" in indicatorLabels ||
    "bb_lower" in indicatorLabels;

  return (
    <div>
      <ResponsiveContainer width="100%" aspect={2.5} minHeight={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatShortDateFromMs(value)}
            domain={["auto", "auto"]}
          />
          <YAxis
            yAxisId="price"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCompactCurrency(value)}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              const indicatorEntries = Object.entries(indicatorLabels).filter(
                ([key]) => typeof data[key] === "number"
              );

              return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
                  <p className="text-xs text-default-500">{data.timeStr}</p>
                  <div className="mt-1 space-y-0.5 text-sm">
                    <p>
                      Open: <span className="font-semibold">{formatCurrency(data.open)}</span>
                    </p>
                    <p>
                      High: <span className="font-semibold">{formatCurrency(data.high)}</span>
                    </p>
                    <p>
                      Low: <span className="font-semibold">{formatCurrency(data.low)}</span>
                    </p>
                    <p>
                      Close: <span className="font-semibold">{formatCurrency(data.close)}</span>
                    </p>
                    <p>
                      Volume:{" "}
                      <span className="font-semibold">{formatCompactNumber(data.volume)}</span>
                    </p>
                  </div>
                  {data.entryPrice && (
                    <p className="text-xs text-success mt-1">
                      Entry @ {formatCurrency(data.entryPrice)}
                    </p>
                  )}
                  {data.exitPrice && (
                    <p className={`text-xs mt-1 ${data.exitPnl >= 0 ? "text-success" : "text-danger"}`}>
                      Exit @ {formatCurrency(data.exitPrice)} ({data.exitPnl >= 0 ? "+" : ""}{formatCurrency(data.exitPnl)})
                    </p>
                  )}
                  {indicatorEntries.length > 0 && (
                    <div className="mt-2 border-t pt-2 space-y-0.5 text-xs text-default-600">
                      {indicatorEntries.map(([key, label]) => (
                        <p key={key}>
                          {label}:{" "}
                          <span className="font-semibold">
                            {formatCurrency(data[key])}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
          {/* Volume bars */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="hsl(var(--heroui-default-300))"
            opacity={0.3}
          />
          {/* Price line */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="hsl(var(--heroui-primary))"
            strokeWidth={2}
            dot={false}
          />
          {/* Trade entry markers */}
          <Scatter
            yAxisId="price"
            dataKey="entry"
            fill="hsl(var(--heroui-success))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={5}
                  fill="hsl(var(--heroui-success))"
                  stroke="white"
                  strokeWidth={2}
                />
              );
            }}
          />
          {/* Trade exit markers */}
          <Scatter
            yAxisId="price"
            dataKey="exit"
            fill="hsl(var(--heroui-danger))"
            shape={(props: { cx: number; cy: number }) => {
              if (props.cy == null) return null;
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={5}
                  fill="hsl(var(--heroui-danger))"
                  stroke="white"
                  strokeWidth={2}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {trades && trades.length > 0 && (
        <div className="flex justify-center gap-6 mt-2 text-xs text-default-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-success border-2 border-white" /> Entry
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-danger border-2 border-white" /> Exit
          </span>
        </div>
      )}
    </div>
  );
}

function CandlestickSeries({
  xAxisMap,
  yAxisMap,
  data,
}: {
  xAxisMap?: Record<string, any>;
  yAxisMap?: Record<string, any>;
  data?: Array<Record<string, any>>;
}) {
  if (!data?.length || !xAxisMap || !yAxisMap) return null;

  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = yAxisMap.price || Object.values(yAxisMap)[0];
  if (!xAxis?.scale || !yAxis?.scale) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  const xValues = data
    .map((entry) => xScale(entry.time))
    .filter((value: number | null | undefined) => typeof value === "number") as number[];

  let candleWidth = 8;
  if (xValues.length > 1) {
    const diffs = xValues.slice(1).map((value, index) => Math.abs(value - xValues[index]));
    const minDiff = Math.min(...diffs);
    candleWidth = Math.max(2, Math.min(16, minDiff * 0.6));
  }

  return (
    <g>
      {data.map((entry, index) => {
        const x = xScale(entry.time);
        if (typeof x !== "number" || Number.isNaN(x)) return null;

        const open = entry.open;
        const close = entry.close;
        const high = entry.high;
        const low = entry.low;
        if (
          [open, close, high, low].some(
            (value) => typeof value !== "number" || Number.isNaN(value)
          )
        ) {
          return null;
        }

        const isBullish = close >= open;
        const color = isBullish
          ? "hsl(var(--heroui-success))"
          : "hsl(var(--heroui-danger))";
        const highY = yScale(high);
        const lowY = yScale(low);
        const bodyTop = yScale(Math.max(open, close));
        const bodyBottom = yScale(Math.min(open, close));
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);
        const bodyX = x - candleWidth / 2;

        return (
          <g key={`candle-${index}`}>
            <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth={1} />
            <rect
              x={bodyX}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
              fillOpacity={0.6}
              stroke={color}
            />
          </g>
        );
      })}
    </g>
  );
}

type SortField = "entry_time" | "pnl" | "pnl_percent";
type SortDirection = "asc" | "desc";

function TradesTable({ trades }: { trades: Trade[] }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>("entry_time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Sort trades
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case "entry_time":
          aVal = new Date(a.entry_time).getTime();
          bVal = new Date(b.entry_time).getTime();
          break;
        case "pnl":
          aVal = a.pnl || 0;
          bVal = b.pnl || 0;
          break;
        case "pnl_percent":
          aVal = a.pnl_percent || 0;
          bVal = b.pnl_percent || 0;
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [trades, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedTrades.length / rowsPerPage);
  const paginatedTrades = sortedTrades.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Calculate original index for display
  const getOriginalIndex = (trade: Trade) => {
    return trades.findIndex((t) => t.trade_id === trade.trade_id) + 1;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1); // Reset to first page on sort
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="font-semibold">Trade History ({trades.length} trades)</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-500">Rows:</span>
          <Select
            size="sm"
            className="w-20"
            selectedKeys={[rowsPerPage.toString()]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              if (value) {
                setRowsPerPage(Number(value));
                setPage(1);
              }
            }}
          >
            <SelectItem key="10">10</SelectItem>
            <SelectItem key="25">25</SelectItem>
            <SelectItem key="50">50</SelectItem>
            <SelectItem key="100">100</SelectItem>
          </Select>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-default-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-default-600">#</th>
                <th className="text-left py-3 px-4 font-medium text-default-600">
                  Direction
                </th>
                <th
                  className="text-left py-3 px-4 font-medium text-default-600 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("entry_time")}
                >
                  Entry Time
                  <SortIcon field="entry_time" />
                </th>
                <th className="text-right py-3 px-4 font-medium text-default-600">
                  Entry Price
                </th>
                <th className="text-left py-3 px-4 font-medium text-default-600">
                  Exit Time
                </th>
                <th className="text-right py-3 px-4 font-medium text-default-600">
                  Exit Price
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-default-600 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("pnl")}
                >
                  P&L
                  <SortIcon field="pnl" />
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-default-600 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("pnl_percent")}
                >
                  P&L %
                  <SortIcon field="pnl_percent" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-default-600">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade) => (
                <tr key={trade.trade_id} className="border-b border-default-100 hover:bg-default-50">
                  <td className="py-3 px-4 text-default-500">{getOriginalIndex(trade)}</td>
                  <td className="py-3 px-4">
                    <Chip
                      size="sm"
                      color={trade.direction === "buy" ? "success" : "danger"}
                      variant="flat"
                      startContent={
                        trade.direction === "buy" ? (
                          <ArrowUpCircle className="w-3 h-3" />
                        ) : (
                          <ArrowDownCircle className="w-3 h-3" />
                        )
                      }
                    >
                      {trade.direction === "buy" ? "Long" : "Short"}
                    </Chip>
                  </td>
                  <td className="py-3 px-4 text-default-600">
                    {formatShortDateTime(trade.entry_time)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatCurrency(trade.entry_price)}
                  </td>
                  <td className="py-3 px-4 text-default-600">
                    {trade.exit_time ? formatShortDateTime(trade.exit_time) : "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {trade.exit_price ? formatCurrency(trade.exit_price) : "-"}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-medium ${
                      (trade.pnl || 0) >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {trade.pnl !== undefined
                      ? `${trade.pnl >= 0 ? "+" : ""}${formatCurrency(trade.pnl)}`
                      : "-"}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono ${
                      (trade.pnl_percent || 0) >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {trade.pnl_percent !== undefined
                      ? `${trade.pnl_percent >= 0 ? "+" : ""}${trade.pnl_percent.toFixed(2)}%`
                      : "-"}
                  </td>
                  <td className="py-3 px-4">
                    {trade.exit_reason && (
                      <Chip size="sm" variant="bordered">
                        {trade.exit_reason}
                      </Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center py-4">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
              size="sm"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// Helper functions
function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatShortDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDateFromMs(value: number): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}b`;
  }
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}m`;
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}k`;
  }
  return `$${value.toFixed(2)}`;
}

function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}b`;
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}m`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(2)}k`;
  }
  return value.toFixed(0);
}

function normalizeIndicatorKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function findClosestEquityPoint(
  data: { time: number; equity: number }[],
  targetTime: number
): { time: number; equity: number } | undefined {
  let closest = data[0];
  let minDiff = Math.abs(data[0].time - targetTime);

  for (const point of data) {
    const diff = Math.abs(point.time - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }

  return closest;
}
