import type { TradingArchetype } from "@/types";

export interface StrategyDefinition {
  type: TradingArchetype;
  title: string;
  description: string;
  color: "amber" | "emerald" | "blue" | "red";
}

export const STRATEGY_DEFINITIONS: Record<TradingArchetype, StrategyDefinition> = {
  "execution.dca": {
    type: "execution.dca",
    title: "Recurring Investment",
    description:
      "Automate steady accumulation by buying a fixed dollar amount at regular intervals.",
    color: "blue",
  },
  "execution.dca_sell": {
    type: "execution.dca_sell",
    title: "Recurring Divestment",
    description:
      "Automate steady distribution by selling a fixed dollar amount at regular intervals.",
    color: "red",
  },
  "execution.time_window": {
    type: "execution.time_window",
    title: "Time-Based Execution",
    description:
      "Restrict trading to specific market hours to capitalize on peak liquidity periods.",
    color: "blue",
  },
  "execution.scheduled": {
    type: "execution.scheduled",
    title: "Scheduled Execution",
    description:
      "Execute trades at specific recurring times, such as every Monday at 9am or the 1st of each month.",
    color: "blue",
  },
  "signal.percent_dip": {
    type: "signal.percent_dip",
    title: "Dip Buying",
    description:
      "Enter positions when asset price drops by a defined percentage from local highs.",
    color: "amber",
  },
  "signal.percent_spike": {
    type: "signal.percent_spike",
    title: "Spike Selling",
    description:
      "Exit positions when asset price spikes by a defined percentage from local lows.",
    color: "emerald",
  },
  "signal.price_limit": {
    type: "signal.price_limit",
    title: "Limit Orders",
    description:
      "Execute trades only when price touches a specific psychological or technical level.",
    color: "emerald",
  },
  "signal.price_limit_sell": {
    type: "signal.price_limit_sell",
    title: "Limit Order (Sell)",
    description:
      "Execute sell trades when price rises to touch a specific resistance or technical level.",
    color: "red",
  },
  "signal.metric_spike": {
    type: "signal.metric_spike",
    title: "Volume Spike",
    description:
      "Trigger entries when volume or volatility metrics exceed their standard deviation.",
    color: "red",
  },
  "signal.metric_spike_down": {
    type: "signal.metric_spike_down",
    title: "Volume Spike (Bearish)",
    description:
      "Trigger entries when volume spikes during a price decline, signaling distribution.",
    color: "red",
  },
  "signal.metric_dip_up": {
    type: "signal.metric_dip_up",
    title: "Volume Dip (Bullish)",
    description:
      "Trade when volume contracts during a price increase, signaling accumulation.",
    color: "blue",
  },
  "signal.metric_dip_down": {
    type: "signal.metric_dip_down",
    title: "Volume Dip (Bearish)",
    description:
      "Trade when both volume and price decline, signaling distribution.",
    color: "red",
  },
  "signal.supertrend": {
    type: "signal.supertrend",
    title: "Trend Filtering",
    description:
      "Stay in trades only while the Supertrend indicator confirms the directional bias.",
    color: "emerald",
  },
  "manage.trailing_stop": {
    type: "manage.trailing_stop",
    title: "Trailing Stop",
    description:
      "Protect gains by automatically adjusting stop-loss levels as price moves in your favor.",
    color: "red",
  },
  "manage.trailing_limit_buy": {
    type: "manage.trailing_limit_buy",
    title: "Trailing Limit Buy",
    description:
      "Enter positions when price breaks above a trailing resistance level.",
    color: "emerald",
  },
  "manage.trailing_buy": {
    type: "manage.trailing_buy",
    title: "Trailing Buy",
    description:
      "Enter positions when price breaks above a trailing resistance level.",
    color: "emerald",
  },
  "signal.trailing_limit_sell": {
    type: "signal.trailing_limit_sell",
    title: "Trailing Limit Sell",
    description:
      "Trigger sells when price breaks above a trailing resistance level.",
    color: "red",
  },
  "manage.profit_scaling": {
    type: "manage.profit_scaling",
    title: "Profit Scaling",
    description:
      "Systematically exit portions of your position at pre-defined profit targets.",
    color: "amber",
  },
  "signal.trend_pullback": {
    type: "signal.trend_pullback",
    title: "Trend Pullback",
    description:
      "Enter during temporary corrections within a strong trend, buying dips at key support levels.",
    color: "amber",
  },
  "signal.trend_pullback_sell": {
    type: "signal.trend_pullback_sell",
    title: "Trend Pullback Sell",
    description:
      "Exit during temporary rallies within a strong downtrend, selling bounces at key resistance levels.",
    color: "red",
  },
  "signal.range_mean_reversion": {
    type: "signal.range_mean_reversion",
    title: "Mean Reversion",
    description:
      "Capitalize on price extremes that tend to return to their statistical average over time.",
    color: "amber",
  },
  "signal.range_mean_reversion_sell": {
    type: "signal.range_mean_reversion_sell",
    title: "Mean Reversion Sell",
    description:
      "Capitalize on price extremes at the upper band that tend to return to their statistical average.",
    color: "red",
  },
  "signal.breakout_retest": {
    type: "signal.breakout_retest",
    title: "Breakout Retest",
    description:
      "Enter when price breaks resistance, pulls back to retest, and confirms the new support level.",
    color: "emerald",
  },
  "signal.breakout_retest_sell": {
    type: "signal.breakout_retest_sell",
    title: "Breakdown Retest",
    description:
      "Exit when price breaks support, pulls back to retest, and confirms the new resistance level.",
    color: "red",
  },
  "signal.xs_momentum": {
    type: "signal.xs_momentum",
    title: "Momentum Flag",
    description:
      "Identify consolidation patterns during strong moves that signal continuation of the trend.",
    color: "blue",
  },
  "signal.xs_momentum_sell": {
    type: "signal.xs_momentum_sell",
    title: "Momentum Flag Sell",
    description:
      "Identify consolidation patterns during strong downward moves that signal continuation of the decline.",
    color: "red",
  },
  "signal.pairs_relative_value": {
    type: "signal.pairs_relative_value",
    title: "Pairs Trading",
    description:
      "Trade the spread between correlated assets when they diverge beyond historical norms.",
    color: "amber",
  },
  "signal.pairs_relative_value_sell": {
    type: "signal.pairs_relative_value_sell",
    title: "Pairs Trading Sell",
    description:
      "Trade the spread by selling the outperforming asset when pairs diverge beyond historical norms.",
    color: "red",
  },
  "signal.breakout_trendfollow": {
    type: "signal.breakout_trendfollow",
    title: "Trend Following",
    description:
      "Ride extended directional moves by entering on higher lows and exiting on trend breaks.",
    color: "emerald",
  },
  "signal.breakout_trendfollow_sell": {
    type: "signal.breakout_trendfollow_sell",
    title: "Trend Following Sell",
    description:
      "Ride extended downward moves by entering on lower highs and exiting on trend breaks.",
    color: "red",
  },
  "signal.squeeze_expansion": {
    type: "signal.squeeze_expansion",
    title: "Volatility Squeeze",
    description:
      "Enter when Bollinger Bands contract, anticipating an explosive expansion move.",
    color: "amber",
  },
  "signal.squeeze_expansion_sell": {
    type: "signal.squeeze_expansion_sell",
    title: "Volatility Squeeze Sell",
    description:
      "Enter when Bollinger Bands contract, anticipating an explosive downward expansion move.",
    color: "red",
  },
  "signal.intermarket_trigger": {
    type: "signal.intermarket_trigger",
    title: "Intermarket Analysis",
    description:
      "Trade assets based on leading relationships with bonds, currencies, or commodities.",
    color: "blue",
  },
  "signal.intermarket_trigger_sell": {
    type: "signal.intermarket_trigger_sell",
    title: "Intermarket Analysis Sell",
    description:
      "Trade assets based on leading relationships with bonds, currencies, or commodities signaling downside.",
    color: "red",
  },
  "signal.avwap_reversion": {
    type: "signal.avwap_reversion",
    title: "Anchored VWAP",
    description:
      "Use volume-weighted average price from key events as dynamic support and resistance.",
    color: "blue",
  },
  "signal.avwap_reversion_sell": {
    type: "signal.avwap_reversion_sell",
    title: "Anchored VWAP Sell",
    description:
      "Use volume-weighted average price from key events as dynamic resistance for short entries.",
    color: "red",
  },
  "signal.event_followthrough": {
    type: "signal.event_followthrough",
    title: "Event-Driven",
    description:
      "Position around earnings, catalysts, or news events that create volatility opportunities.",
    color: "red",
  },
  "signal.event_followthrough_sell": {
    type: "signal.event_followthrough_sell",
    title: "Event-Driven Sell",
    description:
      "Position around earnings, catalysts, or news events that create downward volatility opportunities.",
    color: "red",
  },
  "signal.gap_play": {
    type: "signal.gap_play",
    title: "Gap Trading",
    description:
      "Trade opening gaps that show strong continuation momentum with follow-through volume.",
    color: "emerald",
  },
  "signal.gap_play_sell": {
    type: "signal.gap_play_sell",
    title: "Gap Trading Sell",
    description:
      "Trade opening gaps down that show strong continuation momentum with follow-through volume.",
    color: "red",
  },
  "signal.liquidity_sweep": {
    type: "signal.liquidity_sweep",
    title: "Liquidity Sweep",
    description:
      "Enter after stop hunts clear weak hands below support, then reclaim the key level.",
    color: "red",
  },
  "overlay.seasonality_tod": {
    type: "overlay.seasonality_tod",
    title: "Seasonality & Time of Day",
    description:
      "Exploit recurring patterns driven by time of day, day of week, or seasonal market behaviors.",
    color: "blue",
  },
  "signal.trailing_limit_buy": {
      type: "signal.trailing_limit_buy",
      title: "Trailing Limit Buy",
      description: "Enter positions when price breaks above a trailing resistance level.",
      color: "emerald"
  }
} as Record<TradingArchetype, StrategyDefinition>;

