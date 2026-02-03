"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Divider,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
} from "@heroui/react";
import {
  ArrowLeft,
  Play,
  Calendar,
  DollarSign,
  BarChart3,
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  Trash2,
} from "lucide-react";
import { BacktestVisualization } from "@/components/backtest-visualization";
import { StrategyCardsTree } from "@/components/strategy-cards-tree";
import { useAuth } from "@/contexts/auth-context";
import {
  getStrategy,
  deleteStrategy,
  runBacktest,
  getBacktestHistory,
  getBacktestStatus,
  StrategyWithCards,
  BacktestResponse,
  BacktestListItem,
  formatPercent,
} from "@/lib/vibe-api";
import { formatDisplayDate, formatDateRange, formatRelativeTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StrategyDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [strategyData, setStrategyData] = useState<StrategyWithCards | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Backtest state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(
    null
  );
  const [backtestForm, setBacktestForm] = useState({
    lookback: "3m",
    initialCash: "100000",
  });

  // Historical backtests state
  const [backtestHistory, setBacktestHistory] = useState<BacktestListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Delete strategy state
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    loadStrategy();
  }, [id, authLoading]);

  // Load backtest history after strategy is loaded
  useEffect(() => {
    if (strategyData) {
      loadBacktestHistory();
    }
  }, [strategyData]);

  async function loadStrategy() {
    try {
      setLoading(true);
      setError(null);
      const data = await getStrategy(id);
      setStrategyData(data);
    } catch (err) {
      console.error("Failed to load strategy:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load strategy";
      if (isAuthError(message)) {
        router.push("/");
        return;
      }
      setError(
        message
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBacktestHistory() {
    try {
      setHistoryLoading(true);
      const response = await getBacktestHistory(id);
      setBacktestHistory(response.backtests);
    } catch (err) {
      console.error("Failed to load backtest history:", err);
      // Don't set error state - history is optional
    } finally {
      setHistoryLoading(false);
    }
  }

  async function selectHistoricalBacktest(backtestId: string) {
    try {
      setSelectedHistoryId(backtestId);
      setBacktestLoading(true);
      const result = await getBacktestStatus(backtestId);
      setBacktestResult(result);
    } catch (err) {
      console.error("Failed to load backtest:", err);
    } finally {
      setBacktestLoading(false);
    }
  }

  async function handleRunBacktest() {
    if (!strategyData) return;

    try {
      setBacktestLoading(true);
      setBacktestResult(null);
      setSelectedHistoryId(null);

      const result = await runBacktest({
        strategy_id: strategyData.strategy.id,
        lookback: backtestForm.lookback,
        initial_cash: parseFloat(backtestForm.initialCash),
      });

      setBacktestResult(result);

      // Refresh history after successful backtest
      if (result.status === "completed") {
        loadBacktestHistory();
      }
    } catch (err) {
      console.error("Backtest failed:", err);
      setBacktestResult({
        backtest_id: "",
        status: "failed",
        strategy_id: strategyData.strategy.id,
        start_date: "",
        end_date: "",
        symbol: strategyData.strategy.universe[0] || "BTC-USD",
        error: err instanceof Error ? err.message : "Backtest failed",
      });
    } finally {
      setBacktestLoading(false);
    }
  }

  function isAuthError(message: string): boolean {
    const lowered = message.toLowerCase();
    return (
      lowered.includes("authentication required") ||
      lowered.includes("unauthorized") ||
      lowered.includes("token")
    );
  }

  async function handleDeleteStrategy() {
    if (!strategyData || !user) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteStrategy(strategyData.strategy.id);
      window.alert("Strategy deleted.");
      onDeleteClose();
      router.push("/strategies");
    } catch (err) {
      console.error("Failed to delete strategy:", err);
      const message =
        err instanceof Error ? err.message : "Failed to delete strategy";
      if (isAuthError(message)) {
        router.push("/");
        return;
      }
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !strategyData) {
    return (
      <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-stone-50 via-white to-stone-100">
        <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push("/strategies")}
            className="mb-4 text-stone-600 hover:text-stone-900"
          >
            Back to Strategies
          </Button>
          <Card className="bg-red-50 border border-red-200">
            <CardBody>
              <p className="text-red-600">{error || "Strategy not found"}</p>
              <Button
                color="danger"
                variant="flat"
                className="mt-4"
                onPress={loadStrategy}
              >
                Retry
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const { strategy, cards } = strategyData;
  const isOwner = Boolean(user && strategy.owner_id && user.uid === strategy.owner_id);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-stone-50 via-white to-stone-100">
      <div className="container mx-auto px-4 py-8 pt-24 pb-12 max-w-6xl">
      {/* Header - pt-24 accounts for fixed navbar */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="light"
          isIconOnly
          onPress={() => router.push("/strategies")}
          className="text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-stone-900">{strategy.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {strategy.universe.map((symbol) => (
              <Chip key={symbol} size="sm" variant="bordered">
                {symbol}
              </Chip>
            ))}
          </div>
        </div>
        {isOwner && (
          <Button
            color="danger"
            variant="bordered"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={onDeleteOpen}
            isDisabled={isDeleting}
          >
            Delete Strategy
          </Button>
        )}
        <Button
          color="primary"
          startContent={<Play className="w-4 h-4" />}
          onPress={onOpen}
        >
          Run Backtest
        </Button>
      </div>

      {/* Strategy Info */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card className="bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Created</p>
              <p className="font-semibold text-stone-900">{formatDisplayDate(strategy.created_at)}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Cards</p>
              <p className="font-semibold text-stone-900">{cards.length} attached</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Cards Section */}
      <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm">
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-900">Strategy Cards</h2>
        </CardHeader>
        <Divider className="bg-stone-200" />
        <CardBody>
          <StrategyCardsTree cards={cards} />
        </CardBody>
      </Card>

      {/* Backtest Results Section */}
      <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-stone-900">Backtest Results</h2>
          {backtestLoading && <Spinner size="sm" />}
        </CardHeader>
        <Divider className="bg-stone-200" />
        <CardBody>
          {backtestLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Spinner size="lg" className="mb-4" />
                <p className="text-stone-500">Running backtest...</p>
              </div>
            </div>
          ) : backtestResult ? (
            <BacktestVisualization
              result={backtestResult}
              initialCash={parseFloat(backtestForm.initialCash)}
            />
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500 mb-2">No backtest results yet</p>
              <p className="text-sm text-stone-400">
                Click &quot;Run Backtest&quot; to test your strategy
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Backtest History Section */}
      <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-stone-500" />
            <h2 className="text-lg font-semibold text-stone-900">Backtest History</h2>
            {backtestHistory.length > 0 && (
              <Chip size="sm" variant="flat" className="bg-stone-100 text-stone-600">
                {backtestHistory.length}
              </Chip>
            )}
          </div>
          {historyLoading && <Spinner size="sm" />}
        </CardHeader>
        <Divider className="bg-stone-200" />
        <CardBody>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : backtestHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">No backtest history</p>
              <p className="text-sm text-stone-400">
                Run backtests to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backtestHistory.map((bt) => (
                <div
                  key={bt.backtest_id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedHistoryId === bt.backtest_id
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-stone-50 hover:bg-stone-100"
                  }`}
                  onClick={() => selectHistoricalBacktest(bt.backtest_id)}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Created time with tooltip */}
                    <Tooltip content={new Date(bt.created_at).toLocaleString()}>
                      <div className="flex items-center gap-1 text-stone-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">
                          {formatRelativeTime(bt.created_at)}
                        </span>
                      </div>
                    </Tooltip>
                    {/* Date range */}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span className="text-sm text-stone-600">
                        {formatDateRange(bt.start_date, bt.end_date)}
                      </span>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={bt.status === "completed" ? "success" : bt.status === "failed" ? "danger" : "warning"}
                    >
                      {bt.status}
                    </Chip>
                    <span className="text-sm text-stone-500">
                      {bt.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {bt.total_trades !== null && (
                      <span className="text-sm text-stone-500">
                        {bt.total_trades} trades
                      </span>
                    )}
                    {bt.total_return !== null && (
                      <div className={`flex items-center gap-1 ${bt.total_return >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {bt.total_return >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {formatPercent(bt.total_return)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Backtest Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-stone-900">Run Backtest</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Lookback Period */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-stone-700 mb-2">Lookback Period</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "1m", label: "1 Month" },
                      { value: "3m", label: "3 Months" },
                      { value: "6m", label: "6 Months" },
                      { value: "1y", label: "1 Year" },
                    ].map((period) => (
                      <Button
                        key={period.value}
                        size="sm"
                        variant={backtestForm.lookback === period.value ? "solid" : "bordered"}
                        color={backtestForm.lookback === period.value ? "primary" : "default"}
                        onPress={() => setBacktestForm((f) => ({ ...f, lookback: period.value }))}
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Symbol is extracted from strategy's entry card context */}
                <div className="p-3 bg-stone-100 rounded-lg">
                  <p className="text-sm text-stone-600">
                    <strong>Symbol:</strong> {strategy.universe[0] || "BTC-USD"}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    (Determined by strategy&apos;s entry card)
                  </p>
                </div>
                <Input
                  type="number"
                  label="Initial Cash"
                  startContent={<DollarSign className="w-4 h-4 text-stone-400" />}
                  value={backtestForm.initialCash}
                  onChange={(e) =>
                    setBacktestForm((f) => ({ ...f, initialCash: e.target.value }))
                  }
                />
              </div>

            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => {
                handleRunBacktest();
                onClose();
              }}
              isLoading={backtestLoading}
            >
              Run Backtest
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader className="text-stone-900">Delete Strategy?</ModalHeader>
          <ModalBody>
            <p className="text-stone-600">
              This will permanently delete this strategy, all cards, and all
              backtests. This action cannot be undone.
            </p>
            {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}
            {isDeleting && (
              <div className="flex items-center gap-2 text-stone-500">
                <Spinner size="sm" />
                <span className="text-sm">Deleting strategy...</span>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteStrategy}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </div>
    </div>
  );
}
