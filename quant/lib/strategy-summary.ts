/**
 * Strategy summary generation utilities.
 *
 * Generates human-readable descriptions from card slots
 * by recognizing semantic patterns (BandSpec, MASpec, etc.).
 */

import { Card } from "./vibe-api";

// ============================================================================
// Types
// ============================================================================

export interface CardDescription {
  cardId: string;
  cardName: string;
  role: string;
  archetypeId: string;
  /** One-line summary like "Buy when price touches lower BB in uptrend" */
  summary: string;
  /** Structured breakdown for tree view */
  sections: DescriptionSection[];
}

export interface DescriptionSection {
  label: string; // e.g., "Trigger", "Filter", "Action", "Risk"
  items: DescriptionItem[];
}

export interface DescriptionItem {
  text: string; // Human-readable text
  path?: string; // Slot path for linking to raw value
  rawValue?: unknown; // The raw slot value
}

// ============================================================================
// Band Formatting
// ============================================================================

interface BandSpec {
  band: "bollinger" | "keltner" | "donchian";
  length: number;
  mult?: number;
  anchor?: string | null;
}

function isBandSpec(obj: unknown): obj is BandSpec {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "band" in obj &&
    "length" in obj
  );
}

function formatBandSpec(spec: BandSpec): string {
  const bandNames: Record<string, string> = {
    bollinger: "Bollinger Band",
    keltner: "Keltner Channel",
    donchian: "Donchian Channel",
  };
  const bandName = bandNames[spec.band] || spec.band;
  const mult = spec.mult ? `, ${spec.mult}σ` : "";
  const anchor = spec.anchor ? ` anchored to ${spec.anchor}` : "";
  return `${bandName} (${spec.length} bars${mult})${anchor}`;
}

// ============================================================================
// Band Event Formatting
// ============================================================================

interface BandEventEdge {
  kind: "edge_event";
  edge: "upper" | "lower" | "mid";
  op: "touch" | "cross_in" | "cross_out";
}

interface BandEventDistance {
  kind: "distance";
  mode: "z" | "band_mult";
  side: "away_upper" | "away_lower";
  thresh: number;
}

interface BandEventReentry {
  kind: "reentry";
  edge: "upper" | "lower";
}

type BandEvent = BandEventEdge | BandEventDistance | BandEventReentry;

function isBandEvent(obj: unknown): obj is BandEvent {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "kind" in obj &&
    ["edge_event", "distance", "reentry"].includes((obj as { kind: string }).kind)
  );
}

function formatBandEvent(event: BandEvent, bandSpec?: BandSpec): string {
  const bandName = bandSpec ? formatBandSpec(bandSpec) : "band";

  if (event.kind === "edge_event") {
    const edgeNames = { upper: "upper", lower: "lower", mid: "middle" };
    const opNames = {
      touch: "touches",
      cross_in: "crosses into",
      cross_out: "crosses out of",
    };
    return `price ${opNames[event.op]} ${edgeNames[event.edge]} ${bandName}`;
  }

  if (event.kind === "distance") {
    const sideNames = { away_upper: "above", away_lower: "below" };
    const unit = event.mode === "z" ? "σ" : "×";
    return `price is ${event.thresh}${unit} ${sideNames[event.side]} mean`;
  }

  if (event.kind === "reentry") {
    return `price re-enters from ${event.edge} ${bandName}`;
  }

  return "band event";
}

// ============================================================================
// MA Spec Formatting
// ============================================================================

interface MASpec {
  fast: number;
  slow: number;
  op: ">" | "<";
}

function isMASpec(obj: unknown): obj is MASpec {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "fast" in obj &&
    "slow" in obj &&
    "op" in obj
  );
}

function formatMASpec(spec: MASpec): string {
  const direction = spec.op === ">" ? "uptrend" : "downtrend";
  return `${direction} (EMA ${spec.fast} ${spec.op} ${spec.slow})`;
}

// ============================================================================
// Action Formatting
// ============================================================================

interface EntryAction {
  direction: "long" | "short";
  sizing?: {
    type: "pct_equity" | "fixed_usd" | "fixed_units";
    pct?: number;
    usd?: number;
    units?: number;
  };
  position_policy?: {
    mode: "single" | "accumulate" | "scale_in";
  };
}

function isEntryAction(obj: unknown): obj is EntryAction {
  return typeof obj === "object" && obj !== null && "direction" in obj;
}

function formatEntryAction(action: EntryAction): string {
  const direction = action.direction === "long" ? "Go long" : "Go short";
  let sizing = "";

  if (action.sizing) {
    if (action.sizing.type === "pct_equity" && action.sizing.pct) {
      sizing = `, ${action.sizing.pct}% of equity`;
    } else if (action.sizing.type === "fixed_usd" && action.sizing.usd) {
      sizing = `, $${action.sizing.usd.toLocaleString()}`;
    } else if (action.sizing.type === "fixed_units" && action.sizing.units) {
      sizing = `, ${action.sizing.units} units`;
    }
  }

  return `${direction}${sizing}`;
}

interface ExitAction {
  mode: "close" | "reduce";
  size_frac?: number;
}

function isExitAction(obj: unknown): obj is ExitAction {
  return typeof obj === "object" && obj !== null && "mode" in obj;
}

function formatExitAction(action: ExitAction): string {
  if (action.mode === "close") {
    return "Close position";
  }
  const pct = action.size_frac ? Math.round(action.size_frac * 100) : 100;
  return `Reduce position by ${pct}%`;
}

// ============================================================================
// Risk Formatting
// ============================================================================

interface RiskSpec {
  sl_pct?: number;
  tp_pct?: number;
  sl_atr?: number;
  tp_rr?: number;
  time_stop_bars?: number;
}

function isRiskSpec(obj: unknown): obj is RiskSpec {
  if (typeof obj !== "object" || obj === null) return false;
  const keys = ["sl_pct", "tp_pct", "sl_atr", "tp_rr", "time_stop_bars"];
  return keys.some((k) => k in obj);
}

function formatRiskSpec(risk: RiskSpec): string[] {
  const parts: string[] = [];

  if (risk.sl_atr) {
    parts.push(`Stop loss at ${risk.sl_atr}× ATR`);
  }
  if (risk.sl_pct) {
    parts.push(`Stop loss at ${risk.sl_pct}%`);
  }
  if (risk.tp_pct) {
    parts.push(`Take profit at ${risk.tp_pct}%`);
  }
  if (risk.tp_rr) {
    parts.push(`Take profit at ${risk.tp_rr}× risk`);
  }
  if (risk.time_stop_bars) {
    parts.push(`Time stop after ${risk.time_stop_bars} bars`);
  }

  return parts;
}

// ============================================================================
// Context Formatting
// ============================================================================

interface ContextSpec {
  symbol: string;
  tf?: string | null;
}

function isContextSpec(obj: unknown): obj is ContextSpec {
  return typeof obj === "object" && obj !== null && "symbol" in obj;
}

function formatContext(ctx: ContextSpec): string {
  const tf = ctx.tf ? ` on ${ctx.tf}` : "";
  return `${ctx.symbol}${tf}`;
}

// ============================================================================
// Archetype-Specific Describers
// ============================================================================

type SlotValue = Record<string, unknown>;

function describeTrendPullback(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];
  const summaryParts: string[] = [];

  // Context
  const ctx = slots.context;
  if (isContextSpec(ctx)) {
    summaryParts.push(`Trade ${formatContext(ctx)}`);
  }

  // Event (trigger + filter)
  const event = slots.event as SlotValue | undefined;
  if (event) {
    const triggerItems: DescriptionItem[] = [];
    const filterItems: DescriptionItem[] = [];

    const dipBand = event.dip_band;
    const dip = event.dip;
    if (isBandSpec(dipBand) && isBandEvent(dip)) {
      const text = `When ${formatBandEvent(dip, dipBand)}`;
      triggerItems.push({ text, path: "event.dip", rawValue: dip });
      summaryParts.push(`when ${formatBandEvent(dip, dipBand)}`);
    }

    const trendGate = event.trend_gate;
    if (isMASpec(trendGate)) {
      const text = `In ${formatMASpec(trendGate)}`;
      filterItems.push({ text, path: "event.trend_gate", rawValue: trendGate });
      summaryParts.push(`in ${formatMASpec(trendGate)}`);
    }

    if (triggerItems.length > 0) {
      sections.push({ label: "Trigger", items: triggerItems });
    }
    if (filterItems.length > 0) {
      sections.push({ label: "Filter", items: filterItems });
    }
  }

  // Action
  const action = slots.action;
  if (isEntryAction(action)) {
    const text = formatEntryAction(action);
    sections.push({
      label: "Action",
      items: [{ text, path: "action", rawValue: action }],
    });
  }

  // Risk
  const risk = slots.risk;
  if (isRiskSpec(risk)) {
    const riskTexts = formatRiskSpec(risk);
    sections.push({
      label: "Risk",
      items: riskTexts.map((text) => ({ text, path: "risk", rawValue: risk })),
    });
  }

  return {
    cardId: "",
    cardName: "",
    role: "entry",
    archetypeId: "entry.trend_pullback",
    summary: summaryParts.join(" ") || "Trend pullback entry",
    sections,
  };
}

function describeTrailingStop(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];
  const summaryParts: string[] = ["Exit"];

  const event = slots.event as SlotValue | undefined;
  if (event) {
    const trailBand = event.trail_band;
    if (isBandSpec(trailBand)) {
      const text = `Trail using ${formatBandSpec(trailBand)}`;
      sections.push({
        label: "Trailing Level",
        items: [{ text, path: "event.trail_band", rawValue: trailBand }],
      });
      summaryParts.push(`with ${trailBand.mult || 2}× ATR trailing stop`);
    }
  }

  const action = slots.action;
  if (isExitAction(action)) {
    sections.push({
      label: "Action",
      items: [
        { text: formatExitAction(action), path: "action", rawValue: action },
      ],
    });
  }

  return {
    cardId: "",
    cardName: "",
    role: "exit",
    archetypeId: "exit.trailing_stop",
    summary: summaryParts.join(" ") || "Trailing stop exit",
    sections,
  };
}

function describeFixedTargets(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];
  const summaryParts: string[] = [];

  // Fixed targets has tp_pct, sl_pct, time_stop_bars directly on event
  const event = slots.event as SlotValue | undefined;
  if (event) {
    const targetItems: DescriptionItem[] = [];

    if (typeof event.tp_pct === "number") {
      const text = `Take profit at ${event.tp_pct}%`;
      targetItems.push({ text, path: "event.tp_pct", rawValue: event.tp_pct });
      summaryParts.push(text);
    }
    if (typeof event.sl_pct === "number") {
      const text = `Stop loss at ${event.sl_pct}%`;
      targetItems.push({ text, path: "event.sl_pct", rawValue: event.sl_pct });
      summaryParts.push(text);
    }
    if (typeof event.time_stop_bars === "number") {
      const text = `Time stop after ${event.time_stop_bars} bars`;
      targetItems.push({ text, path: "event.time_stop_bars", rawValue: event.time_stop_bars });
      summaryParts.push(text);
    }

    if (targetItems.length > 0) {
      sections.push({ label: "Exit Targets", items: targetItems });
    }
  }

  // Also check top-level risk as fallback
  const risk = slots.risk;
  if (sections.length === 0 && isRiskSpec(risk)) {
    const riskTexts = formatRiskSpec(risk);
    sections.push({
      label: "Exit Targets",
      items: riskTexts.map((text) => ({ text, path: "risk", rawValue: risk })),
    });
    summaryParts.push(...riskTexts);
  }

  return {
    cardId: "",
    cardName: "",
    role: "exit",
    archetypeId: "exit.fixed_targets",
    summary: summaryParts.join(", ") || "Fixed targets exit",
    sections,
  };
}

function describeGenericEntry(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];
  const summaryParts: string[] = [];

  // Context
  const ctx = slots.context;
  if (isContextSpec(ctx)) {
    summaryParts.push(`Trade ${formatContext(ctx)}`);
  }

  // Action
  const action = slots.action;
  if (isEntryAction(action)) {
    const text = formatEntryAction(action);
    sections.push({
      label: "Action",
      items: [{ text, path: "action", rawValue: action }],
    });
    summaryParts.push(action.direction === "long" ? "go long" : "go short");
  }

  // Risk
  const risk = slots.risk;
  if (isRiskSpec(risk)) {
    const riskTexts = formatRiskSpec(risk);
    sections.push({
      label: "Risk",
      items: riskTexts.map((text) => ({ text, path: "risk", rawValue: risk })),
    });
  }

  return {
    cardId: "",
    cardName: "",
    role: "entry",
    archetypeId: "",
    summary: summaryParts.join(" ") || "Entry signal",
    sections,
  };
}

function describeGenericExit(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];

  const action = slots.action;
  if (isExitAction(action)) {
    sections.push({
      label: "Action",
      items: [
        { text: formatExitAction(action), path: "action", rawValue: action },
      ],
    });
  }

  const risk = slots.risk;
  if (isRiskSpec(risk)) {
    const riskTexts = formatRiskSpec(risk);
    sections.push({
      label: "Targets",
      items: riskTexts.map((text) => ({ text, path: "risk", rawValue: risk })),
    });
  }

  return {
    cardId: "",
    cardName: "",
    role: "exit",
    archetypeId: "",
    summary: "Exit signal",
    sections,
  };
}

function describeRegimeGate(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];
  const summaryParts: string[] = ["Allow trading when"];

  // Event conditions
  const event = slots.event as SlotValue | undefined;
  if (event && event.conditions && Array.isArray(event.conditions)) {
    const conditionItems: DescriptionItem[] = [];
    for (const cond of event.conditions) {
      if (
        typeof cond === "object" &&
        cond !== null &&
        "metric" in cond &&
        "op" in cond &&
        "value" in cond
      ) {
        const c = cond as { metric: string; op: string; value: number };
        const text = `${c.metric} ${c.op} ${c.value}`;
        conditionItems.push({ text, rawValue: cond });
      }
    }
    if (conditionItems.length > 0) {
      sections.push({ label: "Conditions", items: conditionItems });
      summaryParts.push(conditionItems.map((i) => i.text).join(" AND "));
    }
  }

  return {
    cardId: "",
    cardName: "",
    role: "gate",
    archetypeId: "gate.regime",
    summary: summaryParts.join(" ") || "Regime gate",
    sections,
  };
}

function describeOverlay(slots: SlotValue): CardDescription {
  const sections: DescriptionSection[] = [];

  const action = slots.action as SlotValue | undefined;
  if (action && action.scale_factors) {
    const sf = action.scale_factors as { scale_size_frac?: number };
    if (sf.scale_size_frac) {
      sections.push({
        label: "Scaling",
        items: [
          {
            text: `Scale position to ${Math.round(sf.scale_size_frac * 100)}%`,
            rawValue: sf,
          },
        ],
      });
    }
  }

  return {
    cardId: "",
    cardName: "",
    role: "overlay",
    archetypeId: "overlay.regime_scaler",
    summary: "Regime-based position scaling",
    sections,
  };
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Generate a human-readable description for a card.
 */
export function describeCard(card: Card): CardDescription {
  const slots = card.slots as SlotValue;
  const archetype = card.type || "";
  const role = card.role || archetype.split(".")[0] || "entry";

  let description: CardDescription;

  // Use archetype-specific describers when available
  switch (archetype) {
    case "entry.trend_pullback":
      description = describeTrendPullback(slots);
      break;
    case "exit.trailing_stop":
      description = describeTrailingStop(slots);
      break;
    case "exit.fixed_targets":
      description = describeFixedTargets(slots);
      break;
    case "gate.regime":
      description = describeRegimeGate(slots);
      break;
    case "overlay.regime_scaler":
      description = describeOverlay(slots);
      break;
    default:
      // Fallback to generic describers based on role
      if (role === "entry" || archetype.startsWith("entry.")) {
        description = describeGenericEntry(slots);
      } else if (role === "exit" || archetype.startsWith("exit.")) {
        description = describeGenericExit(slots);
      } else if (role === "gate" || archetype.startsWith("gate.")) {
        description = describeRegimeGate(slots);
      } else {
        description = describeOverlay(slots);
      }
  }

  // Fill in card metadata
  description.cardId = card.id;
  description.cardName = card.name;
  description.role = role;
  description.archetypeId = archetype;

  return description;
}

/**
 * Generate a one-line strategy summary from all cards.
 */
export function generateStrategySummary(cards: Card[]): string {
  if (cards.length === 0) {
    return "No cards attached";
  }

  // Sort cards by role: gate → entry → exit → overlay
  const roleOrder = { gate: 0, entry: 1, exit: 2, overlay: 3 };
  const sortedCards = [...cards].sort((a, b) => {
    const roleA = a.role || (a.type || "").split(".")[0] || "entry";
    const roleB = b.role || (b.type || "").split(".")[0] || "entry";
    return (
      (roleOrder[roleA as keyof typeof roleOrder] ?? 4) -
      (roleOrder[roleB as keyof typeof roleOrder] ?? 4)
    );
  });

  // Find context from first entry card
  let context = "";
  const entryCard = sortedCards.find(
    (c) => c.role === "entry" || (c.type || "").startsWith("entry.")
  );
  if (entryCard) {
    const ctx = (entryCard.slots as SlotValue).context;
    if (isContextSpec(ctx)) {
      context = formatContext(ctx);
    }
  }

  // Build summary from card descriptions
  const parts: string[] = [];

  for (const card of sortedCards) {
    const desc = describeCard(card);
    const role = desc.role;

    if (role === "entry") {
      // Extract trigger or use summary
      const triggerSection = desc.sections.find((s) => s.label === "Trigger");
      if (triggerSection && triggerSection.items.length > 0) {
        parts.push(triggerSection.items[0].text);
      } else if (desc.summary && desc.summary !== "Entry signal") {
        parts.push(desc.summary);
      }
    } else if (role === "exit") {
      // Use the exit summary which includes TP/SL details
      if (desc.summary) {
        parts.push(desc.summary);
      }
    }
  }

  // Prepend context if we have content
  if (context && parts.length > 0) {
    return `Trade ${context}: ${parts.join(" → ")}`;
  } else if (context) {
    return `Trade ${context}`;
  }

  return parts.join(" → ") || "Strategy";
}

/**
 * Get the display title for an archetype.
 */
export function getArchetypeTitle(archetypeId: string | undefined): string {
  if (!archetypeId) {
    return "Unknown Card";
  }

  const titles: Record<string, string> = {
    "entry.trend_pullback": "Trend Pullback Entry",
    "entry.rule_trigger": "Rule-Based Entry",
    "entry.range_mean_reversion": "Range Mean-Reversion Entry",
    "entry.breakout_trendfollow": "Breakout Trend-Follow Entry",
    "entry.breakout_retest": "Breakout Retest Entry",
    "entry.squeeze_expansion": "Squeeze Expansion Entry",
    "exit.trailing_stop": "Trailing Stop Exit",
    "exit.fixed_targets": "Fixed Targets Exit",
    "exit.rule_trigger": "Rule-Based Exit",
    "exit.band_exit": "Band-Based Exit",
    "gate.regime": "Regime Gate",
    "gate.time_filter": "Time Filter Gate",
    "overlay.regime_scaler": "Regime Scaler Overlay",
  };

  return titles[archetypeId] || formatArchetypeId(archetypeId);
}

/**
 * Format an archetype ID as a title (fallback).
 */
function formatArchetypeId(archetypeId: string): string {
  if (!archetypeId || !archetypeId.includes(".")) {
    return archetypeId || "Unknown";
  }
  // "entry.trend_pullback" → "Trend Pullback Entry"
  const [role, ...rest] = archetypeId.split(".");
  const name = rest
    .join("_")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  return `${name} ${roleTitle}`.trim();
}

/**
 * Get icon suggestion for a role.
 */
export function getRoleIcon(role: string): string {
  const icons: Record<string, string> = {
    entry: "TrendingUp",
    exit: "LogOut",
    gate: "Filter",
    overlay: "Layers",
  };
  return icons[role] || "Circle";
}
