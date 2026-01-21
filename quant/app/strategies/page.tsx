"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Divider,
  Tooltip,
} from "@heroui/react";
import { Plus, ChevronRight, TrendingUp, TrendingDown, Clock, Layers, Activity } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getStrategies,
  getBacktestHistory,
  Strategy,
  BacktestListItem,
  formatPercent,
  getStatusColor,
} from "@/lib/vibe-api";
import { getRoleDotColor, formatRelativeTime } from "@/lib/utils";

// Cache for latest backtest results per strategy
type LatestBacktestCache = Record<string, BacktestListItem | null>;

export default function StrategiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestBacktests, setLatestBacktests] = useState<LatestBacktestCache>({});

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to home if not logged in
      router.push("/");
      return;
    }

    loadStrategies();
  }, [user, authLoading, router]);

  async function loadStrategies() {
    try {
      setLoading(true);
      setError(null);
      const data = await getStrategies();
      setStrategies(data);

      // Load latest backtest for each strategy in parallel
      const backtestPromises = data.map(async (strategy) => {
        try {
          const history = await getBacktestHistory(strategy.id, 1);
          return { strategyId: strategy.id, backtest: history.backtests[0] || null };
        } catch {
          return { strategyId: strategy.id, backtest: null };
        }
      });

      const results = await Promise.all(backtestPromises);
      const cache: LatestBacktestCache = {};
      results.forEach(({ strategyId, backtest }) => {
        cache[strategyId] = backtest;
      });
      setLatestBacktests(cache);
    } catch (err) {
      console.error("Failed to load strategies:", err);
      setError(err instanceof Error ? err.message : "Failed to load strategies");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">{error}</p>
            <Button
              color="danger"
              variant="flat"
              className="mt-4"
              onPress={loadStrategies}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pt-24 pb-12 max-w-6xl">
      {/* Header - pt-24 accounts for fixed navbar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Strategies</h1>
          <p className="text-default-500 mt-1">
            {strategies.length > 0
              ? `${strategies.length} ${strategies.length === 1 ? "strategy" : "strategies"}`
              : "Manage your trading strategies and run backtests"}
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => router.push("/")}
        >
          New Strategy
        </Button>
      </div>

      {/* Strategies Grid */}
      {strategies.length === 0 ? (
        <Card className="bg-default-50">
          <CardBody className="py-12 text-center">
            <Layers className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No strategies yet</h3>
            <p className="text-default-500 mb-6">
              Create your first trading strategy using our AI assistant
            </p>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => router.push("/")}
            >
              Create Strategy
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              latestBacktest={latestBacktests[strategy.id]}
              onClick={() => router.push(`/strategies/${strategy.id}`)}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

interface StrategyCardProps {
  strategy: Strategy;
  latestBacktest: BacktestListItem | null | undefined;
  onClick: () => void;
}

function StrategyCard({ strategy, latestBacktest, onClick }: StrategyCardProps) {
  const cardCount = strategy.attachments?.length || 0;
  const hasPerformance = latestBacktest?.status === "completed" && latestBacktest.total_return !== null;

  return (
    <Card
      isPressable
      onPress={onClick}
      className="hover:bg-default-50 transition-colors"
    >
      <CardHeader className="flex justify-between items-start pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{strategy.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Chip
              size="sm"
              color={getStatusColor(strategy.status) as "default" | "primary" | "secondary" | "success" | "warning" | "danger"}
              variant="flat"
            >
              {strategy.status}
            </Chip>
            {strategy.universe.length > 0 && (
              <Chip size="sm" variant="bordered">
                {strategy.universe[0]}
              </Chip>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-default-400 flex-shrink-0" />
      </CardHeader>

      <Divider />

      <CardBody className="pt-3 space-y-3">
        {/* Performance Preview */}
        {hasPerformance && latestBacktest && (
          <div className="flex items-center justify-between p-2 bg-default-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-default-400" />
              <span className="text-xs text-default-500">Latest Backtest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${latestBacktest.total_return! >= 0 ? "text-success" : "text-danger"}`}>
                {latestBacktest.total_return! >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">
                  {formatPercent(latestBacktest.total_return!)}
                </span>
              </div>
              {latestBacktest.total_trades !== null && (
                <Tooltip content={`${latestBacktest.total_trades} trades`}>
                  <Chip size="sm" variant="flat" className="text-xs">
                    {latestBacktest.total_trades}t
                  </Chip>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Meta info row */}
        <div className="flex items-center justify-between text-sm text-default-500">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            <span>
              {cardCount} {cardCount === 1 ? "card" : "cards"}
            </span>
          </div>
          <Tooltip content={new Date(strategy.updated_at).toLocaleString()}>
            <div className="flex items-center gap-1 cursor-default">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(strategy.updated_at)}</span>
            </div>
          </Tooltip>
        </div>

        {/* Card roles summary */}
        {cardCount > 0 && (
          <div className="flex gap-1 flex-wrap">
            {getRoleSummary(strategy.attachments).map((role) => (
              <Chip
                key={role.name}
                size="sm"
                variant="dot"
                classNames={{
                  dot: getRoleDotColor(role.name),
                }}
              >
                {role.count} {role.name}
              </Chip>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function getRoleSummary(
  attachments: Strategy["attachments"]
): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const att of attachments || []) {
    counts[att.role] = (counts[att.role] || 0) + 1;
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}
