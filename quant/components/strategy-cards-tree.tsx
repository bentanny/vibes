"use client";

import React, { useMemo, useState } from "react";
import { Chip } from "@heroui/chip";
import { Accordion, AccordionItem } from "@heroui/accordion";
import {
  TrendingUp,
  LogOut,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/lib/vibe-api";
import { getRoleColor } from "@/lib/utils";
import {
  describeCard,
  generateStrategySummary,
  getArchetypeTitle,
  CardDescription,
} from "@/lib/strategy-summary";

interface StrategyCardsTreeProps {
  cards: Card[];
}

/**
 * Get the icon component for a role.
 */
function RoleIcon({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const iconProps = { className: className || "w-4 h-4" };

  switch (role) {
    case "entry":
      return <TrendingUp {...iconProps} />;
    case "exit":
      return <LogOut {...iconProps} />;
    case "gate":
      return <Filter {...iconProps} />;
    case "overlay":
      return <Layers {...iconProps} />;
    default:
      return <ChevronRight {...iconProps} />;
  }
}

/**
 * Individual card in the tree view.
 */
function CardTreeItem({ card, description }: { card: Card; description: CardDescription }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
      {/* Card Header - Always Visible */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Role Icon */}
        <div
          className={`p-2 rounded-lg ${
            description.role === "entry"
              ? "bg-emerald-100 text-emerald-600"
              : description.role === "exit"
                ? "bg-rose-100 text-rose-600"
                : description.role === "gate"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-blue-100 text-blue-600"
          }`}
        >
          <RoleIcon role={description.role} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-stone-900">
              {card.name || getArchetypeTitle(card.type)}
            </h4>
            <Chip
              size="sm"
              variant="flat"
              color={getRoleColor(description.role)}
              className="text-[10px] uppercase"
            >
              {description.role}
            </Chip>
          </div>
          <p className="text-sm text-stone-600">{description.summary}</p>
        </div>

        {/* Expand Indicator */}
        <div className="text-stone-400 mt-1">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && description.sections.length > 0 && (
        <div className="px-4 pb-4 pt-0 border-t border-stone-100">
          <div className="pl-11 space-y-3 pt-3">
            {description.sections.map((section, sIdx) => (
              <div key={sIdx}>
                <h5 className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">
                  {section.label}
                </h5>
                <ul className="space-y-1">
                  {section.items.map((item, iIdx) => (
                    <li
                      key={iIdx}
                      className="text-sm text-stone-700 flex items-start gap-2"
                    >
                      <span className="text-stone-300 mt-1.5">•</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Strategy Cards Tree View
 *
 * Displays cards with:
 * 1. Auto-generated strategy summary at top
 * 2. Expandable tree of cards grouped by role
 */
export function StrategyCardsTree({ cards }: StrategyCardsTreeProps) {
  // Generate descriptions for all cards
  const cardDescriptions = useMemo(() => {
    return cards.map((card) => ({
      card,
      description: describeCard(card),
    }));
  }, [cards]);

  // Generate overall strategy summary
  const strategySummary = useMemo(() => {
    return generateStrategySummary(cards);
  }, [cards]);

  // Sort cards by role: gate → entry → exit → overlay
  const sortedCards = useMemo(() => {
    const roleOrder = { gate: 0, entry: 1, exit: 2, overlay: 3 };
    return [...cardDescriptions].sort((a, b) => {
      return (
        (roleOrder[a.description.role as keyof typeof roleOrder] ?? 4) -
        (roleOrder[b.description.role as keyof typeof roleOrder] ?? 4)
      );
    });
  }, [cardDescriptions]);

  // Group cards by role for display
  const groupedCards = useMemo(() => {
    const groups: Record<string, typeof sortedCards> = {};
    for (const item of sortedCards) {
      const role = item.description.role;
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(item);
    }
    return groups;
  }, [sortedCards]);

  if (cards.length === 0) {
    return (
      <p className="text-stone-500 text-center py-4">
        No cards attached to this strategy
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strategy Summary */}
      <div className="bg-gradient-to-r from-stone-50 to-amber-50/30 rounded-lg p-4 border border-stone-200/60">
        <p className="text-sm text-stone-500 uppercase tracking-wide mb-1 font-medium">
          Strategy Logic
        </p>
        <p className="text-stone-800">{strategySummary}</p>
      </div>

      {/* Cards Tree */}
      <div className="space-y-3">
        {sortedCards.map(({ card, description }) => (
          <CardTreeItem
            key={card.id}
            card={card}
            description={description}
          />
        ))}
      </div>
    </div>
  );
}
