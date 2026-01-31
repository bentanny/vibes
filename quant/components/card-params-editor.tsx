"use client";

import React, { useMemo } from "react";
import {
  Chip,
} from "@heroui/react";
import {
  extractCardParams,
  getCardSummary,
} from "@/lib/card-params";
import { Card } from "@/lib/vibe-api";
import { getRoleColor } from "@/lib/utils";

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

