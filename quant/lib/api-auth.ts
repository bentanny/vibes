import { NextRequest } from "next/server";
import { verifyIdToken } from "./firebase-admin";

/**
 * Get the Firebase user from the Authorization header in a Next.js API route
 * Returns null if no valid token is provided
 */
export async function getFirebaseUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decodedToken = await verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get the Firebase user ID token from cookies (for client-side requests)
 * This is a fallback for when tokens are stored in cookies
 */
export async function getFirebaseUserFromCookies(cookies: any) {
  const idToken = cookies.get("firebase_token")?.value;
  
  if (!idToken) {
    return null;
  }

  try {
    const decodedToken = await verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
  } catch (error) {
    return null;
  }
}

