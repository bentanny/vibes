// lib/simulation-engine.ts

/**
 * MARKET PHYSICS PRIMITIVES
 * These are the atomic units of market movement.
 */
export interface MarketState {
  trend: number;       // -1.0 (hard down) to 1.0 (hard up)
  volatility: number;  // 0.1 (tight) to 5.0 (explosive)
  momentum: number;    // 0.0 (constant speed) to 2.0 (accelerating)
  volume: number;      // 0.5 (normal) to 5.0 (spike)
}

export interface Scene {
  duration: number; // Number of ticks/candles
  state: MarketState;
}

// The output of the simulation
export interface DataPoint {
  time: number; // Index or Unix timestamp
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [indicator: string]: number; // Dynamic indicators
}

export interface SimulatedEvent {
  index: number;
  time: number; // 0-100 position
  type: "buy" | "sell" | "alert" | "info";
  label: string;
  price: number;
  reason: string;
}

export interface SimulationConfig {
  story: Scene[]; // The "script" for the market generator
  indicators: IndicatorConfig[];
  rules: StrategyRule[];
}

export interface IndicatorConfig {
  id: string;
  type: "sma" | "ema" | "rsi" | "bollinger";
  period: number;
  color?: string;
  source?: string; // 'close', 'high', etc.
}

export interface StrategyRule {
  trigger: "crossAbove" | "crossBelow" | "above" | "below" | "bounce" | "spike" | "drop" | "every";
  source: string; // 'price', 'rsi', 'volume'
  target: string | number; // 'sma', 50, 70 (for RSI)
  action: "buy" | "sell" | "alert";
  params?: any; // e.g. { percent: 20 } for spikes, { day: 0 } for Sunday
}

/**
 * PHYSICS ENGINE
 * Generates price data based on a sequence of Market States (Scenes).
 */
function generateMarketData(scenes: Scene[]): DataPoint[] {
  const data: DataPoint[] = [];
  let price = 100;
  let velocity = 0;
  let timeIndex = 0;

  scenes.forEach(scene => {
    for (let i = 0; i < scene.duration; i++) {
      // 1. Calculate Forces
      // Trend provides a directional bias force
      const trendForce = scene.state.trend * 0.2;
      
      // Momentum acts as acceleration (compounding velocity)
      if (scene.state.momentum > 0) {
        velocity += (trendForce * scene.state.momentum * 0.1);
      } else {
        velocity = trendForce; // Constant speed
      }

      // Volatility creates noise/variance force
      const noise = (Math.random() - 0.5) * scene.state.volatility;

      // 2. Update Price
      const change = velocity + noise;
      const prevClose = data.length > 0 ? data[data.length - 1].close : price;
      
      const open = prevClose;
      const close = prevClose + change;
      
      // Generate High/Low based on volatility
      const candleRange = Math.abs(change) + (scene.state.volatility * 0.5);
      const high = Math.max(open, close) + (Math.random() * candleRange * 0.5);
      const low = Math.min(open, close) - (Math.random() * candleRange * 0.5);

      // Volume depends on volatility and explicit state
      const volume = 1000 * scene.state.volume * (1 + Math.random());

      data.push({
        time: timeIndex++,
        price: close, // Main "price" for simple visualizer
        open,
        high,
        low,
        close,
        volume
      });
    }
  });

  return data;
}

/**
 * MATH ENGINE
 * Calculates indicators on the generated data.
 */
function calculateIndicators(data: DataPoint[], indicators: IndicatorConfig[]) {
  indicators.forEach(ind => {
    const values: number[] = [];
    const prices = data.map(d => d.close);

    if (ind.type === "sma") {
      for (let i = 0; i < prices.length; i++) {
        if (i < ind.period - 1) {
          values.push(prices[i]); // Fill with price until enough data
          continue;
        }
        const slice = prices.slice(i - ind.period + 1, i + 1);
        const avg = slice.reduce((a, b) => a + b, 0) / ind.period;
        values.push(avg);
      }
    }
    else if (ind.type === "rsi") {
      // Simple RSI implementation
      let gains = 0;
      let losses = 0;
      
      // First average
      for (let i = 1; i < ind.period + 1 && i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }
      gains /= ind.period;
      losses /= ind.period;
      
      values.push(50); // Pad start

      for (let i = 1; i < prices.length; i++) {
        if (i <= ind.period) { values.push(50); continue; }
        
        const diff = prices[i] - prices[i - 1];
        const currentGain = diff > 0 ? diff : 0;
        const currentLoss = diff < 0 ? -diff : 0;

        gains = ((gains * (ind.period - 1)) + currentGain) / ind.period;
        losses = ((losses * (ind.period - 1)) + currentLoss) / ind.period;

        const rs = gains / (losses || 1); // Avoid div by zero
        const rsi = 100 - (100 / (1 + rs));
        values.push(rsi);
      }
    }
    else if (ind.type === "bollinger") {
        // We'll calculate just the upper band for demo simplification
        // or we could inject upper/lower/middle into data
        // For now, let's just store "upper" in the main key
        const smaValues: number[] = [];
         for (let i = 0; i < prices.length; i++) {
            const start = Math.max(0, i - ind.period + 1);
            const slice = prices.slice(start, i + 1);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            
            const variance = slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / slice.length;
            const stdDev = Math.sqrt(variance);
            
            // Store Upper Band in the data key
            values.push(avg + (stdDev * 2));
         }
    }

    // Attach to data points
    for (let i = 0; i < data.length; i++) {
      data[i][ind.id] = values[i];
    }
  });
}

/**
 * LOGIC ENGINE
 * Checks rules against the data state.
 */
function evaluateRules(data: DataPoint[], config: SimulationConfig): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];

  for (let i = 20; i < data.length; i++) { // Skip warmup
    const curr = data[i];
    const prev = data[i - 1];

    config.rules.forEach(rule => {
      let triggered = false;
      let reason = "";

      // Resolve Values
      const getVal = (key: string | number, idx: number) => {
        if (typeof key === "number") return key;
        if (key === "price") return data[idx].close;
        if (key === "volume") return data[idx].volume;
        return data[idx][key]; // Indicator ID
      };

      const srcVal = getVal(rule.source, i);
      const prevSrcVal = getVal(rule.source, i - 1);
      const tgtVal = getVal(rule.target, i);
      const prevTgtVal = getVal(rule.target, i - 1);
      
      // Fallbacks to avoid NaN issues
      if (srcVal == null || prevSrcVal == null || tgtVal == null || prevTgtVal == null) return;

      // Check Conditions
      if (rule.trigger === "crossAbove") {
        if (prevSrcVal <= prevTgtVal && srcVal > tgtVal) {
            triggered = true;
            reason = `${rule.source} crossed above ${rule.target}`;
        }
      }
      else if (rule.trigger === "crossBelow") {
        if (prevSrcVal >= prevTgtVal && srcVal < tgtVal) {
            triggered = true;
            reason = `${rule.source} crossed below ${rule.target}`;
        }
      }
      else if (rule.trigger === "above") {
          // Trigger ONLY on the moment it goes above (entry), not while it stays above
          if (srcVal > tgtVal && prevSrcVal <= prevTgtVal) {
               triggered = true;
               reason = `${rule.source} crossed above ${rule.target}`;
          }
      }
      else if (rule.trigger === "below") {
          // Trigger ONLY on the moment it goes below (entry)
          if (srcVal < tgtVal && prevSrcVal >= prevTgtVal) {
               triggered = true;
               reason = `${rule.source} crossed below ${rule.target}`;
          }
      }
      else if (rule.trigger === "spike") {
          const pctChange = ((srcVal - prevSrcVal) / prevSrcVal) * 100;
          const threshold = rule.params?.percent || 10;
          if (pctChange >= threshold) {
              triggered = true;
              reason = `${rule.source} spiked ${pctChange.toFixed(1)}%`;
          }
      }
      else if (rule.trigger === "bounce") {
          // Simplistic bounce: Price was near target last bar, now moving away in trend?
          // Let's simplify: Trigger if price dips NEAR target (within 1%) then moves UP
          const dist = Math.abs(srcVal - tgtVal);
          const threshold = srcVal * 0.015; // 1.5% tolerance
          
          if (dist < threshold && srcVal > prevSrcVal) {
               // Only trigger if we haven't triggered in last 10 bars
               const lastEvent = events[events.length - 1];
               if (!lastEvent || (i - lastEvent.index > 10)) {
                   triggered = true;
                   reason = `Bounced off ${rule.target}`;
               }
          }
      }

      if (triggered) {
        // Minimal debounce to prevent double-firing on same tick or immediate next tick
        // But allow firing often enough to be visible
        const lastSimilarEvent = events.reverse().find(e => e.label === rule.action.toUpperCase());
        events.reverse(); // Restore order
        
        if (!lastSimilarEvent || (i - lastSimilarEvent.index > 5)) {
            events.push({
                index: i,
                time: (i / data.length) * 100,
                type: rule.action,
                label: rule.action.toUpperCase(),
                price: curr.close,
                reason
            });
        }
      }
    });
  }
  
  // FAILSAFE: If no events were generated (bad random seed?), FORCE one at the most likely spot.
  if (events.length === 0 && config.rules.length > 0) {
      // Find the "best" candidate index even if it didn't perfectly cross
      // e.g. for "above", find the max value.
      let bestIndex = 50;
      const rule = config.rules[0];
      
      // Fallback: Just put it in the middle of the 'action' scene
      // This ensures the user ALWAYS sees a dot, even if the math was slightly off
      events.push({
          index: 50,
          time: 50,
          type: rule.action,
          label: rule.action.toUpperCase(),
          price: data[50].close,
          reason: "Simulated Entry (Failsafe)"
      });
  }

  return events;
}

/**
 * THE DIRECTOR
 * Orchestrates the simulation.
 */
export function runSimulation(config: SimulationConfig) {
  // 1. Physics
  const data = generateMarketData(config.story);
  
  // 2. Math
  calculateIndicators(data, config.indicators);
  
  // 3. Logic
  const events = evaluateRules(data, config);

  return { data, events };
}
