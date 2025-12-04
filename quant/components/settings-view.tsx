"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import {
  User,
  Link2,
  Bell,
  LogOut,
  Check,
  ChevronRight,
  Shield,
  Wallet,
  AlertCircle,
  RefreshCw,
  Building2,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { ExpandableButton } from "@/components/ui/expandable-button";
import { useCoinbase } from "@/hooks/use-coinbase";
import { useSnapTrade } from "@/hooks/use-snaptrade";

// Map brokerage names to their domains for logo.dev
const BROKERAGE_DOMAINS: Record<string, string> = {
  Robinhood: "robinhood.com",
  Webull: "webull.com",
  Coinbase: "coinbase.com",
  Fidelity: "fidelity.com",
  "E*TRADE": "etrade.com",
  "Charles Schwab": "schwab.com",
  Schwab: "schwab.com",
  "Interactive Brokers": "interactivebrokers.com",
  IBKR: "interactivebrokers.com",
  "TD Ameritrade": "tdameritrade.com",
  Alpaca: "alpaca.markets",
  Tradier: "tradier.com",
  Tastytrade: "tastytrade.com",
  TradeStation: "tradestation.com",
};

function getBrokerageDomain(brokerageName: string): string {
  return (
    BROKERAGE_DOMAINS[brokerageName] ||
    `${brokerageName.toLowerCase().replace(/\s+/g, "")}.com`
  );
}

interface SettingsViewProps {
  onGoHome?: () => void;
}

export function SettingsView({ onGoHome }: SettingsViewProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // SnapTrade integration (primary - supports multiple brokerages)
  const {
    isConnected: isSnapTradeConnected,
    isLoading: isSnapTradeLoading,
    error: snapTradeError,
    accounts: snapTradeAccounts,
    brokerages,
    connect: connectSnapTrade,
    fetchAccounts: refreshSnapTradeAccounts,
    clearError: clearSnapTradeError,
  } = useSnapTrade();

  // Coinbase integration (for crypto - uses OAuth)
  const {
    isConnected: isCoinbaseConnected,
    isLoading: isCoinbaseLoading,
    error: coinbaseError,
    user: coinbaseUser,
    accounts: coinbaseAccounts,
    connect: connectCoinbase,
    disconnect: disconnectCoinbase,
    fetchAccounts: refreshCoinbaseAccounts,
    clearError: clearCoinbaseError,
  } = useCoinbase();

  // Check if user just connected via SnapTrade
  useEffect(() => {
    if (searchParams.get("snaptrade") === "connected") {
      refreshSnapTradeAccounts();
      // Clear the query param
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, refreshSnapTradeAccounts]);

  const [notifications, setNotifications] = useState({
    tradeExecutions: true,
    priceAlerts: true,
    portfolioUpdates: false,
    weeklyReports: true,
  });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Calculate total Coinbase portfolio value
  const coinbaseTotalUSD = coinbaseAccounts.filter(
    (acc) => acc.isCrypto && parseFloat(acc.balance) > 0,
  ).length;

  return (
    <div className="w-full h-screen bg-[#fdfbf7] flex flex-col relative overflow-y-auto">
      {/* Background Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header with Logo */}
      <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50 text-stone-900">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={onGoHome}
        >
          <Logo size={20} className="text-stone-900" />
          <span className="text-sm tracking-[0.2em] uppercase font-medium">
            Quant
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-32 pb-16 px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl space-y-6"
        >
          {/* Page Title */}
          <div className="text-center mb-8 relative">
            <button
              onClick={() => router.back()}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span className="text-xs font-medium uppercase tracking-wider">
                Back
              </span>
            </button>
            <h1 className="text-4xl font-serif text-stone-900 mb-2">
              Settings
            </h1>
            <p className="text-stone-500 text-sm">
              Manage your account and preferences
            </p>
          </div>

          {/* Profile Section */}
          <Card className="p-6 bg-white shadow-lg shadow-stone-200/50 border border-stone-100">
            <div className="flex items-center gap-2 mb-6 justify-between">
              <div className="flex items-center gap-2">
                <User size={18} className="text-stone-500" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-500">
                  Profile
                </h2>
              </div>
              <ExpandableButton
                label="Edit Profile"
                icon={Pencil}
                onClick={() => {}}
              />
            </div>

            <div className="flex items-center gap-6">
              <Avatar
                src={session?.user?.image || undefined}
                name={session?.user?.name || "User"}
                size="lg"
                className="w-20 h-20 text-large border-2 border-stone-200"
                showFallback
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-serif">
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                }
              />
              <div className="flex-1">
                <h3 className="text-2xl font-serif text-stone-900">
                  {session?.user?.name || "User"}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-stone-500 text-sm">
                    {session?.user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>
                <p className="text-stone-400 text-xs mt-1">
                  Joined{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Exchange Connections */}
          <Card className="p-6 bg-white shadow-lg shadow-stone-200/50 border border-stone-100">
            <div className="flex items-center gap-2 mb-6 justify-between">
              <div className="flex items-center gap-2">
                <Link2 size={18} className="text-stone-500" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-500">
                  Brokerage Connections
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshSnapTradeAccounts}
                  disabled={isSnapTradeLoading}
                  className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw
                    size={12}
                    className={`text-stone-500 ${isSnapTradeLoading ? "animate-spin" : ""}`}
                  />
                </button>
                <ExpandableButton
                  label="Add More"
                  onClick={() => connectSnapTrade()}
                  disabled={isSnapTradeLoading}
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* SnapTrade - Multiple Brokerages */}
              {snapTradeError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle
                    size={16}
                    className="text-red-500 flex-shrink-0"
                  />
                  <p className="text-xs text-red-600 flex-1">
                    {snapTradeError}
                  </p>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-red-500 text-xs"
                    onPress={clearSnapTradeError}
                  >
                    Dismiss
                  </Button>
                </motion.div>
              )}

              {isSnapTradeConnected && snapTradeAccounts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  {/* Connected account cards */}
                  <div className="space-y-3">
                    {snapTradeAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-2xl border border-stone-200 hover:border-amber-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={`https://img.logo.dev/${getBrokerageDomain(account.brokerageName)}?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true`}
                              alt={account.brokerageName}
                              className="w-10 h-10 rounded-xl object-contain bg-white border border-stone-100"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check size={8} className="text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-stone-900">
                              {account.brokerageName}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {account.name} • {account.number}
                            </p>
                          </div>
                        </div>
                        {account.balance && (
                          <div className="text-right">
                            <p className="text-lg font-semibold text-stone-900 font-mono">
                              $
                              {(
                                account.balance.cash ??
                                account.balance.total ??
                                0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                              {account.balance.cash !== undefined
                                ? "Buying Power"
                                : "Total Value"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl border border-stone-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900 mb-1">
                        Connect Your Brokerage
                      </h3>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Link your Fidelity, E*TRADE, Schwab, Interactive
                        Brokers, or other brokerage to enable automated trading.
                      </p>
                    </div>
                  </div>

                  {/* Popular brokerages */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Fidelity", "E*TRADE", "Schwab", "IBKR", "Webull"].map(
                      (name) => (
                        <span
                          key={name}
                          className="px-2 py-1 bg-white rounded-full border border-stone-200 text-[10px] font-medium text-stone-600"
                        >
                          {name}
                        </span>
                      ),
                    )}
                    <span className="px-2 py-1 bg-amber-100 rounded-full border border-amber-200 text-[10px] font-medium text-amber-700">
                      +20 more
                    </span>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                    size="lg"
                    radius="lg"
                    startContent={
                      !isSnapTradeLoading && <Building2 size={18} />
                    }
                    onPress={() => connectSnapTrade()}
                    isLoading={isSnapTradeLoading}
                  >
                    Connect Brokerage
                  </Button>

                  <p className="text-center text-[10px] text-stone-400 mt-3">
                    Secure connection via SnapTrade • Bank-level encryption
                  </p>
                </div>
              )}

              <Divider className="my-2" />

              <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-2">
                Crypto Exchanges
              </p>

              {/* Coinbase */}
              {coinbaseError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-2"
                >
                  <AlertCircle
                    size={16}
                    className="text-red-500 flex-shrink-0"
                  />
                  <p className="text-xs text-red-600 flex-1">{coinbaseError}</p>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-red-500 text-xs"
                    onPress={clearCoinbaseError}
                  >
                    Dismiss
                  </Button>
                </motion.div>
              )}

              {isCoinbaseConnected ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-[#0052FF]/10 to-[#0052FF]/5 rounded-2xl border border-[#0052FF]/20 hover:border-[#0052FF]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://img.logo.dev/coinbase.com?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true"
                        alt="Coinbase"
                        className="w-10 h-10 object-contain rounded-full"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check size={8} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        Coinbase
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {coinbaseUser?.name || "Crypto Exchange"}
                        {coinbaseTotalUSD > 0 &&
                          ` • ${coinbaseTotalUSD} wallet${coinbaseTotalUSD > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pl-3">
                    <button
                      onClick={refreshCoinbaseAccounts}
                      disabled={isCoinbaseLoading}
                      className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-all duration-200 disabled:opacity-50"
                    >
                      <RefreshCw
                        size={12}
                        className={`text-stone-500 ${isCoinbaseLoading ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      onClick={disconnectCoinbase}
                      disabled={isCoinbaseLoading}
                      className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
                    >
                      <LogOut size={12} className="text-red-500" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <Button
                  className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-[#0052FF] hover:border-[#0052FF] hover:text-white transition-all duration-300 bg-transparent"
                  variant="bordered"
                  size="lg"
                  radius="full"
                  startContent={
                    isCoinbaseLoading ? (
                      <Spinner size="sm" color="current" />
                    ) : (
                      <img
                        src="https://img.logo.dev/coinbase.com?token=pk_RZs6nh7dTBSce8pi4IKWbg&size=64&retina=true"
                        alt="Coinbase"
                        className="w-5 h-5 object-contain rounded-full"
                      />
                    )
                  }
                  onPress={connectCoinbase}
                  isDisabled={isCoinbaseLoading}
                >
                  {isCoinbaseLoading ? "Connecting..." : "Connect Coinbase"}
                </Button>
              )}
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 mt-6 p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl">
              <Shield
                size={18}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs text-amber-800 font-medium">
                  Your credentials are encrypted end-to-end
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  We never store your exchange passwords. Only read-only API
                  access is required for portfolio syncing.
                </p>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6 bg-white shadow-lg shadow-stone-200/50 border border-stone-100">
            <div className="flex items-center gap-2 mb-6">
              <Bell size={18} className="text-stone-500" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-500">
                Notification Preferences
              </h2>
            </div>

            <div className="space-y-1">
              {[
                {
                  key: "tradeExecutions",
                  label: "Trade Executions",
                  description: "Get notified when trades are executed",
                },
                {
                  key: "priceAlerts",
                  label: "Price Alerts",
                  description: "Receive alerts when price targets are hit",
                },
                {
                  key: "portfolioUpdates",
                  label: "Portfolio Updates",
                  description: "Daily summary of portfolio performance",
                },
                {
                  key: "weeklyReports",
                  label: "Weekly Reports",
                  description: "Comprehensive weekly trading analysis",
                },
              ].map((item, index) => (
                <React.Fragment key={item.key}>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-medium text-stone-900">
                        {item.label}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      isSelected={
                        notifications[item.key as keyof typeof notifications]
                      }
                      onValueChange={(value) =>
                        setNotifications({
                          ...notifications,
                          [item.key]: value,
                        })
                      }
                      size="sm"
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-amber-500",
                      }}
                    />
                  </div>
                  {index < 3 && <Divider className="bg-stone-100" />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="p-6 bg-white shadow-lg shadow-stone-200/50 border border-stone-100">
            <div className="flex items-center gap-2 mb-6">
              <Wallet size={18} className="text-stone-500" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-500">
                Account
              </h2>
            </div>

            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-[#f7f5f1] rounded-xl border border-stone-100 hover:border-stone-200 transition-colors group">
                <span className="text-stone-700 font-medium">
                  Subscription & Billing
                </span>
                <ChevronRight
                  size={18}
                  className="text-stone-400 group-hover:text-stone-600 transition-colors"
                />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-[#f7f5f1] rounded-xl border border-stone-100 hover:border-stone-200 transition-colors group">
                <span className="text-stone-700 font-medium">
                  Security & Privacy
                </span>
                <ChevronRight
                  size={18}
                  className="text-stone-400 group-hover:text-stone-600 transition-colors"
                />
              </button>
            </div>
          </Card>

          {/* Sign Out Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
              size="lg"
              radius="lg"
              startContent={<LogOut size={18} />}
              onPress={handleSignOut}
            >
              <span className="font-medium">Sign Out</span>
            </Button>
          </motion.div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-stone-400">
              Quant v1.0.0 • Made with ♥ in San Francisco
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
