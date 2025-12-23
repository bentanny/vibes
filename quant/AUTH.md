# Authentication

This application uses Firebase Authentication (GCP Identity Platform) for user authentication.

## Architecture

### Frontend
- **Firebase Client SDK** (`lib/firebase.ts`) - Initializes Firebase Auth
- **Auth Context** (`contexts/auth-context.tsx`) - Provides `useAuth()` and `useSession()` hooks
- **Session Management** - Handled by Firebase Auth's `onAuthStateChanged` listener

### Backend (API Routes)
- **Firebase Admin SDK** (`lib/firebase-admin.ts`) - Verifies ID tokens server-side
- **API Auth Utilities** (`lib/api-auth.ts`) - Helper functions to extract user from requests
- **Token Verification** - All API routes verify Firebase ID tokens

## Usage

### Client-Side

```typescript
import { useAuth, useSession } from "@/contexts/auth-context";

// Get current user and auth methods
const { user, signInWithGoogle, signInWithEmail, signOut } = useAuth();

// Or use the compatibility hook (matches NextAuth API)
const { data: session, status } = useSession();
```

### Server-Side (API Routes)

```typescript
import { getFirebaseUser, getFirebaseUserFromCookies } from "@/lib/api-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // Try Authorization header first, then cookies
  let user = await getFirebaseUser(request);
  if (!user) {
    const cookieStore = await cookies();
    user = await getFirebaseUserFromCookies(cookieStore);
  }
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Use user.uid, user.email, etc.
}
```

### Authenticated API Calls

```typescript
import { authenticatedFetch } from "@/lib/api-client";

const response = await authenticatedFetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

## User Identification

- **User ID**: Firebase UID (`user.uid`)
- **Email**: `user.email`
- **Name**: `user.displayName` or `user.name`
- **Avatar**: `user.photoURL` or `user.picture`

## Token Management

- Tokens are automatically refreshed by Firebase Auth SDK
- Tokens are sent via `Authorization: Bearer <token>` header or cookies
- Server-side verification uses Firebase Admin SDK

## Notes

- Coinbase OAuth integration uses cookies for token storage (needs re-implementation)
- All authentication state is managed client-side by Firebase Auth
- Token refresh happens automatically - no manual handling needed

