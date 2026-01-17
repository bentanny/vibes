import { auth } from "./firebase";
import { getOrCreateSessionId } from "./session";

export const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ||
  "https://vibe-trade-agent-kff5sbwvca-uc.a.run.app";

export interface LangGraphConfig {
  threadId: string;
  assistantId?: string;
}

export async function* streamRun(
  input: Record<string, any>,
  config: LangGraphConfig
) {
  const { threadId, assistantId } = config;
  const url = `${LANGGRAPH_API_URL}/threads/${threadId}/runs/stream`;

  const finalAssistantId =
    assistantId && assistantId.trim() !== "" ? assistantId : "agent";

  // Get LangSmith API key from environment (build-time variable) - REQUIRED
  const langsmithApiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;

  if (!langsmithApiKey) {
    throw new Error("NEXT_PUBLIC_LANGSMITH_API_KEY is not configured");
  }

  // Get session ID (always present - for anonymous user tracking)
  const sessionId = getOrCreateSessionId();

  // Get Firebase ID token if user is logged in (OPTIONAL - for user identification)
  const user = auth.currentUser;
  let idToken: string | null = null;

  if (user) {
    try {
      idToken = await user.getIdToken();
    } catch (error) {
      console.error(
        "Failed to get Firebase ID token for LangGraph API:",
        error
      );
      // Don't fail - Firebase token is optional for anonymous users
    }
  }

  // Get user ID if logged in
  const userId = user?.uid || null;

  const body: Record<string, any> = {
    assistant_id: finalAssistantId,
    input,
    config: {
      configurable: {
        thread_id: threadId,
        // Always pass session_id for anonymous user tracking
        session_id: sessionId,
        // Pass user_id if logged in
        ...(userId ? { user_id: userId } : {}),
      },
    },
    stream_mode: ["values"],
    if_not_exists: "create",
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Api-Key": langsmithApiKey, // Required for LangGraph authentication
  };

  // Optionally add Firebase token for user identification (if logged in)
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LangGraph API Error Body:", errorText);
    throw new Error(
      `LangGraph API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event: ")) {
          // SSE event type, we can skip or use if needed
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          try {
            const jsonStr = trimmed.slice(6);
            const data = JSON.parse(jsonStr);
            yield data;
          } catch (e) {
            console.warn("Failed to parse LangGraph data:", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
