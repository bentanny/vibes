/**
 * Session management for anonymous and authenticated users.
 *
 * Anonymous users get a session_id stored in localStorage that persists
 * their work (strategies, threads) until they log in. On login, we claim
 * all resources associated with their session_id and assign to their user_id.
 */

const SESSION_ID_KEY = "quant_session_id";

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a session ID for the current browser session.
 * This ID persists in localStorage and is used to track anonymous user work.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    // SSR - return a placeholder that will be replaced on client
    return "ssr-placeholder";
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Get the current session ID without creating one.
 * Returns null if no session exists.
 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(SESSION_ID_KEY);
}

/**
 * Clear the session ID (call after successful claim on login).
 * This ensures a fresh session if the user logs out and continues anonymously.
 */
export function clearSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(SESSION_ID_KEY);
}

/**
 * Claim all resources from the current session and assign to user.
 * Called after successful login to migrate anonymous work to the user's account.
 *
 * @param userId - Firebase user ID
 * @param idToken - Firebase ID token for authentication
 * @returns Promise with claim result
 */
export async function claimSession(
  userId: string,
  idToken: string
): Promise<{ success: boolean; claimed: number; error?: string }> {
  const sessionId = getSessionId();

  if (!sessionId) {
    // No session to claim - user logged in without doing any anonymous work
    return { success: true, claimed: 0 };
  }

  try {
    const response = await fetch("/api/claim-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        claimed: 0,
        error: error.message || "Failed to claim session",
      };
    }

    const result = await response.json();

    // Clear the session ID after successful claim
    // Next anonymous session will get a fresh ID
    clearSessionId();

    return {
      success: true,
      claimed: result.claimed || 0,
    };
  } catch (error) {
    console.error("Failed to claim session:", error);
    return {
      success: false,
      claimed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
