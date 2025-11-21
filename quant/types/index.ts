import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type ChartMode =
  | "events"
  | "event-correlation"
  | "asset-correlation"
  | "3p-correlation"
  | "strategy";

export type StrategyType =
  | "event-correlation"
  | "asset-correlation"
  | "3p-correlation"
  | "specified-time"
  | "data-related";

// Message types: regular text messages vs strategy cards
export type MessageType = "text" | "strategy";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: MessageType; // "text" for regular messages, "strategy" for strategy cards
  isStrategy?: boolean; // Legacy support - maps to type === "strategy"
}
