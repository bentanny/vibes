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
  Target,
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  Trash2,
} from "lucide-react";
import { BacktestVisualization } from "@/components/backtest-visualization";
import { CardParamsSummary } from "@/components/card-params-editor";
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
  getStatusColor,
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
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
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
        start_date: new Date(backtestForm.startDate).toISOString(),
        end_date: new Date(backtestForm.endDate).toISOString(),
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
        start_date: backtestForm.startDate,
        end_date: backtestForm.endDate,
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/strategies")}
          className="mb-4"
        >
          Back to Strategies
        </Button>
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">{error || "Strategy not found"}</p>
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
    );
  }

  const { strategy, cards } = strategyData;
  const isOwner = Boolean(user && strategy.owner_id && user.uid === strategy.owner_id);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pt-24 pb-12 max-w-6xl">
      {/* Header - pt-24 accounts for fixed navbar */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="light"
          isIconOnly
          onPress={() => router.push("/strategies")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{strategy.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Chip
              size="sm"
              color={getStatusColor(strategy.status) as "default" | "primary" | "secondary" | "success" | "warning" | "danger"}
              variant="flat"
            >
              {strategy.status}
            </Chip>
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
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-default-500">Created</p>
              <p className="font-semibold">{formatDisplayDate(strategy.created_at)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-default-500">Cards</p>
              <p className="font-semibold">{cards.length} attached</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Target className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-default-500">Version</p>
              <p className="font-semibold">v{strategy.version}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Cards Section */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Strategy Cards</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          {cards.length === 0 ? (
            <p className="text-default-500 text-center py-4">
              No cards attached to this strategy
            </p>
          ) : (
            <CardParamsSummary cards={cards} />
          )}
        </CardBody>
      </Card>

      {/* Backtest Results Section */}
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Backtest Results</h2>
          {backtestLoading && <Spinner size="sm" />}
        </CardHeader>
        <Divider />
        <CardBody>
          {backtestLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Spinner size="lg" className="mb-4" />
                <p className="text-default-500">Running backtest...</p>
              </div>
            </div>
          ) : backtestResult ? (
            <BacktestVisualization
              result={backtestResult}
              initialCash={parseFloat(backtestForm.initialCash)}
            />
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-default-300 mb-4" />
              <p className="text-default-500 mb-2">No backtest results yet</p>
              <p className="text-sm text-default-400">
                Click &quot;Run Backtest&quot; to test your strategy
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Backtest History Section */}
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-default-500" />
            <h2 className="text-lg font-semibold">Backtest History</h2>
            {backtestHistory.length > 0 && (
              <Chip size="sm" variant="flat">
                {backtestHistory.length}
              </Chip>
            )}
          </div>
          {historyLoading && <Spinner size="sm" />}
        </CardHeader>
        <Divider />
        <CardBody>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : backtestHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto text-default-300 mb-4" />
              <p className="text-default-500">No backtest history</p>
              <p className="text-sm text-default-400">
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
                      ? "bg-primary-100 border border-primary-200"
                      : "bg-default-50 hover:bg-default-100"
                  }`}
                  onClick={() => selectHistoricalBacktest(bt.backtest_id)}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Created time with tooltip */}
                    <Tooltip content={new Date(bt.created_at).toLocaleString()}>
                      <div className="flex items-center gap-1 text-default-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">
                          {formatRelativeTime(bt.created_at)}
                        </span>
                      </div>
                    </Tooltip>
                    {/* Date range */}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-default-400" />
                      <span className="text-sm text-default-600">
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
                    <span className="text-sm text-default-500">
                      {bt.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {bt.total_trades !== null && (
                      <span className="text-sm text-default-500">
                        {bt.total_trades} trades
                      </span>
                    )}
                    {bt.total_return !== null && (
                      <div className={`flex items-center gap-1 ${bt.total_return >= 0 ? "text-success" : "text-danger"}`}>
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
          <ModalHeader>Run Backtest</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Date Range & Cash */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={backtestForm.startDate}
                    onChange={(e) =>
                      setBacktestForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    label="End Date"
                    value={backtestForm.endDate}
                    onChange={(e) =>
                      setBacktestForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                  />
                </div>
                {/* Symbol is extracted from strategy's entry card context */}
                <div className="p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">
                    <strong>Symbol:</strong> {strategy.universe[0] || "BTC-USD"}
                  </p>
                  <p className="text-xs text-default-400 mt-1">
                    (Determined by strategy&apos;s entry card)
                  </p>
                </div>
                <Input
                  type="number"
                  label="Initial Cash"
                  startContent={<DollarSign className="w-4 h-4 text-default-400" />}
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
          <ModalHeader>Delete Strategy?</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              This will permanently delete this strategy, all cards, and all
              backtests. This action cannot be undone.
            </p>
            {deleteError && <p className="text-danger text-sm">{deleteError}</p>}
            {isDeleting && (
              <div className="flex items-center gap-2 text-default-500">
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

function getDefaultStartDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split("T")[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split("T")[0];
}
