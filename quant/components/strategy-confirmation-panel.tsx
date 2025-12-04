"use client";

import React, { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Slider } from "@heroui/slider";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Checkbox } from "@heroui/checkbox";
import { Spinner } from "@heroui/spinner";
import {
  ArrowLeft,
  ArrowRight,
  Radio,
  Shield,
  UserCircle,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  Target,
  Zap,
  PlayCircle,
  BanknoteArrowDown,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  AlertCircle,
  CandlestickChart,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { useSnapTrade } from "@/hooks/use-snaptrade";
import { useCoinbase } from "@/hooks/use-coinbase";
import { AnimatedBeam } from "@/components/ui/animated-beam";

// Broker types match SnapTrade slugs
type BrokerType = "robinhood" | "webull" | "coinbase";
type PanelState =
  | "confirm"
  | "sign-in"
  | "select-broker"
  | "connect"
  | "authenticating"
  | "connected";
type TradingMode = "paper" | "real" | null;

interface StrategyConfirmationPanelProps {
  onConnectionComplete?: (broker: BrokerType) => void;
  onPaperTrade?: () => void;
  onTradeExecuted?: (result: {
    success: boolean;
    orderId?: string;
    error?: string;
  }) => void;
  ticker?: string;
  strategyName?: string;
}

// Storage key for persisting confirmation panel state
const PANEL_STORAGE_KEY = "quant_confirmation_panel_state";

interface PanelPersistedState {
  panelState: PanelState;
  selectedBroker: BrokerType | null;
  tradingMode: TradingMode;
  positionSize: number;
  ticker: string;
}

function getPanelStorageKey(ticker: string) {
  return `${PANEL_STORAGE_KEY}_${ticker}`;
}

function loadPanelPersistedState(
  ticker: string,
): Partial<PanelPersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(getPanelStorageKey(ticker));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load panel state:", e);
  }
  return null;
}

function savePanelPersistedState(ticker: string, state: PanelPersistedState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(getPanelStorageKey(ticker), JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save panel state:", e);
  }
}

// SnapTrade broker slugs and display config
const BROKER_CONFIG: Record<
  BrokerType,
  {
    name: string;
    domain: string;
    brandColor: string;
    hoverTextColor: string;
    snapTradeSlug: string;
  }
> = {
  robinhood: {
    name: "Robinhood",
    domain: "robinhood.com",
    brandColor: "#CCFF00",
    hoverTextColor: "text-black",
    snapTradeSlug: "ROBINHOOD",
  },
  webull: {
    name: "Webull",
    domain: "webull.com",
    brandColor: "#1942E0",
    hoverTextColor: "text-white",
    snapTradeSlug: "WEBULL",
  },
  coinbase: {
    name: "Coinbase",
    domain: "coinbase.com",
    brandColor: "#0052FF",
    hoverTextColor: "text-white",
    snapTradeSlug: "COINBASE",
  },
};

export function StrategyConfirmationPanel({
  onConnectionComplete,
  onPaperTrade,
  onTradeExecuted,
  ticker = "AAPL",
  strategyName = "Trend Pullback",
}: StrategyConfirmationPanelProps) {
  const { data: session } = useSession();

  // SnapTrade integration (primary - supports multiple brokerages)
  const {
    isConnected: isSnapTradeConnected,
    isLoading: isSnapTradeLoading,
    isInitializing: isSnapTradeInitializing,
    error: snapTradeError,
    accounts: snapTradeAccounts,
    connect: connectSnapTrade,
    executeTrade,
    clearError,
    checkConnection,
  } = useSnapTrade();

  // Coinbase integration (for crypto - uses OAuth)
  const { isConnected: isCoinbaseConnected, accounts: coinbaseAccounts } =
    useCoinbase();

  // Helper to get searchable name from account (checks both brokerageName and name fields)
  const getAccountBrokerName = (acc: (typeof snapTradeAccounts)[0]): string => {
    // Try brokerageName first, fall back to name field
    return (acc.brokerageName || acc.name || "").toLowerCase();
  };

  // Helper to check if a specific broker is connected
  const isBrokerConnected = (broker: BrokerType): boolean => {
    if (broker === "coinbase") {
      // Check both Coinbase OAuth and SnapTrade Coinbase connection
      if (isCoinbaseConnected && coinbaseAccounts.length > 0) return true;
      if (
        isSnapTradeConnected &&
        snapTradeAccounts.some((acc) =>
          getAccountBrokerName(acc).includes("coinbase"),
        )
      )
        return true;
      return false;
    }

    // For Robinhood and Webull, check SnapTrade accounts
    if (isSnapTradeConnected && snapTradeAccounts.length > 0) {
      return snapTradeAccounts.some((acc) =>
        getAccountBrokerName(acc).includes(broker),
      );
    }
    return false;
  };

  // Determine which broker is connected (returns first found)
  const getConnectedBroker = (): BrokerType | null => {
    // Check SnapTrade accounts first (more reliable)
    if (isSnapTradeConnected && snapTradeAccounts.length > 0) {
      const brokerName = getAccountBrokerName(snapTradeAccounts[0]);
      if (brokerName.includes("robinhood")) return "robinhood";
      if (brokerName.includes("webull")) return "webull";
      if (brokerName.includes("coinbase")) return "coinbase";
    }
    // Then check Coinbase OAuth
    if (isCoinbaseConnected && coinbaseAccounts.length > 0) return "coinbase";
    return null;
  };

  // Check if ANY broker is connected
  const hasAnyConnection =
    (isSnapTradeConnected && snapTradeAccounts.length > 0) ||
    (isCoinbaseConnected && coinbaseAccounts.length > 0);
  const accounts = snapTradeAccounts;

  // Load persisted state on mount
  const persistedState = React.useRef<Partial<PanelPersistedState> | null>(
    null,
  );
  if (persistedState.current === null && typeof window !== "undefined") {
    persistedState.current = loadPanelPersistedState(ticker);
  }

  const [panelState, setPanelState] = useState<PanelState>(() => {
    // Restore panel state, but don't restore "authenticating" state as it's transient
    if (
      persistedState.current?.ticker === ticker &&
      persistedState.current.panelState
    ) {
      const savedState = persistedState.current.panelState;
      // Don't restore authenticating state - go back to connect
      if (savedState === "authenticating") return "connect";
      return savedState;
    }
    return "confirm";
  });
  const [selectedBroker, setSelectedBroker] = useState<BrokerType | null>(
    () => {
      if (persistedState.current?.ticker === ticker) {
        return persistedState.current.selectedBroker ?? null;
      }
      return null;
    },
  );
  const [tradingMode, setTradingMode] = useState<TradingMode>(() => {
    if (persistedState.current?.ticker === ticker) {
      return persistedState.current.tradingMode ?? null;
    }
    return null;
  });
  const [positionSize, setPositionSize] = useState<number>(() => {
    if (persistedState.current?.ticker === ticker) {
      return persistedState.current.positionSize ?? 500;
    }
    return 500;
  });
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [tradeResult, setTradeResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [cameFromConnected, setCameFromConnected] = useState(false);

  // Sign-in form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Refs for animated beam
  const connectContainerRef = useRef<HTMLDivElement>(null);
  const quantLogoRef = useRef<HTMLDivElement>(null);
  const brokerLogoRef = useRef<HTMLDivElement>(null);

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

  const isLoading = isGoogleLoading || isEmailLoading;

  // Persist state changes to sessionStorage
  React.useEffect(() => {
    savePanelPersistedState(ticker, {
      panelState,
      selectedBroker,
      tradingMode,
      positionSize,
      ticker,
    });
  }, [panelState, selectedBroker, tradingMode, positionSize, ticker]);

  // Check URL params for connection callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("snaptrade") === "connected") {
      // User just came back from SnapTrade connection
      checkConnection();
      setPanelState("connected");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkConnection]);

  // Check if already connected and skip to connected state
  useEffect(() => {
    // Only auto-transition if we're in the "connect" state AND the selected broker is connected
    if (
      panelState === "connect" &&
      selectedBroker &&
      isBrokerConnected(selectedBroker)
    ) {
      setPanelState("connected");
    }
  }, [
    panelState,
    selectedBroker,
    isSnapTradeConnected,
    snapTradeAccounts,
    isCoinbaseConnected,
    coinbaseAccounts,
  ]);

  const handleBrokerSelect = (broker: BrokerType) => {
    setSelectedBroker(broker);

    // Only go to connected state if THIS SPECIFIC broker is connected
    if (isBrokerConnected(broker)) {
      setPanelState("connected");
    } else {
      setPanelState("connect");
    }
  };

  // Handle SnapTrade connection for specific broker
  const handleBrokerConnect = async () => {
    if (!selectedBroker) return;

    setPanelState("authenticating");
    const brokerSlug = BROKER_CONFIG[selectedBroker].snapTradeSlug;
    await connectSnapTrade(brokerSlug);
  };

  // Execute a trade via SnapTrade
  const handleExecuteTrade = async (action: "buy" | "sell") => {
    if (!hasAnyConnection) {
      setTradeResult({ success: false, error: "No brokerage connected" });
      return;
    }

    // Find the first available trading account
    const tradingAccount = accounts[0];

    if (!tradingAccount) {
      setTradeResult({ success: false, error: "No trading account found" });
      return;
    }

    setIsExecutingTrade(true);
    setTradeResult(null);

    try {
      // Calculate quantity based on position size (simplified - would need price lookup)
      // For now, we'll pass the dollar amount and let the API handle it
      const result = await executeTrade(
        tradingAccount.id,
        ticker,
        action.toUpperCase() as "BUY" | "SELL",
        Math.floor(positionSize / 100), // Simplified quantity calculation
      );

      if (result.success) {
        setTradeResult({
          success: true,
          message: `${action === "buy" ? "Bought" : "Sold"} $${positionSize} of ${ticker}`,
        });
        if (onTradeExecuted) {
          onTradeExecuted({ success: true, orderId: result.order?.id });
        }
      } else {
        setTradeResult({ success: false, error: result.error });
        if (onTradeExecuted) {
          onTradeExecuted({ success: false, error: result.error });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Trade failed";
      setTradeResult({ success: false, error: errorMessage });
      if (onTradeExecuted) {
        onTradeExecuted({ success: false, error: errorMessage });
      }
    } finally {
      setIsExecutingTrade(false);
    }
  };

  const handleBack = () => {
    // Clear all errors when navigating back
    clearError();
    setSignInError(null);
    setTradeResult(null);

    if (panelState === "connect") {
      setPanelState("select-broker");
      setSelectedBroker(null);
    } else if (panelState === "select-broker") {
      // If user came from connected state (via Switch Brokerage), go back there
      if (cameFromConnected) {
        const connectedBroker = getConnectedBroker();
        if (connectedBroker) {
          setSelectedBroker(connectedBroker);
          setPanelState("connected");
          setCameFromConnected(false);
          return;
        }
      }
      if (tradingMode === "real") {
        setPanelState("confirm");
      } else {
        setPanelState("sign-in");
      }
      setTradingMode(null);
    } else if (panelState === "sign-in") {
      setPanelState("confirm");
      setTradingMode(null);
    }
  };

  const handleRealTrading = () => {
    setTradingMode("real");
    // Use actual session state instead of prop
    if (!session) {
      setPanelState("sign-in");
    } else {
      // Check if already connected to any broker
      const connectedBroker = getConnectedBroker();
      if (connectedBroker) {
        setSelectedBroker(connectedBroker);
        setPanelState("connected");
      } else {
        setPanelState("select-broker");
      }
    }
  };

  const handlePaperTrading = () => {
    setTradingMode("paper");
    // Use actual session state instead of prop
    if (!session) {
      setPanelState("sign-in");
    } else {
      if (onPaperTrade) {
        onPaperTrade();
      }
    }
  };

  const handleContinue = async () => {
    if (selectedBroker) {
      // Initiate SnapTrade connection for the selected broker
      await handleBrokerConnect();
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Remove this bypass after testing - just proceed to next state
    if (tradingMode === "real") {
      setPanelState("select-broker");
    } else if (tradingMode === "paper") {
      if (onPaperTrade) {
        onPaperTrade();
      }
    }
    return;

    // Real Google sign-in logic (commented out for testing)
    /*
    setIsGoogleLoading(true);
    setSignInError(null);
    try {
      await signIn("google", {
        callbackUrl: window.location.href,
      });
    } catch {
      setSignInError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
    */
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Remove this bypass after testing - just proceed to next state
    if (tradingMode === "real") {
      setPanelState("select-broker");
    } else if (tradingMode === "paper") {
      if (onPaperTrade) {
        onPaperTrade();
      }
    }
    return;

    // Real sign-in logic (commented out for testing)
    /*
    if (!email || !password) {
      setSignInError("Please enter both email and password.");
      return;
    }

    setIsEmailLoading(true);
    setSignInError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setSignInError("Invalid email or password. Please try again.");
        setIsEmailLoading(false);
      } else if (result?.ok) {
        // After successful sign-in, proceed based on trading mode
        if (tradingMode === "real") {
          setPanelState("select-broker");
        } else if (tradingMode === "paper") {
          if (onPaperTrade) {
            onPaperTrade();
          }
        }
        // Optionally refresh to update session state
        window.location.reload();
      }
    } catch {
      setSignInError("An error occurred. Please try again.");
      setIsEmailLoading(false);
    }
    */
  };

  const brokerConfig = selectedBroker ? BROKER_CONFIG[selectedBroker] : null;

  // Calculate risk based on position size (simplified example)
  const maxRisk = Math.round(positionSize * 0.05); // 5% max risk example

  return (
    <Card className="flex-1 flex flex-col overflow-hidden shadow-lg shadow-stone-200/50 bg-white">
      {/* State 1: Strategy Confirmation & Position Sizing */}
      {panelState === "confirm" && (
        <>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-stone-700">Ready to Trade</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-5 bg-[#faf8f4] overflow-y-auto">
            {/* Position Size Section */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-stone-500" />
                  <span className="text-sm font-semibold text-stone-700">
                    How much do you want to trade?
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
                <div className="text-center mb-4">
                  <span className="text-3xl font-mono font-bold text-stone-900">
                    ${positionSize.toLocaleString()}
                  </span>
                  <p className="text-xs text-stone-400 mt-1">per trade</p>
                </div>

                <Slider
                  size="sm"
                  step={0.01}
                  minValue={5}
                  maxValue={5000}
                  value={positionSize}
                  color="success"
                  onChange={(value) => setPositionSize(value as number)}
                  className="max-w-full"
                />

                <div className="flex justify-between text-[10px] text-stone-400 mt-2 uppercase tracking-wider">
                  <span>$5</span>
                  <span>$5,000</span>
                </div>
              </div>
            </div>

            {/* What to Expect */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-stone-500" />
                <span className="text-sm font-semibold text-stone-700">
                  What happens next
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Target size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      Our AI monitors {ticker} for buy or sell signals
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Our agent works 24/7 so you don&apos;t have to
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <BanknoteArrowDown size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      We automate your trades using your brokerage
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      No manual action required from you
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      Uses automated stop-loss for downside protection
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Limits your downside risk
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={14}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-medium text-amber-800">
                    Maximum you could lose: ~${maxRisk}
                  </p>
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    Based on your stop-loss settings. Past performance
                    doesn&apos;t guarantee results.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <div className="flex gap-3">
                <Button
                  className="flex-1 border border-stone-300 text-xs uppercase tracking-widest text-stone-700 hover:bg-stone-100 transition-all duration-300 bg-transparent"
                  variant="bordered"
                  size="lg"
                  radius="lg"
                  startContent={<PlayCircle size={16} />}
                  onPress={handlePaperTrading}
                >
                  Paper Trade
                </Button>

                <Button
                  className="flex-1 bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-lg text-xs uppercase tracking-widest"
                  size="lg"
                  radius="lg"
                  startContent={
                    !isSnapTradeInitializing && <DollarSign size={16} />
                  }
                  onPress={handleRealTrading}
                  isLoading={isSnapTradeInitializing}
                  isDisabled={isSnapTradeInitializing}
                >
                  Real Cash
                </Button>
              </div>

              <p className="text-center text-[10px] text-stone-400">
                Paper trading uses fake money to test your strategy risk-free
              </p>
            </div>
          </div>
        </>
      )}

      {/* State 2: Sign In */}
      {panelState === "sign-in" && (
        <>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Back
              </span>
            </button>
          </div>

          <div className="flex-1 flex flex-col p-5 bg-[#faf8f4] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Logo size={20} className="text-stone-900" />
                <span className="text-sm tracking-[0.2em] uppercase font-medium text-stone-900">
                  Quant
                </span>
              </div>
              <p className="text-xs text-stone-500 text-center">
                Sign in to{" "}
                {tradingMode === "paper"
                  ? "start paper trading"
                  : "connect your broker"}
              </p>
            </div>

            {/* Error Message */}
            {signInError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center mb-4">
                {signInError}
              </div>
            )}

            {/* Google Sign In Button */}
            <Button
              className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent mb-4"
              variant="bordered"
              size="lg"
              radius="full"
              startContent={
                !isGoogleLoading && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )
              }
              onPress={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              isDisabled={isLoading}
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <Divider className="flex-1 bg-stone-200" />
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
                or sign in with email
              </span>
              <Divider className="flex-1 bg-stone-200" />
            </div>

            {/* Email/Password Form */}
            <form
              onSubmit={handleEmailSignIn}
              className="space-y-3 flex-1 flex flex-col"
            >
              <Input
                type="email"
                label="Email"
                value={email}
                onValueChange={setEmail}
                startContent={
                  <Mail size={16} className="text-stone-400 flex-shrink-0" />
                }
                variant="bordered"
                size="md"
                radius="lg"
                isDisabled={isLoading}
                classNames={{
                  inputWrapper: "bg-white",
                }}
              />

              <Input
                type={isPasswordVisible ? "text" : "password"}
                label="Password"
                value={password}
                onValueChange={setPassword}
                startContent={<Lock size={16} className="text-stone-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="focus:outline-none"
                  >
                    {isPasswordVisible ? (
                      <EyeOff
                        size={16}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                      />
                    ) : (
                      <Eye
                        size={16}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                      />
                    )}
                  </button>
                }
                variant="bordered"
                size="md"
                radius="lg"
                isDisabled={isLoading}
                classNames={{
                  inputWrapper: "bg-white",
                }}
              />

              <div className="flex justify-between items-center">
                <Checkbox
                  isSelected={rememberMe}
                  onValueChange={setRememberMe}
                  size="sm"
                  classNames={{
                    label: "text-xs text-stone-500",
                    wrapper:
                      "before:border-stone-300 after:bg-amber-500 group-data-[selected=true]:after:bg-amber-500",
                  }}
                  isDisabled={isLoading}
                >
                  Remember me
                </Checkbox>
                <button
                  type="button"
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="mt-auto pt-3">
                <Button
                  type="submit"
                  className="w-full bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-lg"
                  size="lg"
                  radius="lg"
                  endContent={!isEmailLoading && <ArrowRight size={16} />}
                  isLoading={isEmailLoading}
                  isDisabled={isLoading}
                >
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Sign In
                  </span>
                </Button>

                <p className="text-[10px] text-stone-400 text-center mt-3">
                  By signing in, you agree to our Terms & Privacy Policy
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 mt-4 pt-3 border-t border-stone-100">
              <Sparkles size={12} className="text-amber-500" />
              <span>
                Don&apos;t have an account?{" "}
                <button className="text-amber-600 hover:text-amber-700 font-semibold transition-colors">
                  Create one
                </button>
              </span>
            </div>
          </div>
        </>
      )}

      {/* State 3: Broker Selection */}
      {panelState === "select-broker" && (
        <>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Back
              </span>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf8f4]">
            <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-white" />
            </div>

            <h3 className="text-lg font-serif text-stone-900 mb-1">
              Connect your Broker
            </h3>
            <p className="text-sm text-stone-500 mb-6 text-center">
              Link your brokerage to start trading with real money
            </p>

            <div className="w-full space-y-3">
              {/* Robinhood Button */}
              <Button
                className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-[#CCFF00] hover:border-[#CCFF00] hover:text-black transition-all duration-300 bg-transparent"
                variant="bordered"
                size="lg"
                radius="full"
                startContent={
                  <img
                    src="https://img.logo.dev/robinhood.com?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true"
                    alt="Robinhood"
                    className="w-5 h-5 object-contain rounded-full"
                  />
                }
                onPress={() => handleBrokerSelect("robinhood")}
              >
                Continue with Robinhood
              </Button>

              {/* Webull Button */}
              <Button
                className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-[#1942E0] hover:border-[#1942E0] hover:text-white transition-all duration-300 bg-transparent"
                variant="bordered"
                size="lg"
                radius="full"
                startContent={
                  <img
                    src="https://img.logo.dev/webull.com?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true"
                    alt="Webull"
                    className="w-5 h-5 object-contain rounded-full"
                  />
                }
                onPress={() => handleBrokerSelect("webull")}
              >
                Continue with Webull
              </Button>

              {/* Coinbase Button */}
              <Button
                className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-[#0052FF] hover:border-[#0052FF] hover:text-white transition-all duration-300 bg-transparent"
                variant="bordered"
                size="lg"
                radius="full"
                startContent={
                  <img
                    src="https://img.logo.dev/coinbase.com?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true"
                    alt="Coinbase"
                    className="w-5 h-5 object-contain rounded-full"
                  />
                }
                onPress={() => handleBrokerSelect("coinbase")}
              >
                Continue with Coinbase
              </Button>
            </div>

            <p className="text-xs text-stone-400 mt-6 text-center">
              Your credentials are encrypted end-to-end
            </p>
          </div>
        </>
      )}

      {/* State 4: Broker Connection Flow */}
      {panelState === "connect" && selectedBroker && brokerConfig && (
        <>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Back
              </span>
            </button>
          </div>

          <div className="flex-1 flex flex-col p-6 bg-[#faf8f4]">
            {/* Logo Section with Animated Beams */}
            <div
              ref={connectContainerRef}
              className="relative flex justify-center mb-6"
            >
              <div className="flex items-center gap-10">
                <div
                  ref={quantLogoRef}
                  className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center shadow-lg z-10"
                >
                  <CandlestickChart className="w-8 h-8 text-white" />
                </div>
                <div
                  ref={brokerLogoRef}
                  className="w-14 h-14 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: brokerConfig.brandColor }}
                >
                  <img
                    src={`https://img.logo.dev/${brokerConfig.domain}?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true`}
                    alt={brokerConfig.name}
                    className="w-8 h-8 object-contain rounded-full"
                  />
                </div>
              </div>
              {/* Bi-directional Animated Beams - offset timing for continuous loop effect */}
              <AnimatedBeam
                containerRef={connectContainerRef}
                fromRef={quantLogoRef}
                toRef={brokerLogoRef}
                startYOffset={8}
                endYOffset={8}
                curvature={-15}
                gradientStartColor="#f59e0b"
                gradientStopColor="#d97706"
                pathColor="#e5e7eb"
                pathOpacity={0.3}
                duration={6}
                delay={0}
              />
              <AnimatedBeam
                containerRef={connectContainerRef}
                fromRef={quantLogoRef}
                toRef={brokerLogoRef}
                startYOffset={-8}
                endYOffset={-8}
                curvature={15}
                reverse
                gradientStartColor="#f59e0b"
                gradientStopColor="#d97706"
                pathColor="#e5e7eb"
                pathOpacity={0.3}
                duration={6}
                delay={3}
              />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-serif text-stone-900 mb-1">
                Connect your{" "}
                <span className="font-semibold">{brokerConfig.name}</span>
              </h3>
              <p className="text-sm text-stone-500">
                Here&apos;s how Quant uses this connection:
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-4 flex-1">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Radio size={18} className="text-stone-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm">
                    Trading API Access
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Quant sends buy and sell signals directly to your brokerage
                    for execution.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={18} className="text-stone-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm">
                    Portfolio Sync
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    We read your positions and balances to optimize strategy
                    allocation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-stone-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm">
                    Bank-Level Security
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    256-bit encryption. We never store your credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="mt-6 space-y-3">
              <Button
                className="w-full text-sm font-medium py-6 bg-stone-900 text-white transition-all duration-300 shadow-lg"
                radius="lg"
                size="lg"
                onPress={handleContinue}
                isLoading={isSnapTradeLoading}
              >
                Connect with {brokerConfig?.name || "Broker"}
              </Button>
              <p className="text-center text-xs text-stone-400">
                Don&apos;t have an account?{" "}
                <button className="text-amber-600 hover:text-amber-700 font-medium">
                  Create one <ChevronRight size={12} className="inline" />
                </button>
              </p>
            </div>
          </div>
        </>
      )}

      {/* State 5: Authenticating with Exchange */}
      {panelState === "authenticating" && selectedBroker && brokerConfig && (
        <>
          <div className="p-4 border-b border-stone-100 flex items-center justify-center bg-[#f7f5f1]">
            <span className="font-medium text-stone-700">Connecting...</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#faf8f4]">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center shadow-lg z-10">
                <Logo size={24} className="text-white" />
              </div>
              <div className="w-8 h-0.5 bg-stone-200 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-transparent animate-pulse" />
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                style={{ backgroundColor: brokerConfig.brandColor }}
              >
                <img
                  src={`https://img.logo.dev/${brokerConfig.domain}?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true`}
                  alt={brokerConfig.name}
                  className="w-8 h-8 object-contain rounded-full"
                />
              </div>
            </div>

            <Spinner size="lg" color="warning" className="mb-4" />

            <h3 className="text-lg font-serif text-stone-900 mb-2">
              Connecting to {brokerConfig.name}
            </h3>
            <p className="text-sm text-stone-500 text-center">
              Please complete the authorization in the popup window...
            </p>

            {snapTradeError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-xs text-red-600">{snapTradeError}</p>
                <Button
                  size="sm"
                  variant="light"
                  className="text-red-500"
                  onPress={() => {
                    clearError();
                    setPanelState("connect");
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* State 6: Connected - Ready to Trade */}
      {panelState === "connected" && selectedBroker && brokerConfig && (
        <>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  clearError();
                  setSignInError(null);
                  setTradeResult(null);
                  setPanelState("confirm");
                }}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <img
                src={`https://img.logo.dev/${brokerConfig.domain}?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true`}
                alt={brokerConfig.name}
                className="w-6 h-6 object-contain rounded-full"
              />
              <span className="font-medium text-stone-700">
                {brokerConfig.name} Connected
              </span>
              <button
                onClick={() => {
                  setCameFromConnected(true);
                  setPanelState("select-broker");
                }}
                className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
              >
                Switch Brokerage
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 border border-emerald-200 rounded-full">
              <Check size={10} className="text-emerald-600" />
              <span className="text-[10px] font-medium text-emerald-600">
                Ready
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-5 bg-[#faf8f4] overflow-y-auto">
            {/* Strategy Summary */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-serif text-stone-900 mb-2">
                Ready to Automate {strategyName}
              </h3>
              <p className="text-sm text-stone-500">
                on {ticker} with your {brokerConfig.name} account
              </p>
            </div>

            {/* What Automation Does */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Target size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    24/7 Signal Monitoring
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Our AI watches {ticker} around the clock for optimal entry
                    and exit points
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    Instant Execution
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Trades placed directly to {brokerConfig.name} when signals
                    trigger
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    Built-in Risk Management
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Automatic stop-losses protect your downside on every trade
                  </p>
                </div>
              </div>
            </div>

            {/* Trade Result */}
            {tradeResult && (
              <div
                className={`mb-5 p-4 rounded-xl border ${
                  tradeResult.success
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {tradeResult.success ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      tradeResult.success ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {tradeResult.success
                      ? tradeResult.message
                      : tradeResult.error}
                  </p>
                </div>
              </div>
            )}

            {/* Position Size Display */}
            <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Position Size</span>
                <span className="text-lg font-mono font-bold text-stone-900">
                  ${positionSize.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                per trade · set on previous screen
              </p>
            </div>

            {/* Automate Button */}
            <div className="mt-auto space-y-3">
              <Button
                className="w-full bg-stone-900 text-white hover:bg-amber-500 transition-all duration-300 shadow-lg text-sm uppercase tracking-widest py-7"
                size="lg"
                radius="lg"
                startContent={!isExecutingTrade && <Sparkles size={18} />}
                onPress={() => handleExecuteTrade("buy")}
                isLoading={isExecutingTrade}
                isDisabled={isExecutingTrade}
              >
                Start Automating {ticker}
              </Button>

              <p className="text-center text-[10px] text-stone-400">
                You can pause or stop automation anytime from your dashboard
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
