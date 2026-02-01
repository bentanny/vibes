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
                <DrawdownChart data={equityData} />
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
                <ReturnsChart data={equityData} />
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
                  indicators={result.results.indicators}
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

function DrawdownChart({ data }: { data: { timeStr: string; drawdown: number }[] }) {
  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center text-default-500">
        No drawdown data available
      </div>
    );
  }

  const maxDrawdown = Math.min(...data.map((d) => -Math.abs(d.drawdown)));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#888" />
          <Area
            type="monotone"
            dataKey={(d: { drawdown: number }) => -Math.abs(d.drawdown)}
            stroke="hsl(var(--heroui-danger))"
            fill="hsl(var(--heroui-danger))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReturnsChart({ data }: { data: { timeStr: string; return: number }[] }) {
  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center text-default-500">
        No returns data available
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PriceChart({
  ohlcvBars,
  indicators,
}: {
  ohlcvBars?: OHLCVBar[];
  indicators?: Record<string, Array<Record<string, any>>>;
}) {
  console.log('PriceChart received:', {
    ohlcvBarsLength: ohlcvBars?.length,
    ohlcvBarsType: typeof ohlcvBars,
    isArray: Array.isArray(ohlcvBars),
    firstBar: ohlcvBars?.[0]
  });

  const { chartData, indicatorLabels } = useMemo(() => {
    if (!ohlcvBars?.length) {
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

    const data = ohlcvBars.map((bar) => {
      const timeMs = new Date(bar.time).getTime();
      return {
        time: timeMs,
        timeStr: formatShortDate(bar.time),
        ...bar,
        ...(indicatorByTime.get(timeMs) || {}),
      };
    });

    return { chartData: data, indicatorLabels: labels };
  }, [ohlcvBars, indicators]);

  if (!ohlcvBars?.length) {
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
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
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
            domain={["auto", "auto"]}
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
          {hasBollinger && (
            <Legend
              verticalAlign="top"
              height={24}
              wrapperStyle={{ fontSize: "11px" }}
            />
          )}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="high"
            stroke="transparent"
            dot={false}
            activeDot={false}
            legendType="none"
            isAnimationActive={false}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="low"
            stroke="transparent"
            dot={false}
            activeDot={false}
            legendType="none"
            isAnimationActive={false}
          />
          <Customized component={CandlestickSeries} />
          <Bar
            dataKey="volume"
            yAxisId="volume"
            barSize={6}
            fill="hsl(var(--heroui-foreground))"
            fillOpacity={0.12}
          />
          {"bb_upper" in indicatorLabels && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_upper"
              stroke="rgba(59, 130, 246, 0.7)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              name={indicatorLabels.bb_upper}
            />
          )}
          {"bb_middle" in indicatorLabels && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_middle"
              stroke="rgba(59, 130, 246, 0.7)"
              strokeWidth={1.5}
              dot={false}
              name={indicatorLabels.bb_middle}
            />
          )}
          {"bb_lower" in indicatorLabels && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="bb_lower"
              stroke="rgba(59, 130, 246, 0.7)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              name={indicatorLabels.bb_lower}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
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
