"use client";

import React, { useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  Chip,
  Slider,
  Tooltip,
} from "@heroui/react";
import { Settings2, Info } from "lucide-react";
import {
  extractCardParams,
  TweakableParam,
  getCardSummary,
} from "@/lib/card-params";
import { Card } from "@/lib/vibe-api";
import { getRoleColor } from "@/lib/utils";

interface CardParamsEditorProps {
  cards: Card[];
  overrides: Record<string, Record<string, number>>; // cardId -> path -> value
  onOverridesChange: (
    overrides: Record<string, Record<string, number>>
  ) => void;
  readOnly?: boolean;
}

/**
 * Editor for tweaking card parameters before running a backtest.
 */
export function CardParamsEditor({
  cards,
  overrides,
  onOverridesChange,
  readOnly = false,
}: CardParamsEditorProps) {
  // Extract params from all cards
  const extractedCards = useMemo(() => {
    return cards.map((card) => extractCardParams(card));
  }, [cards]);

  // Check if any card has tweakable params
  const hasParams = extractedCards.some((c) => c.params.length > 0);

  if (!hasParams) {
    return null;
  }

  const handleParamChange = (
    cardId: string,
    path: string,
    value: number
  ) => {
    const newOverrides = { ...overrides };
    if (!newOverrides[cardId]) {
      newOverrides[cardId] = {};
    }
    newOverrides[cardId][path] = value;
    onOverridesChange(newOverrides);
  };

  const getEffectiveValue = (
    cardId: string,
    param: TweakableParam
  ): number => {
    return overrides[cardId]?.[param.path] ?? param.value;
  };

  const hasOverride = (cardId: string, path: string): boolean => {
    return overrides[cardId]?.[path] !== undefined;
  };

  const clearOverride = (cardId: string, path: string) => {
    const newOverrides = { ...overrides };
    if (newOverrides[cardId]) {
      delete newOverrides[cardId][path];
      if (Object.keys(newOverrides[cardId]).length === 0) {
        delete newOverrides[cardId];
      }
    }
    onOverridesChange(newOverrides);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-default-600 mb-2">
        <Settings2 className="w-4 h-4" />
        <span className="font-medium">Parameter Overrides</span>
      </div>

      <Accordion
        variant="splitted"
        selectionMode="multiple"
        className="px-0"
      >
        {extractedCards
          .filter((card) => card.params.length > 0)
          .map((card) => (
            <AccordionItem
              key={card.cardId}
              aria-label={card.cardName}
              title={
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getRoleColor(card.role)}
                  >
                    {card.role}
                  </Chip>
                  <span className="font-medium">{card.cardName}</span>
                  {Object.keys(overrides[card.cardId] || {}).length > 0 && (
                    <Chip size="sm" color="warning" variant="dot">
                      Modified
                    </Chip>
                  )}
                </div>
              }
              subtitle={
                <span className="text-xs text-default-400">
                  {getCardSummary(card)}
                </span>
              }
            >
              <div className="space-y-4 pb-2">
                {card.params.map((param) => (
                  <ParamSlider
                    key={param.path}
                    param={param}
                    value={getEffectiveValue(card.cardId, param)}
                    hasOverride={hasOverride(card.cardId, param.path)}
                    onChange={(value) =>
                      handleParamChange(card.cardId, param.path, value)
                    }
                    onClear={() => clearOverride(card.cardId, param.path)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}

interface ParamSliderProps {
  param: TweakableParam;
  value: number;
  hasOverride: boolean;
  onChange: (value: number) => void;
  onClear: () => void;
  readOnly: boolean;
}

function ParamSlider({
  param,
  value,
  hasOverride,
  onChange,
  onClear,
  readOnly,
}: ParamSliderProps) {
  const displayValue =
    param.type === "int" ? Math.round(value) : value.toFixed(2);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{param.label}</span>
          {param.description && (
            <Tooltip content={param.description}>
              <Info className="w-3 h-3 text-default-400 cursor-help" />
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-mono ${
              hasOverride ? "text-warning font-semibold" : "text-default-500"
            }`}
          >
            {displayValue}
          </span>
          {hasOverride && !readOnly && (
            <button
              onClick={onClear}
              className="text-xs text-default-400 hover:text-danger"
              title="Reset to original"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <Slider
        size="sm"
        step={param.step}
        minValue={param.min}
        maxValue={param.max}
        value={value}
        onChange={(val) => {
          const newVal = Array.isArray(val) ? val[0] : val;
          onChange(param.type === "int" ? Math.round(newVal) : newVal);
        }}
        isDisabled={readOnly}
        classNames={{
          track: hasOverride ? "bg-warning-100" : undefined,
          filler: hasOverride ? "bg-warning" : undefined,
        }}
        aria-label={param.label}
      />
      <div className="flex justify-between text-xs text-default-400">
        <span>{param.min}</span>
        <span>{param.max}</span>
      </div>
    </div>
  );
}

/**
 * Compact summary view of card parameters (for display, not editing).
 */
export function CardParamsSummary({ cards }: { cards: Card[] }) {
  const extractedCards = useMemo(() => {
    return cards.map((card) => extractCardParams(card));
  }, [cards]);

  return (
    <div className="space-y-2">
      {extractedCards.map((card) => (
        <div
          key={card.cardId}
          className="flex items-center gap-3 p-2 bg-default-50 rounded-lg"
        >
          <Chip size="sm" variant="flat" color={getRoleColor(card.role)}>
            {card.role}
          </Chip>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{card.cardName}</p>
            <p className="text-xs text-default-500 truncate">
              {card.params.length > 0
                ? getCardSummary(card)
                : card.archetypeId}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

