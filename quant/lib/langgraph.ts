export const LANGGRAPH_API_URL = "https://vibe-trade-agent-kff5sbwvca-uc.a.run.app";

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

  const finalAssistantId = assistantId && assistantId.trim() !== "" ? assistantId : "agent";
  console.log("StreamRun Config:", { threadId, assistantId, finalAssistantId });

  const body: Record<string, any> = {
    assistant_id: finalAssistantId,
    input,
    config: {
      configurable: {
        thread_id: threadId,
      },
    },
    stream_mode: ["values"],
    if_not_exists: "create",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
