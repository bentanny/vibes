// lib/strategy-parser.ts
import { SimulationConfig, Scene, IndicatorConfig, StrategyRule } from "./simulation-engine";

/**
 * PHASE COMPOSER
 * Dynamically constructs a market story based on structural constraints.
 * 
 * It breaks every strategy into 3 phases:
 * 1. Context (The Setup)
 * 2. Action (The Trigger Event)
 * 3. Resolution (The Outcome)
 */
function composeMarketStory(text: string): Scene[] {
  const scenes: Scene[] = [];
  const t = text.toLowerCase();
  
  // --- 1. ANALYZE INTENT ---
  const isShort = t.includes("short") || t.includes("sell") || t.includes("bear");
  const isBreakout = t.includes("break") || t.includes("spike") || t.includes("cross") || t.includes("above") || t.includes("below");
  const isMeanReversion = t.includes("pullback") || t.includes("dip") || t.includes("bounce") || t.includes("rsi") || t.includes("band");
  const isVolatile = t.includes("volatile") || t.includes("chop");

  // Defaults
  let trendDir = isShort ? -0.5 : 0.5;
  
  // --- 2. PHASE 1: CONTEXT (The Setup) ---
  if (isBreakout) {
      // Breakouts need compression/consolidation first
      scenes.push({ 
          duration: 35, 
          state: { trend: trendDir * 0.2, volatility: 0.3, momentum: 0, volume: 0.5 } 
      });
  } 
  else if (isMeanReversion) {
      // Reversion needs a strong trend to revert FROM
      // If we want to buy a dip, we need a strong uptrend first
      scenes.push({ 
          duration: 35, 
          state: { trend: trendDir, volatility: 0.8, momentum: 0.2, volume: 1.0 } 
      });
  } 
  else {
      // Default trending context
      scenes.push({ 
          duration: 40, 
          state: { trend: trendDir * 0.5, volatility: 0.6, momentum: 0, volume: 1.0 } 
      });
  }

  // --- 3. PHASE 2: ACTION (The Trigger) ---
  if (isBreakout) {
      // Violent move in the direction of the trade
      // High volatility + High Momentum
      scenes.push({ 
          duration: 15, 
          state: { trend: trendDir * 2.0, volatility: 3.5, momentum: 1.5, volume: 3.0 } 
      });
  } 
  else if (isMeanReversion) {
      // Counter-trend move (The dip/spike)
      // Must move OPPOSITE to the main trend temporarily
      const counterDir = trendDir * -1.5; 
      scenes.push({ 
          duration: 15, 
          state: { trend: counterDir, volatility: 1.2, momentum: 0.5, volume: 1.2 } 
      });
  } 
  else if (isVolatile) {
      scenes.push({
          duration: 20,
          state: { trend: 0, volatility: 4.0, momentum: 0, volume: 2.0 }
      });
  }

  // --- 4. PHASE 3: RESOLUTION (The Aftermath) ---
  if (isMeanReversion) {
      // Return to original trend (The bounce)
      scenes.push({ 
          duration: 35, 
          state: { trend: trendDir, volatility: 0.9, momentum: 0.3, volume: 1.5 } 
      });
  } else {
      // Continuation of the move
      scenes.push({ 
          duration: 35, 
          state: { trend: trendDir * 0.8, volatility: 1.5, momentum: 0.2, volume: 1.0 } 
      });
  }

  return scenes;
}

export function parseStrategyToConfig(input: string): SimulationConfig {
  const text = input.toLowerCase();
  
  // 1. Direct the Story using Phase Composer
  const story = composeMarketStory(text);
  
  // 2. Configure Indicators (Heuristics)
  const indicators: IndicatorConfig[] = [];
  
  if (text.includes("sma") || text.includes("moving average") || (!text.includes("rsi") && !text.includes("bollinger"))) {
    // Default to SMA if no specific indicator mentioned
    indicators.push({ id: "sma", type: "sma", period: 20, color: "#3b82f6" });
  }
  if (text.includes("rsi")) {
    indicators.push({ id: "rsi", type: "rsi", period: 14, color: "#a8a29e" });
  }
  if (text.includes("bollinger") || text.includes("band")) {
    indicators.push({ id: "bb_upper", type: "bollinger", period: 20, color: "#a8a29e" });
  }

  // 3. Define Rules (Logic)
  const rules: StrategyRule[] = [];

  // RSI Logic
  if (text.includes("rsi")) {
      if (text.includes("buy")) {
          rules.push({ trigger: "below", source: "rsi", target: 30, action: "buy" });
      } else if (text.includes("spike")) {
          rules.push({ trigger: "spike", source: "rsi", target: 0, params: { percent: 10 }, action: "buy" });
      } else {
           rules.push({ trigger: "above", source: "rsi", target: 70, action: "sell" });
      }
  }
  // Bollinger Logic
  else if (text.includes("bollinger")) {
      rules.push({ trigger: "crossAbove", source: "price", target: "bb_upper", action: "sell" });
  }
  // Spike Logic
  else if (text.includes("spike")) {
      rules.push({ trigger: "spike", source: "price", target: 0, params: { percent: 3 }, action: "alert" });
  }
  // General Logic (Cross/Bounce)
  else {
      const isShort = text.includes("short") || text.includes("sell");
      const isCross = text.includes("cross") || text.includes("break");
      
      // Default target
      const target = "sma";
      
      if (isShort) {
          if (isCross) rules.push({ trigger: "crossBelow", source: "price", target, action: "sell" });
          else rules.push({ trigger: "bounce", source: "price", target, action: "sell" }); // Rejection off SMA
      } else {
          if (isCross) rules.push({ trigger: "crossAbove", source: "price", target, action: "buy" });
          else rules.push({ trigger: "bounce", source: "price", target, action: "buy" }); // Bounce off SMA
      }
  }

  return {
    story,
    indicators,
    rules
  };
}
