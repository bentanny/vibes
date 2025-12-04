"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, GripVertical, CheckCircle2 } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { useStockPrice } from "@/hooks/use-stock-price";
import { Spinner } from "@heroui/spinner";

type ConditionType = "and" | "or";

interface Condition {
  id: string;
  type: ConditionType;
  title: string;
  highlightText: string;
  description: string;
  highlightColor: string;
  isMainTrigger?: boolean;
}

// Helper function to get Tailwind color classes with dark mode support
const getColorClass = (color: string, type: "bg" | "text" = "bg") => {
  const colorMap: Record<string, Record<"bg" | "text", string>> = {
    "emerald-600": {
      bg: "bg-emerald-600 dark:bg-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    "emerald-400": {
      bg: "bg-emerald-600 dark:bg-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    "cyan-600": {
      bg: "bg-cyan-600 dark:bg-cyan-400",
      text: "text-cyan-600 dark:text-cyan-400",
    },
    "cyan-400": {
      bg: "bg-cyan-600 dark:bg-cyan-400",
      text: "text-cyan-600 dark:text-cyan-400",
    },
  };
  return colorMap[color]?.[type] || colorMap["emerald-600"][type];
};

interface StrategyCardProps {
  symbol?: string;
  companyDomain?: string;
  strategyName?: string;
}

export function StrategyCard({
  symbol = "TSLA",
  companyDomain = "tesla.com",
  strategyName = "Smart Buy Strategy",
}: StrategyCardProps) {
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [newConditionText, setNewConditionText] = useState("");
  const [draggedConditionId, setDraggedConditionId] = useState<string | null>(
    null,
  );
  const [dragOverGroupType, setDragOverGroupType] =
    useState<ConditionType | null>(null);

  // Real-time stock price from Finnhub
  const { price, changePercent, isLoading, isConnected } =
    useStockPrice(symbol);

  // Initialize with existing conditions
  const [andConditions, setAndConditions] = useState<Condition[]>([
    {
      id: "1",
      type: "and",
      title: "Price",
      highlightText: "dips 15% or more",
      description: "Buy the dip when others panic",
      highlightColor: "emerald-600",
      isMainTrigger: true,
    },
    {
      id: "2",
      type: "and",
      title: "Volume",
      highlightText: "exceeds 20-day average",
      description: "Confirm with increased trading activity",
      highlightColor: "emerald-600",
    },
  ]);

  const [orConditions, setOrConditions] = useState<Condition[]>([
    {
      id: "3",
      type: "or",
      title: "Breaks",
      highlightText: "below lower Bollinger Band",
      description: "Buy when sell off is over",
      highlightColor: "cyan-600",
      isMainTrigger: true,
    },
  ]);

  const handleAddConditionClick = () => {
    setIsAddingCondition(true);
  };

  const handleSubmitCondition = () => {
    if (newConditionText.trim()) {
      // Generate a simple condition from the text
      const newCondition: Condition = {
        id: Date.now().toString(),
        type: "or", // Default to OR when adding new
        title: newConditionText,
        highlightText: newConditionText,
        description: "Custom condition",
        highlightColor: "emerald-600",
        isMainTrigger: true,
      };

      setOrConditions([...orConditions, newCondition]);
      setNewConditionText("");
      setIsAddingCondition(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitCondition();
    }
  };

  const handleDragStart = (e: React.DragEvent, condition: Condition) => {
    setDraggedConditionId(condition.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", condition.id);
  };

  const handleDragEnd = () => {
    setDraggedConditionId(null);
    setDragOverGroupType(null);
  };

  const handleDragOver = (e: React.DragEvent, groupType: ConditionType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverGroupType(groupType);
  };

  const handleDrop = (e: React.DragEvent, targetGroupType: ConditionType) => {
    e.preventDefault();
    const conditionId = e.dataTransfer.getData("text/plain");

    if (!conditionId) return;

    // Find the condition in both arrays
    let condition: Condition | undefined;

    condition = andConditions.find((c) => c.id === conditionId);
    if (condition) {
      // If already in target group, do nothing
      if (targetGroupType === "and") {
        setDraggedConditionId(null);
        setDragOverGroupType(null);
        return;
      }

      // Remove from andConditions and add to orConditions
      setAndConditions(andConditions.filter((c) => c.id !== conditionId));
      setOrConditions([...orConditions, { ...condition, type: "or" }]);
    } else {
      condition = orConditions.find((c) => c.id === conditionId);
      if (condition) {
        // If already in target group, do nothing
        if (targetGroupType === "or") {
          setDraggedConditionId(null);
          setDragOverGroupType(null);
          return;
        }

        // Remove from orConditions and add to andConditions
        setOrConditions(orConditions.filter((c) => c.id !== conditionId));
        setAndConditions([...andConditions, { ...condition, type: "and" }]);
      }
    }

    if (!condition) return;

    setDraggedConditionId(null);
    setDragOverGroupType(null);
  };

  const handleDragLeave = () => {
    setDragOverGroupType(null);
  };

  return (
    <Card className="w-full max-w-2xl overflow-hidden shadow-2xl">
      {/* Header Section */}
      <div className="relative p-8 border-b border-default-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <CompanyLogo domain={companyDomain} size={56} radius="sm" />

            <div className="space-y-1">
              <h2 className="text-3xl font-light tracking-tight text-default-foreground">
                {strategyName}
              </h2>
              <p className="text-sm text-default-500 font-mono tracking-wide flex items-center gap-2">
                {symbol}
                {isConnected && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                )}
              </p>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            {isLoading ? (
              <Spinner size="sm" color="default" />
            ) : (
              <>
                <div className="text-2xl font-light text-default-foreground tracking-tight">
                  {price !== null ? `$${price.toFixed(2)}` : "—"}
                </div>
                <div
                  className={`text-xs font-mono tracking-wider ${
                    changePercent !== null && changePercent >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {changePercent !== null
                    ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
                    : "—"}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conditions Section */}
      <div className="p-8 border-b border-default-200">
        <h3 className="text-sm font-mono tracking-widest text-default-500 mb-6">
          TRIGGERS
        </h3>

        <div className="space-y-4">
          {/* AND Conditions Group */}
          {andConditions.length > 0 && (
            <div
              className={`space-y-0 transition-all duration-200 ${dragOverGroupType === "and" ? "ring-2 ring-default-300 rounded" : ""}`}
              onDragOver={(e) => handleDragOver(e, "and")}
              onDrop={(e) => handleDrop(e, "and")}
              onDragLeave={handleDragLeave}
            >
              {andConditions.map((condition, index) => (
                <div key={condition.id}>
                  {index > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 border-x border-default-200">
                      <span className="text-xs font-mono text-default-500 tracking-wider">
                        AND
                      </span>
                    </div>
                  )}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, condition)}
                    onDragEnd={handleDragEnd}
                    className={`border ${
                      index === 0
                        ? "border-default-200 rounded-t"
                        : "border-x border-default-200"
                    } ${
                      index === andConditions.length - 1
                        ? "border-b border-default-200 rounded-b"
                        : ""
                    } bg-default-100 p-6 hover:border-default-300 cursor-move ${
                      draggedConditionId === condition.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-3 h-3 text-default-400" />
                          <div
                            className={`w-1 h-1 ${getColorClass(condition.highlightColor, "bg")}`}
                          />
                          <span className="text-xs font-mono text-default-500 tracking-wider">
                            {condition.isMainTrigger
                              ? "BUY TRIGGER"
                              : "AND CONDITION"}
                          </span>
                        </div>
                        <p className="text-lg font-light text-default-foreground text-balance leading-relaxed">
                          {condition.title}{" "}
                          <span
                            className={`font-normal ${getColorClass(condition.highlightColor, "text")}`}
                          >
                            {condition.highlightText}
                          </span>
                        </p>
                        <p className="text-sm text-default-500 font-light">
                          {condition.description}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-default-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OR Divider - only show if we have both groups */}
          {andConditions.length > 0 && orConditions.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-default-200"></div>
              <span className="text-xs font-mono text-default-500 tracking-wider">
                OR
              </span>
              <div className="flex-1 border-t border-default-200"></div>
            </div>
          )}

          {/* OR Conditions */}
          {orConditions.length > 0 && (
            <div
              className={`space-y-4 transition-all duration-200 ${dragOverGroupType === "or" ? "ring-2 ring-default-300 rounded" : ""}`}
              onDragOver={(e) => handleDragOver(e, "or")}
              onDrop={(e) => handleDrop(e, "or")}
              onDragLeave={handleDragLeave}
            >
              {orConditions.map((condition) => (
                <div
                  key={condition.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, condition)}
                  onDragEnd={handleDragEnd}
                  className={`border border-default-200 bg-default-100 p-6 hover:border-default-300 rounded cursor-move ${
                    draggedConditionId === condition.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-3 h-3 text-default-400" />
                        <div
                          className={`w-1 h-1 ${getColorClass(condition.highlightColor, "bg")}`}
                        />
                        <span className="text-xs font-mono text-default-500 tracking-wider">
                          BUY TRIGGER
                        </span>
                      </div>
                      <p className="text-lg font-light text-default-foreground text-balance leading-relaxed">
                        {condition.title}{" "}
                        <span
                          className={`font-normal ${getColorClass(condition.highlightColor, "text")}`}
                        >
                          {condition.highlightText}
                        </span>
                      </p>
                      <p className="text-sm text-default-500 font-light">
                        {condition.description}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-default-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add more condition */}
          {!isAddingCondition ? (
            <div
              className="border border-dashed border-default-200 bg-default-50 p-6 opacity-40 hover:opacity-70 transition-all duration-200 cursor-pointer rounded"
              onClick={handleAddConditionClick}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-default-300" />
                <p className="text-sm font-mono text-default-500 tracking-wide">
                  ADD CONDITION
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-default-200 bg-default-100 p-6 rounded">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-default-300 flex-shrink-0" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newConditionText}
                    onChange={(e) => setNewConditionText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your condition..."
                    className="w-full px-3 py-2 pr-10 text-sm bg-transparent border border-default-200 rounded focus:outline-none focus:border-default-300 text-default-foreground placeholder:text-default-500 font-light"
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitCondition}
                    disabled={!newConditionText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-default-foreground hover:bg-default-300 text-default-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="p-8 border-b border-default-200">
        <div className="border-l-2 border-warning/50 pl-6">
          <p className="text-base font-light text-default-foreground mb-2">
            Set it and forget it
          </p>
          <p className="text-sm text-default-500 font-light text-balance leading-relaxed">
            Your strategy executes 24/7. No charts, no stress, no missed
            opportunities.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-8">
        <Button
          size="lg"
          className="w-full font-light tracking-wide text-base h-14"
        >
          ACTIVATE STRATEGY
        </Button>
        <p className="text-center text-xs text-default-500 font-mono mt-4 tracking-wide">
          2 SECONDS • CANCEL ANYTIME
        </p>
      </div>
    </Card>
  );
}
