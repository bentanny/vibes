/**
 * Card parameter extraction utilities.
 *
 * Automatically extracts tweakable parameters from card slots
 * by recognizing common primitive patterns (BandSpec, MASpec, etc.).
 */

export interface TweakableParam {
  path: string; // e.g., "event.dip_band.mult"
  label: string; // Human-readable label
  value: number;
  type: "int" | "float";
  min: number;
  max: number;
  step: number;
  description?: string;
}

export interface ExtractedParams {
  cardId: string;
  cardName: string;
  role: string;
  archetypeId: string;
  params: TweakableParam[];
}

/**
 * Primitive type signatures and their tweakable fields.
 */
const PRIMITIVE_EXTRACTORS: Array<{
  name: string;
  // Keys that must exist to identify this primitive
  signature: string[];
  // Fields to extract with their constraints
  fields: Array<{
    key: string;
    label: string;
    type: "int" | "float";
    min: number;
    max: number;
    step: number;
    description?: string;
  }>;
}> = [
  {
    name: "BandSpec",
    signature: ["band", "length"],
    fields: [
      {
        key: "length",
        label: "Length",
        type: "int",
        min: 5,
        max: 400,
        step: 1,
        description: "Lookback period in bars",
      },
      {
        key: "mult",
        label: "Multiplier",
        type: "float",
        min: 0.5,
        max: 4.0,
        step: 0.1,
        description: "Standard deviation multiplier",
      },
    ],
  },
  {
    name: "MASpec",
    signature: ["fast", "slow", "op"],
    fields: [
      {
        key: "fast",
        label: "Fast MA",
        type: "int",
        min: 5,
        max: 200,
        step: 1,
        description: "Fast moving average period",
      },
      {
        key: "slow",
        label: "Slow MA",
        type: "int",
        min: 10,
        max: 400,
        step: 1,
        description: "Slow moving average period",
      },
    ],
  },
  {
    name: "RegimeSpec",
    signature: ["metric", "op", "value"],
    fields: [
      {
        key: "value",
        label: "Threshold",
        type: "float",
        min: -100,
        max: 100,
        step: 1,
        description: "Comparison threshold",
      },
      {
        key: "ma_fast",
        label: "Fast MA",
        type: "int",
        min: 5,
        max: 200,
        step: 1,
        description: "Fast MA period (if applicable)",
      },
      {
        key: "ma_slow",
        label: "Slow MA",
        type: "int",
        min: 10,
        max: 400,
        step: 1,
        description: "Slow MA period (if applicable)",
      },
      {
        key: "lookback_bars",
        label: "Lookback",
        type: "int",
        min: 10,
        max: 500,
        step: 10,
        description: "Lookback period in bars",
      },
    ],
  },
  {
    name: "BreakoutSpec",
    signature: ["lookback_bars"],
    fields: [
      {
        key: "lookback_bars",
        label: "Lookback",
        type: "int",
        min: 5,
        max: 200,
        step: 1,
        description: "Bars to look back for breakout level",
      },
      {
        key: "buffer_bps",
        label: "Buffer (bps)",
        type: "float",
        min: 0,
        max: 100,
        step: 5,
        description: "Buffer in basis points",
      },
    ],
  },
  {
    name: "PositionRiskSpec",
    signature: ["sl_atr"],
    fields: [
      {
        key: "sl_atr",
        label: "Stop Loss (ATR)",
        type: "float",
        min: 0.5,
        max: 5.0,
        step: 0.25,
        description: "Stop loss in ATR multiples",
      },
      {
        key: "tp_atr",
        label: "Take Profit (ATR)",
        type: "float",
        min: 0.5,
        max: 10.0,
        step: 0.25,
        description: "Take profit in ATR multiples",
      },
    ],
  },
  {
    name: "ScaleFactors",
    signature: ["scale_size_frac"],
    fields: [
      {
        key: "scale_size_frac",
        label: "Size Scale",
        type: "float",
        min: 0.1,
        max: 2.0,
        step: 0.1,
        description: "Position size scaling factor",
      },
    ],
  },
  {
    name: "SizingSpec (pct_equity)",
    signature: ["type", "pct"],
    fields: [
      {
        key: "pct",
        label: "Position Size %",
        type: "float",
        min: 1,
        max: 100,
        step: 1,
        description: "Percentage of equity to allocate per trade",
      },
    ],
  },
  {
    name: "SizingSpec (fixed_usd)",
    signature: ["type", "usd"],
    fields: [
      {
        key: "usd",
        label: "Fixed USD",
        type: "float",
        min: 100,
        max: 100000,
        step: 100,
        description: "Fixed USD amount to invest per trade",
      },
    ],
  },
  {
    name: "SizingSpec (fixed_units)",
    signature: ["type", "units"],
    fields: [
      {
        key: "units",
        label: "Fixed Units",
        type: "float",
        min: 0.001,
        max: 1000,
        step: 0.001,
        description: "Fixed number of units/shares to trade",
      },
    ],
  },
];

/**
 * Check if an object matches a primitive signature.
 */
function matchesPrimitive(
  obj: Record<string, unknown>,
  signature: string[]
): boolean {
  return signature.every((key) => key in obj);
}

/**
 * Recursively extract tweakable parameters from an object.
 */
function extractFromObject(
  obj: unknown,
  currentPath: string,
  params: TweakableParam[]
): void {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      extractFromObject(item, `${currentPath}[${index}]`, params);
    });
    return;
  }

  const record = obj as Record<string, unknown>;

  // Check if this object matches any primitive
  for (const extractor of PRIMITIVE_EXTRACTORS) {
    if (matchesPrimitive(record, extractor.signature)) {
      // Extract tweakable fields from this primitive
      for (const field of extractor.fields) {
        const value = record[field.key];
        if (typeof value === "number") {
          params.push({
            path: currentPath ? `${currentPath}.${field.key}` : field.key,
            label: field.label,
            value,
            type: field.type,
            min: field.min,
            max: field.max,
            step: field.step,
            description: field.description,
          });
        }
      }
      // Don't recurse into matched primitives
      return;
    }
  }

  // Recurse into child objects
  for (const [key, value] of Object.entries(record)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    extractFromObject(value, newPath, params);
  }
}

/**
 * Extract tweakable parameters from a card's slots.
 */
export function extractCardParams(card: {
  id: string;
  name: string;
  role?: string;
  archetype_id: string;
  slots: Record<string, unknown>;
}): ExtractedParams {
  const params: TweakableParam[] = [];

  // Extract from slots (skip context which is usually symbol/tf)
  for (const [slotKey, slotValue] of Object.entries(card.slots)) {
    if (slotKey === "context") continue;
    extractFromObject(slotValue, slotKey, params);
  }

  return {
    cardId: card.id,
    cardName: card.name,
    role: card.role || "entry",
    archetypeId: card.archetype_id,
    params,
  };
}

/**
 * Format a parameter value for display.
 */
export function formatParamValue(param: TweakableParam): string {
  if (param.type === "int") {
    return param.value.toString();
  }
  return param.value.toFixed(2);
}

/**
 * Get a human-readable summary of a card's key parameters.
 */
export function getCardSummary(params: ExtractedParams): string {
  if (params.params.length === 0) {
    return "No tweakable parameters";
  }

  const summaryParts = params.params.slice(0, 3).map((p) => {
    return `${p.label}: ${formatParamValue(p)}`;
  });

  if (params.params.length > 3) {
    summaryParts.push(`+${params.params.length - 3} more`);
  }

  return summaryParts.join(" · ");
}
