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
