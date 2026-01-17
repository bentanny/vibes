import { auth } from "./firebase";

/**
 * Make an authenticated API request with Firebase ID token.
 * Uses Authorization header only - no cookies for security.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  const headers = new Headers(options.headers);

  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers.set("Authorization", `Bearer ${idToken}`);
    } catch (error) {
      console.error("Failed to get ID token:", error);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
