import React, { useRef, useEffect, useState } from "react";
import type { StrategyConfirmationPanelRef } from "@/components/strategy-confirmation-panel";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  Info,
  Check,
  DollarSign,
  Zap,
  AlertTriangle,
  Clock,
  GalleryVerticalEnd,
  Send,
  Bot,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { Spacer } from "@heroui/spacer";
import { Logo } from "@/components/icons";
import { SignInModal } from "@/components/sign-in-modal";
import { StrategyConfirmationPanel } from "@/components/strategy-confirmation-panel";
import { TradingAgentChat } from "@/components/trading-agent-chat";
import { StrategyVisualizer } from "@/components/archetype-visualizations";
import { getArchetypeConfig } from "@/lib/archetype-detector";
import { getArchetypeColorClasses } from "@/lib/utils";
import { Spinner } from "@heroui/spinner";
import { RollingText } from "@/components/ui/shadcn-io/rolling-text";
import { ExpandableButton } from "@/components/ui/expandable-button";
import { LoadingSteps } from "@/components/loading-steps";
import type { ChatMessage, TradingArchetype } from "@/types";

interface MobileDashboardLayoutProps {
  // Chat Props
  messages: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: (e: React.FormEvent) => void;
  handleGoBack: () => void;

  // State Props
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;
  isStrategyVisible: boolean;
  hasAgentResponded: boolean;

  // Data Props
  ticker: string;
  companyName: string;
  stockPrice: number | null;
  changePercent: number | null;
  isPriceLoading: boolean;
  isConnected: boolean;
  imgSrc: string;

  // Archetype Props
  detectedArchetype: TradingArchetype | null;
  currentLogic: any;
  mockVisualizationData: any;
  ENABLE_AGENT_VISUALIZATION: boolean;

  // Auth/Nav Props
  session: any;
  status: string;
  router: any;
  isSignInOpen: boolean;
  setIsSignInOpen: (val: boolean) => void;

  // Handlers
  onGoBack: () => void;
}

export function MobileDashboardLayout({
  messages,
  inputText,
  setInputText,
  handleSend,
  handleGoBack,
  isInitialized,
  setIsInitialized,
  isStrategyVisible,
  hasAgentResponded,
  ticker,
  companyName,
  stockPrice,
  changePercent,
  isPriceLoading,
  isConnected,
  imgSrc,
  detectedArchetype,
  currentLogic,
  mockVisualizationData,
  ENABLE_AGENT_VISUALIZATION,
  session,
  status,
  router,
  isSignInOpen,
  setIsSignInOpen,
  onGoBack: parentOnGoBack,
}: MobileDashboardLayoutProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<StrategyConfirmationPanelRef>(null);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Use container scroll to avoid moving the entire page/viewport during transitions
    if (messagesEndRef.current?.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // If strategy is visible or agent has responded, minimize the chat to bottom sheet
  // BUT if user manually expanded it, keep it expanded
  // Chat should always be visible at bottom, minimized when strategy is visible
  const isChatMinimized =
    (isStrategyVisible || hasAgentResponded) && !isManuallyExpanded;

  // Ensure chat is always visible - if no strategy yet, show it expanded
  // If strategy exists, show it minimized at bottom

  // Reset manual expansion if strategy changes or new messages come in (optional, but good UX to auto-minimize on new agent response)
  // Actually, if a new message comes in, we might want to auto-minimize again?
  // Let's keep it simple: if the user expands it, it stays expanded until they maybe click something else or we add a close button.
  // For now, let's just allow toggling.

  return (
    <div
      className="w-full h-[100dvh] relative overflow-hidden bg-[#fdfbf7] flex flex-col"
      style={{ maxHeight: "100dvh" }}
    >
      {/* Background Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - Always visible at top */}
      <nav className="relative w-full p-4 flex justify-between items-center z-40 text-stone-900 bg-[#fdfbf7]/80 backdrop-blur-sm">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={parentOnGoBack}
        >
          <Logo size={20} className="text-stone-900" />
          <span className="text-sm tracking-[0.2em] uppercase font-medium">
            Quant
          </span>
        </div>

        {status === "authenticated" && session?.user ? (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center cursor-pointer"
              onClick={() => router.push("/portfolio")}
            >
              <GalleryVerticalEnd size={14} className="text-stone-600" />
            </div>
            <Avatar
              src={session.user.image || undefined}
              name={session.user.name || "User"}
              size="sm"
              className="w-8 h-8 border border-stone-200"
              onClick={() => router.push("/settings")}
            />
          </div>
        ) : (
          <Button
            size="sm"
            className="border border-stone-300 rounded-full text-[10px] uppercase tracking-widest text-stone-900 bg-transparent"
            variant="bordered"
            onPress={() => setIsSignInOpen(true)}
          >
            Sign In
          </Button>
        )}
      </nav>

      {/* Main Content Area - Stacked */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {/* Strategy Card Layer - Only shows when minimized */}
        <AnimatePresence>
          {isChatMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-10 overflow-y-auto pt-6 pb-16 px-4"
            >
              {/* Mobile Strategy Card Content */}
              <Card className="w-full bg-[#f3f1ed] shadow-sm mb-0 rounded-b-none">
                {/* Ticker Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-white/50 border border-stone-200"
                        >
                          <span className="text-[10px] uppercase tracking-widest text-stone-500">
                            Proposed
                          </span>
                        </Chip>
                        {detectedArchetype && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className={`${getArchetypeColorClasses(detectedArchetype).chipBg} border ${getArchetypeColorClasses(detectedArchetype).chipBorder}`}
                          >
                            <span className="text-[10px] uppercase tracking-widest font-bold">
                              {
                                getArchetypeConfig(detectedArchetype)
                                  ?.displayName
                              }
                            </span>
                          </Chip>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 mb-1">
                        <h1 className="text-4xl font-serif text-stone-900">
                          {ticker}
                        </h1>
                        {stockPrice && (
                          <span className="text-xl font-mono text-stone-600">
                            ${stockPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
                          {companyName}
                        </span>
                        {changePercent !== null && (
                          <span
                            className={`text-xs font-bold ${changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {changePercent >= 0 ? "+" : ""}
                            {changePercent.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visualization */}
                  {detectedArchetype && (
                    <div className="w-full h-40 relative mb-2 group/viz flex items-center justify-center overflow-hidden rounded-xl border border-stone-100/50 bg-[#edece8]">
                      <StrategyVisualizer
                        type={detectedArchetype}
                        variant="dark"
                        useCustomData={ENABLE_AGENT_VISUALIZATION}
                        data={mockVisualizationData}
                        runOnLoad={true}
                        loop={true}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-4 mb-12">
                    {detectedArchetype &&
                      (() => {
                        const config = getArchetypeConfig(detectedArchetype);
                        if (!config || !config.desc) return null;
                        return (
                          <span className="text-sm text-stone-500 italic">
                            {config.desc}
                          </span>
                        );
                      })()}
                  </div>

                  {/* Logic Pipeline Mobile */}
                  <div className="space-y-8">
                    {/* Buy Conditions */}
                    <div className="bg-[#edece8] p-4 rounded-xl border border-stone-200/60 relative">
                      <div className="absolute -top-4.5 left-2 bg-white px-3 py-1 rounded border border-stone-200 text-[9px] font-bold tracking-widest text-emerald-600 uppercase shadow-sm flex items-center gap-1">
                        <Check size={10} /> Buying Conditions
                      </div>
                      {currentLogic.buy.map((item: any, i: number) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 ${i > 0 ? "mt-3 pt-3 border-t border-dashed border-stone-300" : ""}`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <div>
                            <h4 className="font-serif text-lg text-stone-800 leading-none">
                              {item.value}
                            </h4>
                            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    {/* <div className="flex justify-center -my-2 relative z-10">
                      <div className="bg-[#f3f1ed] p-1 rounded-full border border-stone-200 text-stone-300">
                        <Zap size={12} />
                      </div>
                    </div> */}

                    {/* Sell Conditions */}
                    <div className="bg-[#edece8] p-4 rounded-xl border border-stone-200/60 relative">
                      <div className="absolute -top-4.5 left-2 bg-white px-3 py-1 rounded border border-stone-200 text-[9px] font-bold tracking-widest text-red-400 uppercase shadow-sm flex items-center gap-1">
                        <DollarSign size={10} /> Selling Conditions
                      </div>
                      {currentLogic.sell.map((item: any, i: number) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 ${i > 0 ? "mt-3 pt-3 border-t border-dashed border-stone-300" : ""}`}
                        >
                          {i === 0 ? (
                            <AlertTriangle size={14} className="text-red-400" />
                          ) : (
                            <Clock size={14} className="text-blue-400" />
                          )}
                          <div>
                            <h4 className="font-serif text-lg text-stone-800 leading-none">
                              {item.value}
                            </h4>
                            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Initialize Button - Sticky Footer */}
              <div className="sticky bottom-0 p-4 pt-2 bg-[#f3f1ed]/95 backdrop-blur-md z-10 border-t border-stone-200">
                <Button
                  className="w-full bg-stone-900/90 text-white shadow-lg backdrop-blur-md"
                  size="lg"
                  radius="lg"
                  onPress={() => setIsInitialized(true)}
                >
                  Initialize Strategy
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Component - Animated Bottom Sheet - Always visible */}
        <motion.div
          initial={false}
          animate={{
            y: isChatMinimized ? "calc(100% - 72px)" : 0, // Collapsed state shows handle + header (approx 72px)
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute inset-0 w-full bg-white z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col transition-shadow ${isChatMinimized ? "rounded-t-2xl border-t border-stone-100" : ""}`}
          style={{
            pointerEvents: "auto",
            height: "100%",
            // Ensure visibility on Safari mobile with hardware acceleration
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
          }}
          onTouchStart={(e) => {
            // Only track touches when expanded and starting from top area (first 100px)
            if (!isChatMinimized && (isStrategyVisible || hasAgentResponded)) {
              const touchY = e.touches[0].clientY;
              const elementTop = e.currentTarget.getBoundingClientRect().top;
              const relativeY = touchY - elementTop;

              // Only track if touch starts in the top 100px (handle + header area)
              if (relativeY < 100) {
                touchStartY.current = touchY;
                touchStartTime.current = Date.now();
              }
            }
          }}
          onTouchMove={(e) => {
            // Allow normal scrolling - don't interfere
          }}
          onTouchEnd={(e) => {
            if (
              !isChatMinimized &&
              touchStartY.current !== null &&
              touchStartTime.current !== null
            ) {
              const touchEndY = e.changedTouches[0].clientY;
              const touchEndTime = Date.now();
              const deltaY = touchEndY - touchStartY.current;
              const deltaTime = touchEndTime - touchStartTime.current;

              // Detect swipe down: significant downward movement (>50px) in reasonable time (<500ms)
              if (deltaY > 50 && deltaTime < 500) {
                setIsManuallyExpanded(false);
              }

              touchStartY.current = null;
              touchStartTime.current = null;
            }
          }}
        >
          {/* Custom Chat Layout for Mobile */}
          <div className="flex flex-col h-full bg-white relative">
            {/* Handle for dragging (visual cue) - Always show when minimized, or show at bottom when expanded */}
            <div
              className={`w-full flex justify-center pt-2 pb-1.5 flex-shrink-0 cursor-pointer touch-none bg-white ${isChatMinimized ? "" : "hidden"}`}
              onClick={(e) => {
                if (isChatMinimized) {
                  e.stopPropagation();
                  setIsManuallyExpanded(true);
                }
              }}
              onTouchStart={(e) => {
                if (isChatMinimized) {
                  e.stopPropagation();
                }
              }}
              onTouchEnd={(e) => {
                if (isChatMinimized) {
                  e.stopPropagation();
                  setIsManuallyExpanded(true);
                }
              }}
            >
              <div className="w-12 h-1.5 bg-stone-400 rounded-full shadow-sm" />
            </div>

            {/* Slider icon at top when expanded (to collapse) */}
            {!isChatMinimized && (isStrategyVisible || hasAgentResponded) && (
              <div
                className="w-full flex justify-center pt-2 pb-1.5 absolute top-0 z-50 cursor-pointer bg-white/80 backdrop-blur-sm"
                onClick={() => setIsManuallyExpanded(false)}
                onTouchStart={(e) => {
                  touchStartY.current = e.touches[0].clientY;
                  touchStartTime.current = Date.now();
                }}
                onTouchEnd={(e) => {
                  if (
                    touchStartY.current !== null &&
                    touchStartTime.current !== null
                  ) {
                    const touchEndY = e.changedTouches[0].clientY;
                    const touchEndTime = Date.now();
                    const deltaY = touchEndY - touchStartY.current;
                    const deltaTime = touchEndTime - touchStartTime.current;

                    // Swipe down detection
                    if (deltaY > 30 && deltaTime < 500) {
                      setIsManuallyExpanded(false);
                    }

                    touchStartY.current = null;
                    touchStartTime.current = null;
                  }
                }}
              >
                <div className="w-12 h-1.5 bg-stone-400 rounded-full shadow-sm" />
              </div>
            )}

            {/* Header - Always visible, even when minimized */}
            <div
              className={`p-3 flex items-center justify-between border-b border-stone-100 flex-shrink-0 ${isChatMinimized ? "cursor-pointer" : ""}`}
              onClick={(e) => {
                if (isChatMinimized) {
                  e.stopPropagation();
                  setIsManuallyExpanded(true);
                }
              }}
              onTouchStart={(e) => {
                if (isChatMinimized) {
                  e.stopPropagation();
                } else if (
                  !isChatMinimized &&
                  (isStrategyVisible || hasAgentResponded)
                ) {
                  // Track touch for swipe down when expanded
                  touchStartY.current = e.touches[0].clientY;
                  touchStartTime.current = Date.now();
                }
              }}
              onTouchEnd={(e) => {
                if (isChatMinimized) {
                  e.stopPropagation();
                  setIsManuallyExpanded(true);
                } else if (
                  !isChatMinimized &&
                  touchStartY.current !== null &&
                  touchStartTime.current !== null
                ) {
                  const touchEndY = e.changedTouches[0].clientY;
                  const touchEndTime = Date.now();
                  const deltaY = touchEndY - touchStartY.current;
                  const deltaTime = touchEndTime - touchStartTime.current;

                  // Swipe down detection on header
                  if (deltaY > 50 && deltaTime < 500) {
                    setIsManuallyExpanded(false);
                  }

                  touchStartY.current = null;
                  touchStartTime.current = null;
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-stone-700">
                  Trading Agent
                </span>
                <Bot size={18} className="text-stone-400 ml-1" />
              </div>
            </div>

            {/* New Strategy Button - Overlaid on top when expanded */}
            {!isChatMinimized && isStrategyVisible && (
              <div className="absolute top-4 right-4 z-50">
                <ExpandableButton label="New Strategy" onClick={handleGoBack} />
              </div>
            )}

            {/* Messages Area - Hidden when minimized to save performance/avoid scrolling issues */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8f4] ${isChatMinimized ? "hidden" : ""}`}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-stone-800 text-white rounded-br-none shadow-md p-3"
                        : msg.isLoading
                          ? "bg-transparent p-0 min-w-[200px] pt-2"
                          : "bg-white border border-stone-200 text-stone-700 rounded-bl-none shadow-sm p-3"
                    }`}
                  >
                    {msg.isLoading ? <LoadingSteps /> : msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form - Hidden when minimized */}
            <form
              onSubmit={handleSend}
              className={`p-4 bg-[#f7f5f1] border-t border-stone-100 flex gap-2 ${isChatMinimized ? "hidden" : ""}`}
            >
              <Input
                type="text"
                value={inputText}
                onValueChange={setInputText}
                placeholder="Refine strategy..."
                classNames={{
                  base: "flex-1",
                  input: "text-base",
                  inputWrapper:
                    "bg-stone-50 border-transparent focus-within:border-amber-400 hover:border-transparent",
                }}
                variant="bordered"
                size="lg"
                radius="md"
              />
              <Button
                type="submit"
                isIconOnly
                className="bg-stone-900 text-white hover:bg-stone-700 hidden md:flex" // Hide send button on mobile as per previous request? Or keep? Previous request said remove on mobile.
                radius="md"
                size="lg"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Panel Overlay */}
      <AnimatePresence>
        {isInitialized && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.3,
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="absolute inset-0 z-50 bg-white"
          >
            <div className="h-full flex flex-col relative">
              <StrategyConfirmationPanel
                ref={panelRef}
                onClose={() => setIsInitialized(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SignInModal isOpen={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </div>
  );
}
