"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useSession, useAuth } from "@/contexts/auth-context";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Checkbox } from "@heroui/checkbox";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Link } from "@heroui/link";
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
  Landmark,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/icons";
import { useSnapTrade } from "@/hooks/use-snaptrade";
import { useCoinbase } from "@/hooks/use-coinbase";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import NextSteps from "@/components/next-steps";

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
type TradeType = "recurring" | "one-time";

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
  tradeType?: TradeType;
  onClose?: () => void;
}

export interface StrategyConfirmationPanelRef {
  goBack: () => boolean; // Returns true if back navigation happened, false if should close panel
}

// Storage key for persisting confirmation panel state
const PANEL_STORAGE_KEY = "quant_confirmation_panel_state";

interface PanelPersistedState {
  panelState: PanelState;
  selectedBroker: BrokerType | null;
  tradingMode: TradingMode;
  positionSize: number;
  ticker: string;
  tradeType: TradeType;
  capEnabled: boolean;
  capAmount: number;
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

export const StrategyConfirmationPanel = forwardRef<
  StrategyConfirmationPanelRef,
  StrategyConfirmationPanelProps
>(
  (
    {
      onConnectionComplete,
      onPaperTrade,
      onTradeExecuted,
      ticker = "AAPL",
      strategyName = "Trend Pullback",
      tradeType = "recurring",
      onClose,
    },
    ref,
  ) => {
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
    const getAccountBrokerName = (
      acc: (typeof snapTradeAccounts)[0],
    ): string => {
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
        return persistedState.current.positionSize ?? 0;
      }
      return 0;
    });
    const [capEnabled, setCapEnabled] = useState<boolean>(() => {
      if (persistedState.current?.ticker === ticker) {
        return persistedState.current.capEnabled ?? false;
      }
      return false;
    });
    const [capAmount, setCapAmount] = useState<number>(() => {
      if (persistedState.current?.ticker === ticker) {
        return persistedState.current.capAmount ?? 0;
      }
      return 0;
    });
    const [isPositionSizeFocused, setIsPositionSizeFocused] = useState(false);
    const [positionSizeInput, setPositionSizeInput] = useState<string>("");
    const [isExecutingTrade, setIsExecutingTrade] = useState(false);
    const [tradeResult, setTradeResult] = useState<{
      success: boolean;
      message?: string;
      error?: string;
    } | null>(null);
    const [cameFromConnected, setCameFromConnected] = useState(false);
    const [confirmationMode, setConfirmationMode] = useState<
      "paper" | "real" | null
    >(null);

    // Sign-in form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [signInError, setSignInError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = React.useState<string | number>(
      "login",
    );
    const [name, setName] = useState("");

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
        tradeType,
        capEnabled,
        capAmount,
      });
    }, [
      panelState,
      selectedBroker,
      tradingMode,
      positionSize,
      ticker,
      tradeType,
      capEnabled,
      capAmount,
    ]);

    // Check URL params for connection callback
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("snaptrade") === "connected") {
        // User just came back from SnapTrade connection
        checkConnection();
        setPanelState("confirm");
        setConfirmationMode("real");
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
        setPanelState("confirm");
        setConfirmationMode("real");
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
        setPanelState("confirm");
        setConfirmationMode("real");
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

      if (panelState === "confirm" && confirmationMode) {
        setConfirmationMode(null);
        return true; // Still in confirm state, just cleared mode - navigation happened
      }

      if (panelState === "connect") {
        setPanelState("select-broker");
        setSelectedBroker(null);
        return true;
      } else if (panelState === "select-broker") {
        // If user came from connected state (via Switch Brokerage), go back there
        if (cameFromConnected) {
          const connectedBroker = getConnectedBroker();
          if (connectedBroker) {
            setSelectedBroker(connectedBroker);
            setPanelState("confirm");
            setConfirmationMode("real");
            setCameFromConnected(false);
            return true;
          }
        }
        if (tradingMode === "real") {
          setPanelState("confirm");
          setConfirmationMode("real");
          return true;
        } else {
          setPanelState("sign-in");
          return true;
        }
      } else if (panelState === "sign-in") {
        setPanelState("confirm");
        setConfirmationMode(null); // Reset mode when going back to confirm
        setTradingMode(null);
        return true;
      }

      // If we're at the initial confirm state with no mode and no confirmationMode, return false to indicate should close
      if (panelState === "confirm" && !confirmationMode) {
        return false;
      }

      return true; // Default: navigation happened
    };

    // Expose goBack function via ref
    useImperativeHandle(ref, () => ({
      goBack: () => {
        return handleBack();
      },
    }));

    const handleRealTrading = async () => {
      if (confirmationMode !== "real") {
        setConfirmationMode("real");
        return;
      }

      setTradingMode("real");
      // Use actual session state instead of prop
      if (!session) {
        setPanelState("sign-in");
      } else {
        // Check if already connected to any broker
        const connectedBroker = getConnectedBroker();
        if (connectedBroker) {
          setSelectedBroker(connectedBroker);
          await handleExecuteTrade("buy");
        } else {
          setPanelState("select-broker");
        }
      }
    };

    const handlePaperTrading = () => {
      if (confirmationMode !== "paper") {
        setConfirmationMode("paper");
        return;
      }

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

    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    
    const handleGoogleSignIn = async () => {
      setIsGoogleLoading(true);
      setSignInError(null);
      try {
        await signInWithGoogle();
        // After successful sign-in, proceed to next state
        if (tradingMode === "real") {
          setPanelState("select-broker");
        } else if (tradingMode === "paper") {
          if (onPaperTrade) {
            onPaperTrade();
          }
        }
      } catch {
        setSignInError("Failed to sign in with Google. Please try again.");
        setIsGoogleLoading(false);
      }
    };

    const handleAppleSignIn = async () => {
      // Placeholder for Apple Sign In
      if (tradingMode === "real") {
        setPanelState("select-broker");
      } else if (tradingMode === "paper") {
        if (onPaperTrade) {
          onPaperTrade();
        }
      }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || !password) {
        setSignInError("Please enter both email and password.");
        return;
      }

      setIsEmailLoading(true);
      setSignInError(null);

      try {
        const isSignUp = selectedTab === "signup";
        if (isSignUp) {
          await signUpWithEmail(email, password);
        } else {
          await signInWithEmail(email, password);
        }
        
        // After successful sign-in, proceed based on trading mode
        if (tradingMode === "real") {
          setPanelState("select-broker");
        } else if (tradingMode === "paper") {
          if (onPaperTrade) {
            onPaperTrade();
          }
        }
      } catch (err: any) {
        const errorMessage =
          err.code === "auth/user-not-found"
            ? "No account found with this email."
            : err.code === "auth/wrong-password"
            ? "Incorrect password. Please try again."
            : err.code === "auth/email-already-in-use"
            ? "An account with this email already exists."
            : err.code === "auth/weak-password"
            ? "Password should be at least 6 characters."
            : err.code === "auth/invalid-email"
            ? "Invalid email address."
            : "An error occurred. Please try again.";
        setSignInError(errorMessage);
        setIsEmailLoading(false);
      }
    };

    const brokerConfig = selectedBroker ? BROKER_CONFIG[selectedBroker] : null;

    // Calculate risk based on position size (simplified example)
    const maxRisk = Math.round(positionSize * 0.05); // 5% max risk example

    // Helper to calculate font size based on number length
    const getFontSize = (value: number): string => {
      const str = value.toString();
      const length = str.length;
      if (length <= 3) return "text-8xl"; // $9,999 or less
      if (length <= 4) return "text-7xl"; // $9,999 or less
      if (length <= 5) return "text-6xl"; // $9,999 or less
      if (length <= 6) return "text-5xl"; // $999,999 or less
      return "text-4xl"; // Larger numbers
    };

    // Helper to calculate slightly smaller font size for dollar sign
    const getDollarSignSize = (value: number): string => {
      const str = value.toString();
      const length = str.length;
      if (length <= 3) return "text-7xl"; // Slightly smaller than text-8xl
      if (length <= 4) return "text-6xl"; // Slightly smaller than text-7xl
      if (length <= 5) return "text-5xl"; // Slightly smaller than text-6xl
      if (length <= 6) return "text-4xl"; // Slightly smaller than text-5xl
      return "text-3xl"; // Slightly smaller than text-4xl
    };

    // Format position size for display
    const formatPositionSize = (value: number): string => {
      if (value === 0) return "";
      return value.toLocaleString();
    };

    // Handle position size input change
    const handlePositionSizeChange = (value: string) => {
      // Remove all non-digit characters (including commas)
      const cleaned = value.replace(/[^\d]/g, "");
      setPositionSizeInput(cleaned);

      const numValue = cleaned === "" ? 0 : parseInt(cleaned, 10);
      setPositionSize(numValue);
    };

    // Format input value with commas for display
    const formatInputWithCommas = (value: string): string => {
      if (!value) return "";
      const numValue = parseInt(value.replace(/[^\d]/g, ""), 10);
      if (isNaN(numValue) || numValue === 0) return "";
      return numValue.toLocaleString();
    };

    // Handle focus/blur for position size input
    const handlePositionSizeFocus = () => {
      setIsPositionSizeFocused(true);
      setPositionSizeInput(positionSize === 0 ? "" : positionSize.toString());
    };

    const handlePositionSizeBlur = () => {
      setIsPositionSizeFocused(false);
      setPositionSizeInput("");
    };

    return (
      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg shadow-stone-200/50 bg-white">
        {/* State 1: Strategy Confirmation & Position Sizing */}
        {panelState === "confirm" && (
          <>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#f7f5f1]">
              {/* Back button - only visible on mobile */}
              <Button
                isIconOnly
                variant="light"
                className="md:hidden"
                onPress={() => {
                  const navigated = handleBack();
                  if (!navigated && onClose) {
                    onClose();
                  }
                }}
              >
                <ArrowLeft size={16} />
              </Button>
              <div className="flex items-center gap-3 md:mx-0 md:ml-0 justify-center w-full -ml-8">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-stone-700">
                  Ready to Trade
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-5 bg-[#faf8f4] overflow-y-auto">
              {/* Position Size Section */}
              <div className="mb-6">
                {/* Large Input Field */}
                <div className="flex items-baseline justify-start mb-6">
                  <div className="relative flex items-baseline">
                    <span
                      className={`${getDollarSignSize(positionSize)} text-stone-900 font-mono font-bold mr-1 flex-shrink-0`}
                    >
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        isPositionSizeFocused
                          ? formatInputWithCommas(positionSizeInput)
                          : formatPositionSize(positionSize)
                      }
                      onChange={(e) => handlePositionSizeChange(e.target.value)}
                      onFocus={handlePositionSizeFocus}
                      onBlur={handlePositionSizeBlur}
                      className={`${getFontSize(positionSize)} font-mono font-bold text-stone-900 bg-transparent border-none outline-none focus:outline-none text-left`}
                      style={{
                        width: `${Math.max(1, (isPositionSizeFocused ? formatInputWithCommas(positionSizeInput) : formatPositionSize(positionSize)).length)}ch`,
                      }}
                      placeholder="0"
                    />
                    {tradeType === "recurring" && (
                      <span className="text-sm text-stone-400 ml-2 flex-shrink-0">
                        per trade
                      </span>
                    )}
                  </div>
                </div>

                {/* Cap Switch (Recurring Only) */}
                {tradeType === "recurring" && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-700">
                          Set maximum cap
                        </span>
                        <span className="text-xs text-stone-500 mt-0.5">
                          Limit total investment amount
                        </span>
                      </div>
                      <Switch
                        isSelected={capEnabled}
                        onValueChange={setCapEnabled}
                        size="md"
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-amber-500",
                        }}
                      />
                    </div>

                    <AnimatePresence>
                      {capEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2">
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={formatPositionSize(capAmount)}
                              onValueChange={(value) => {
                                const cleaned = value.replace(/[^\d]/g, "");
                                const numValue =
                                  cleaned === "" ? 0 : parseInt(cleaned, 10);
                                setCapAmount(numValue);
                              }}
                              startContent={
                                <span className="text-stone-600 font-medium">
                                  $
                                </span>
                              }
                              placeholder="0"
                              variant="bordered"
                              size="md"
                              radius="lg"
                              classNames={{
                                base: "w-full",
                                input: "text-base font-medium",
                                inputWrapper:
                                  "bg-white border-stone-200 hover:border-stone-300 focus-within:border-amber-500",
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Pay with Button*/}
                <div className="">
                  <Button
                    variant="light"
                    className="w-full justify-start py-8 hover:bg-stone-100"
                    startContent={
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Landmark size={20} className="text-stone-600" />
                      </div>
                    }
                    onPress={() => {
                      setTradingMode("real");
                      setPanelState("sign-in");
                    }}
                  >
                    <div className="flex flex-col items-start gap-0.5 ml-3">
                      <span className="text-base font-medium text-stone-900">
                        Pay with
                      </span>
                      <span className="text-xs text-stone-500">
                        {selectedBroker
                          ? BROKER_CONFIG[selectedBroker].name
                          : getConnectedBroker()
                            ? BROKER_CONFIG[getConnectedBroker()!].name
                            : "Select Broker"}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* What to Expect */}
              <div className="mb-5">
                <NextSteps ticker={ticker} />
              </div>

              {/* Trade Result */}
              {tradeResult && (
                <div
                  className={`mb-3 p-2 rounded-lg border ${
                    tradeResult.success
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tradeResult.success ? (
                      <Check
                        size={14}
                        className="text-emerald-600 flex-shrink-0"
                      />
                    ) : (
                      <AlertCircle
                        size={14}
                        className="text-red-500 flex-shrink-0"
                      />
                    )}
                    <p
                      className={`text-xs font-medium line-clamp-2 ${
                        tradeResult.success
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {tradeResult.success
                        ? tradeResult.message
                        : tradeResult.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto">
                {/* Risk Warning - Hidden on mobile, shown above buttons on larger screens */}
                <div className="hidden md:block bg-amber-50 rounded-lg p-3 border border-amber-100 mb-5">
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
                <div className="flex gap-3 relative">
                  {/* Paper Trade Button */}
                  <motion.div
                    layout
                    initial={false}
                    animate={{
                      flex: confirmationMode === "real" ? 0 : 1,
                      width: confirmationMode === "real" ? 0 : "auto",
                      opacity: confirmationMode === "real" ? 0 : 1,
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="min-w-0 overflow-hidden"
                    style={{
                      pointerEvents:
                        confirmationMode === "real" ? "none" : "auto",
                    }}
                  >
                    <Button
                      className={`w-full text-xs uppercase tracking-widest transition-all duration-300 ${
                        confirmationMode === "paper"
                          ? "border-stone-300 text-stone-700 hover:bg-stone-100 bg-transparent hover:border-amber-500 hover:text-amber-600"
                          : "border-stone-300 text-stone-700 hover:bg-stone-100 bg-transparent"
                      }`}
                      variant="bordered"
                      size="lg"
                      radius="lg"
                      onPress={handlePaperTrading}
                    >
                      {confirmationMode === "paper" ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <Sparkles size={16} />
                          <span className="font-bold">
                            Start Automating {ticker}
                          </span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <PlayCircle size={16} />
                          <span>Paper Trade</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  {/* Real Cash Button */}
                  <motion.div
                    layout
                    initial={false}
                    animate={{
                      flex: confirmationMode === "paper" ? 0 : 1,
                      width: confirmationMode === "paper" ? 0 : "auto",
                      opacity: confirmationMode === "paper" ? 0 : 1,
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="min-w-0 overflow-hidden"
                    style={{
                      pointerEvents:
                        confirmationMode === "paper" ? "none" : "auto",
                    }}
                  >
                    <Button
                      className={`w-full text-xs uppercase tracking-widest transition-all duration-300 ${
                        confirmationMode === "real"
                          ? "bg-stone-900 text-white hover:bg-amber-500 hover:text-stone-900 border-stone-900"
                          : "bg-stone-900 text-white hover:bg-amber-600 shadow-lg"
                      }`}
                      size="lg"
                      radius="lg"
                      onPress={handleRealTrading}
                      isLoading={
                        confirmationMode === "real" &&
                        (isSnapTradeInitializing || isExecutingTrade)
                      }
                      isDisabled={
                        confirmationMode === "real" &&
                        (isSnapTradeInitializing || isExecutingTrade)
                      }
                    >
                      {confirmationMode === "real" ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {!isExecutingTrade && !isSnapTradeInitializing && (
                            <Sparkles size={16} />
                          )}
                          <span className="font-bold">
                            Start Automating {ticker}
                          </span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          {!isSnapTradeInitializing && <DollarSign size={16} />}
                          <span>Real Cash</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </div>

                <div className="h-6 flex items-center justify-center mt-3">
                  {!confirmationMode ? (
                    <p className="text-center text-[10px] text-stone-400 leading-tight">
                      Paper trading uses fake money to test your strategy
                      risk-free
                    </p>
                  ) : (
                    <Button
                      variant="light"
                      size="sm"
                      color="danger"
                      className="text-[10px] h-auto py-1 px-3 min-w-0 font-medium"
                      onPress={() => setConfirmationMode(null)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* State 2: Sign In / Sign Up */}
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
              <div className="flex flex-col w-full">
                <div className="flex flex-col items-center mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Logo size={20} className="text-stone-900" />
                    <span className="text-sm tracking-[0.2em] uppercase font-medium text-stone-900">
                      Quant
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 text-center">
                    {selectedTab === "login"
                      ? "Welcome back"
                      : "Create your account"}
                  </p>
                </div>

                {signInError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center mb-4">
                    {signInError}
                  </div>
                )}

                <Tabs
                  fullWidth
                  aria-label="Sign in options"
                  selectedKey={selectedTab}
                  size="md"
                  onSelectionChange={setSelectedTab}
                  classNames={{
                    cursor: "bg-stone-900 shadow-md",
                    tabContent:
                      "group-data-[selected=true]:text-white font-medium text-stone-500",
                    panel: "pt-4",
                  }}
                >
                  <Tab key="login" title="Login">
                    <div className="flex flex-col gap-4">
                      <Button
                        className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent"
                        variant="bordered"
                        size="lg"
                        radius="lg"
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

                      <Button
                        className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent"
                        variant="bordered"
                        size="lg"
                        radius="lg"
                        startContent={
                          <svg
                            className="w-4 h-4"
                            fill="#000000"
                            viewBox="0 0 24 24 "
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g
                              id="SVGRepo_tracerCarrier"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                              {" "}
                              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"></path>{" "}
                            </g>
                          </svg>
                        }
                        onPress={handleAppleSignIn}
                        isDisabled={isLoading}
                      >
                        Continue with Apple
                      </Button>

                      <div className="flex items-center gap-4">
                        <Divider className="flex-1 bg-stone-200" />
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
                          or
                        </span>
                        <Divider className="flex-1 bg-stone-200" />
                      </div>

                      <form
                        onSubmit={handleEmailSignIn}
                        className="flex flex-col gap-2"
                      >
                        <Input
                          type="email"
                          label="Email"
                          value={email}
                          onValueChange={setEmail}
                          startContent={
                            <Mail
                              size={16}
                              className="text-stone-400 flex-shrink-0"
                            />
                          }
                          variant="bordered"
                          size="md"
                          radius="lg"
                          isDisabled={isLoading}
                          classNames={{
                            inputWrapper:
                              "bg-transparent border border-stone-300",
                          }}
                        />

                        <Input
                          type={isPasswordVisible ? "text" : "password"}
                          label="Password"
                          value={password}
                          onValueChange={setPassword}
                          startContent={
                            <Lock size={16} className="text-stone-400" />
                          }
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
                            inputWrapper:
                              "bg-transparent border border-stone-300 ",
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
                          <Link
                            as="button"
                            size="sm"
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer"
                          >
                            Forgot password?
                          </Link>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-lg mt-2"
                          size="lg"
                          radius="lg"
                          endContent={
                            !isEmailLoading && <ArrowRight size={16} />
                          }
                          isLoading={isEmailLoading}
                          isDisabled={isLoading}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">
                            Login
                          </span>
                        </Button>
                      </form>
                    </div>
                  </Tab>
                  <Tab key="sign-up" title="Sign up">
                    <div className="flex flex-col gap-4">
                      <Button
                        className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent"
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

                      <Button
                        className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent"
                        variant="bordered"
                        size="lg"
                        radius="full"
                        startContent={
                          <svg
                            className="w-4 h-4"
                            fill="#000000"
                            viewBox="0 0 24 24 "
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g
                              id="SVGRepo_tracerCarrier"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                              {" "}
                              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"></path>{" "}
                            </g>
                          </svg>
                        }
                        onPress={handleAppleSignIn}
                        isDisabled={isLoading}
                      >
                        Continue with Apple
                      </Button>

                      <div className="flex items-center gap-4">
                        <Divider className="flex-1 bg-stone-200" />
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
                          or
                        </span>
                        <Divider className="flex-1 bg-stone-200" />
                      </div>

                      <form
                        onSubmit={handleEmailSignIn}
                        className="flex flex-col gap-2"
                      >
                        <Input
                          type="text"
                          label="Name"
                          value={name}
                          onValueChange={setName}
                          startContent={
                            <UserCircle
                              size={16}
                              className="text-stone-400 flex-shrink-0"
                            />
                          }
                          variant="bordered"
                          size="md"
                          radius="lg"
                          isDisabled={isLoading}
                          classNames={{
                            inputWrapper:
                              "bg-transparent border border-stone-300",
                          }}
                          className=""
                        />
                        <Input
                          type="email"
                          label="Email"
                          value={email}
                          onValueChange={setEmail}
                          startContent={
                            <Mail
                              size={16}
                              className="text-stone-400 flex-shrink-0"
                            />
                          }
                          variant="bordered"
                          size="md"
                          radius="lg"
                          isDisabled={isLoading}
                          classNames={{
                            inputWrapper:
                              "bg-transparent border border-stone-300",
                          }}
                        />

                        <Input
                          type={isPasswordVisible ? "text" : "password"}
                          label="Password"
                          value={password}
                          onValueChange={setPassword}
                          startContent={
                            <Lock size={16} className="text-stone-400" />
                          }
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
                            inputWrapper:
                              "bg-transparent border border-stone-300",
                          }}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-lg mt-2"
                          size="lg"
                          radius="lg"
                          endContent={
                            !isEmailLoading && <ArrowRight size={16} />
                          }
                          isLoading={isEmailLoading}
                          isDisabled={isLoading}
                        >
                          <span className="text-sm font-medium uppercase tracking-wider">
                            Sign up
                          </span>
                        </Button>
                      </form>
                    </div>
                  </Tab>
                </Tabs>
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
                      Quant sends buy and sell signals directly to your
                      brokerage for execution.
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
                  className={`mb-3 p-2 rounded-lg border ${
                    tradeResult.success
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tradeResult.success ? (
                      <Check
                        size={14}
                        className="text-emerald-600 flex-shrink-0"
                      />
                    ) : (
                      <AlertCircle
                        size={14}
                        className="text-red-500 flex-shrink-0"
                      />
                    )}
                    <p
                      className={`text-xs font-medium line-clamp-2 ${
                        tradeResult.success
                          ? "text-emerald-700"
                          : "text-red-700"
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-mono font-bold text-stone-900">
                      ${positionSize.toLocaleString()}
                    </span>
                    {tradeType === "recurring" && (
                      <span className="text-xs text-stone-400">per trade</span>
                    )}
                  </div>
                </div>
                {capEnabled && tradeType === "recurring" && (
                  <p className="text-xs text-stone-400 mt-1">
                    Cap: ${capAmount.toLocaleString()} · set on previous screen
                  </p>
                )}
                {(!capEnabled || tradeType === "one-time") && (
                  <p className="text-xs text-stone-400 mt-1">
                    Set on previous screen
                  </p>
                )}
              </div>

              {/* Automate Button */}
              <div className="mt-auto space-y-3">
                <Button
                  className="w-full bg-stone-900 text-white hover:bg-amber-500 transition-all duration-300 shadow-lg text-xs uppercase tracking-widest"
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
  },
);

StrategyConfirmationPanel.displayName = "StrategyConfirmationPanel";
