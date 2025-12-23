import { auth } from "./firebase";

/**
 * Make an authenticated API request with Firebase ID token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  let idToken: string | null = null;

  if (user) {
    try {
      idToken = await user.getIdToken();
    } catch (error) {
      console.error("Failed to get ID token:", error);
    }
  }

  const headers = new Headers(options.headers);

  // Add Authorization header if we have a token
  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  // Also set token in cookie for Next.js API routes that might check cookies
  // Note: This requires the API route to read from cookies
  if (idToken && typeof document !== "undefined") {
    document.cookie = `firebase_token=${idToken}; path=/; max-age=3600; SameSite=Lax`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

