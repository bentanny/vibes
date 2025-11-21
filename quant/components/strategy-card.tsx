"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Send, GripVertical, CheckCircle2 } from "lucide-react";
import { Button as HeroButton } from "@heroui/button";
import { CompanyLogo } from "@/components/company-logo";

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

export function StrategyCard() {
  const { theme } = useTheme();
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [newConditionText, setNewConditionText] = useState("");
  const [draggedConditionId, setDraggedConditionId] = useState<string | null>(
    null,
  );
  const [dragOverGroupType, setDragOverGroupType] =
    useState<ConditionType | null>(null);

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
    <Card className="w-full max-w-2xl overflow-hidden border border-gray-300 dark:border-zinc-900 shadow-2xl bg-[#ECE9E2] dark:bg-black transition-colors duration-200">
      {/* Header Section */}
      <div className="relative bg-[#ECE9E2] dark:bg-black p-8 border-b border-gray-300 dark:border-zinc-900 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <CompanyLogo domain="tesla.com" size={56} radius="sm" />

            <div className="space-y-1">
              <h2 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white transition-colors duration-200">
                Smart Buy Strategy
              </h2>
              <p className="text-sm text-gray-600 dark:text-zinc-500 font-mono tracking-wide transition-colors duration-200">
                AUTOMATED EXECUTION
              </p>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <div className="text-2xl font-light text-gray-900 dark:text-white tracking-tight transition-colors duration-200">
              $352.48
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono tracking-wider transition-colors duration-200">
              +2.4%
            </div>
          </div>
        </div>
      </div>

      {/* Conditions Section */}
      <div className="p-8 bg-[#ECE9E2] dark:bg-black border-b border-gray-300 dark:border-zinc-900 transition-colors duration-200">
        <h3 className="text-sm font-mono tracking-widest text-gray-600 dark:text-zinc-500 mb-6 transition-colors duration-200">
          TRIGGERS
        </h3>

        <div className="space-y-4">
          {/* AND Conditions Group */}
          {andConditions.length > 0 && (
            <div
              className={`space-y-0 transition-all duration-200 ${dragOverGroupType === "and" ? "ring-2 ring-gray-400 dark:ring-zinc-700 rounded" : ""}`}
              onDragOver={(e) => handleDragOver(e, "and")}
              onDrop={(e) => handleDrop(e, "and")}
              onDragLeave={handleDragLeave}
            >
              {andConditions.map((condition, index) => (
                <div key={condition.id}>
                  {index > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#ECE9E2] dark:bg-black border-x border-gray-300 dark:border-zinc-900 transition-colors duration-200">
                      <span className="text-xs font-mono text-gray-600 dark:text-zinc-500 tracking-wider transition-colors duration-200">
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
                        ? "border-gray-300 dark:border-zinc-800 rounded-t"
                        : "border-x border-gray-300 dark:border-zinc-800"
                    } ${
                      index === andConditions.length - 1
                        ? "border-b border-gray-300 dark:border-zinc-800 rounded-b"
                        : ""
                    } bg-white dark:bg-[#171219] p-6 hover:border-gray-400 dark:hover:border-zinc-800 transition-colors duration-200 cursor-move ${
                      draggedConditionId === condition.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-3 h-3 text-gray-400 dark:text-zinc-700 transition-colors duration-200" />
                          <div
                            className={`w-1 h-1 ${getColorClass(condition.highlightColor, "bg")} transition-colors duration-200`}
                          />
                          <span className="text-xs font-mono text-gray-600 dark:text-zinc-500 tracking-wider transition-colors duration-200">
                            {condition.isMainTrigger
                              ? "BUY TRIGGER"
                              : "AND CONDITION"}
                          </span>
                        </div>
                        <p className="text-lg font-light text-gray-900 dark:text-white text-balance leading-relaxed transition-colors duration-200">
                          {condition.title}{" "}
                          <span
                            className={`font-normal ${getColorClass(condition.highlightColor, "text")} transition-colors duration-200`}
                          >
                            {condition.highlightText}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-zinc-600 font-light transition-colors duration-200">
                          {condition.description}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-zinc-700 flex-shrink-0 transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OR Divider - only show if we have both groups */}
          {andConditions.length > 0 && orConditions.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-gray-300 dark:border-zinc-900 transition-colors duration-200"></div>
              <span className="text-xs font-mono text-gray-600 dark:text-zinc-500 tracking-wider transition-colors duration-200">
                OR
              </span>
              <div className="flex-1 border-t border-gray-300 dark:border-zinc-900 transition-colors duration-200"></div>
            </div>
          )}

          {/* OR Conditions */}
          {orConditions.length > 0 && (
            <div
              className={`space-y-4 transition-all duration-200 ${dragOverGroupType === "or" ? "ring-2 ring-gray-400 dark:ring-zinc-700 rounded" : ""}`}
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
                  className={`border border-gray-300 dark:border-zinc-900 bg-white dark:bg-[#171219] p-6 hover:border-gray-400 dark:hover:border-zinc-800 transition-colors duration-200 rounded cursor-move ${
                    draggedConditionId === condition.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-3 h-3 text-gray-400 dark:text-zinc-700 transition-colors duration-200" />
                        <div
                          className={`w-1 h-1 ${getColorClass(condition.highlightColor, "bg")} transition-colors duration-200`}
                        />
                        <span className="text-xs font-mono text-gray-600 dark:text-zinc-500 tracking-wider transition-colors duration-200">
                          BUY TRIGGER
                        </span>
                      </div>
                      <p className="text-lg font-light text-gray-900 dark:text-white text-balance leading-relaxed transition-colors duration-200">
                        {condition.title}{" "}
                        <span
                          className={`font-normal ${getColorClass(condition.highlightColor, "text")} transition-colors duration-200`}
                        >
                          {condition.highlightText}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-zinc-600 font-light transition-colors duration-200">
                        {condition.description}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-zinc-700 flex-shrink-0 transition-colors duration-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add more condition */}
          {!isAddingCondition ? (
            <div
              className="border border-dashed border-gray-300 dark:border-zinc-900 bg-white/50 dark:bg-[#171219]/50 p-6 opacity-40 hover:opacity-70 transition-all duration-200 cursor-pointer rounded"
              onClick={handleAddConditionClick}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-gray-400 dark:border-zinc-700 transition-colors duration-200" />
                <p className="text-sm font-mono text-gray-600 dark:text-zinc-600 tracking-wide transition-colors duration-200">
                  ADD CONDITION
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-zinc-900 bg-white dark:bg-[#171219] p-6 rounded transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-gray-400 dark:border-zinc-700 flex-shrink-0 transition-colors duration-200" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newConditionText}
                    onChange={(e) => setNewConditionText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your condition..."
                    className="w-full px-3 py-2 pr-10 text-sm bg-transparent border border-gray-300 dark:border-zinc-900 rounded focus:outline-none focus:border-gray-400 dark:focus:border-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-600 font-light transition-colors duration-200"
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitCondition}
                    disabled={!newConditionText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
      <div className="p-8 bg-[#ECE9E2] dark:bg-black border-b border-gray-300 dark:border-zinc-900 transition-colors duration-200">
        <div className="border-l-2 border-amber-500/50 pl-6">
          <p className="text-base font-light text-gray-900 dark:text-white mb-2 transition-colors duration-200">
            Set it and forget it
          </p>
          <p className="text-sm text-gray-600 dark:text-zinc-600 font-light text-balance leading-relaxed transition-colors duration-200">
            Your strategy executes 24/7. No charts, no stress, no missed
            opportunities.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-8 bg-[#ECE9E2] dark:bg-black transition-colors duration-200">
        <Button
          size="lg"
          className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-black font-light tracking-wide text-base transition-colors duration-200 h-14"
        >
          ACTIVATE STRATEGY
        </Button>
        <p className="text-center text-xs text-gray-600 dark:text-zinc-700 font-mono mt-4 tracking-wide transition-colors duration-200">
          2 SECONDS • CANCEL ANYTIME
        </p>
      </div>
    </Card>
  );
}
