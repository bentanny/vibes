import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "./firebase-admin";

export interface FirebaseUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Get the Firebase user from the Authorization header in a Next.js API route.
 * Returns null if no valid token is provided.
 */
export async function getFirebaseUser(
  request: NextRequest
): Promise<FirebaseUser | null> {
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
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Wrapper for API routes that require authentication.
 * Returns 401 if user is not authenticated.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ userId: user.uid });
 * });
 * ```
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: FirebaseUser
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getFirebaseUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Wrapper for API routes where authentication is optional.
 * User may be null if not authenticated.
 *
 * Usage:
 * ```ts
 * export const GET = withOptionalAuth(async (request, user) => {
 *   if (user) {
 *     return NextResponse.json({ message: `Hello ${user.email}` });
 *   }
 *   return NextResponse.json({ message: "Hello anonymous user" });
 * });
 * ```
 */
export function withOptionalAuth(
  handler: (
    request: NextRequest,
    user: FirebaseUser | null
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getFirebaseUser(request);
    return handler(request, user);
  };
}
