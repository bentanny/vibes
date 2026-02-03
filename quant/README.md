# Vibe Trade UI

Next.js application for Vibe Trade with Firebase Authentication.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Authentication

This application uses Firebase Authentication (GCP Identity Platform) for user authentication.

### Architecture

**Frontend:**
- Firebase Client SDK (`lib/firebase.ts`) - Initializes Firebase Auth
- Auth Context (`contexts/auth-context.tsx`) - Provides `useAuth()` and `useSession()` hooks
- Session Management - Handled by Firebase Auth's `onAuthStateChanged` listener

**Backend (API Routes):**
- Firebase Admin SDK (`lib/firebase-admin.ts`) - Verifies ID tokens server-side
- API Auth Utilities (`lib/api-auth.ts`) - Helper functions to extract user from requests
- Token Verification - All API routes verify Firebase ID tokens

### Usage

**Client-Side:**
```typescript
import { useAuth, useSession } from "@/contexts/auth-context";

// Get current user and auth methods
const { user, signInWithGoogle, signInWithEmail, signOut } = useAuth();

// Or use the compatibility hook (matches NextAuth API)
const { data: session, status } = useSession();
```

**Server-Side (API Routes):**
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

**Authenticated API Calls:**
```typescript
import { authenticatedFetch } from "@/lib/api-client";

const response = await authenticatedFetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### Troubleshooting

**"Unauthorized Domain" Error:**
1. Check Firebase Console → Authentication → Settings → Authorized domains
2. Ensure your domain is listed (e.g., `vibe-trade-ui-kff5sbwvca-uc.a.run.app`)
3. Check Google Cloud Console → APIs & Services → Credentials
4. Find your OAuth client (matching Client ID from Firebase Console)
5. Add redirect URI: `https://[PROJECT_ID].firebaseapp.com/__/auth/handler`
6. Wait 2-3 minutes after changes

**Verify Deployed Configuration:**
```bash
# Check what Firebase config is in deployed app
curl https://your-app.run.app/api/debug/firebase-config

# Or enable diagnostics in browser console
localStorage.setItem('firebase-diagnostics', 'true');
location.reload();
```

## Deployment

### Prerequisites

1. GCP Project with Firebase/Identity Platform enabled
2. Firebase Authentication configured
3. Terraform configured (see `vibe-trade-terraform/`)
4. Docker installed locally
5. `gcloud` CLI installed and authenticated

### Configuration

Firebase configuration is automatically loaded from `terraform.tfvars` during Docker build:

```hcl
# In vibe-trade-terraform/terraform.tfvars
firebase_api_key     = "your-api-key"
firebase_auth_domain = "your-project.firebaseapp.com"
firebase_project_id  = "your-project-id"

# Optional: LangGraph Agent URL
langgraph_api_url = "https://vibe-trade-agent-kff5sbwvca-uc.a.run.app"
```

For local development, create a `.env` file with `NEXT_PUBLIC_FIREBASE_*` variables.

### Local UI Against Prod Services

If you want to run the UI locally but point it at production services (API, Execution, MCP/LangGraph, Firebase),
set the env vars below in `vibe-trade-ui/quant/.env.local` and restart the dev server.
Do **not** set the auth emulator URL when targeting prod.

```bash
# vibe-trade-ui/quant/.env.local
NEXT_PUBLIC_VIBE_API_URL="https://<prod-vibe-trade-api>"
NEXT_PUBLIC_EXECUTION_API_URL="https://<prod-vibe-trade-execution>"
NEXT_PUBLIC_LANGGRAPH_API_URL="https://<prod-vibe-trade-agent>"

# Firebase (prod project)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# IMPORTANT: unset/omit this when using prod auth
# NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=""
```

Notes:
- For Next.js dev, env changes are read at startup; restart `make dev` after edits.
- Server-side routes may also read `VIBE_TRADE_API_URL` (non-`NEXT_PUBLIC`). If you see server-side calls
  still going to localhost, set `VIBE_TRADE_API_URL` in the same file.

### Deploy

```bash
cd vibes/quant

# Build and deploy
make deploy

# Or step by step:
make docker-build-push  # Build and push image
make force-revision     # Update Cloud Run
```

### Configuration Patterns

**Build-Time Variables (UI):**
- Firebase config (`NEXT_PUBLIC_*`) - Baked into JavaScript bundle at build time
- Source: `terraform.tfvars` → `Makefile` → Docker build args
- Must rebuild to change these values

**Runtime Variables:**
- SnapTrade credentials - Set as environment variables by Terraform
- Can be changed without rebuilding (update Terraform and redeploy)

**Note:** Console logging is automatically disabled in production builds (except `console.error` and `console.warn`).

### Makefile Commands

- `make install` - Install npm dependencies
- `make dev` - Run development server locally
- `make build` - Build Next.js application
- `make docker-build` - Build Docker image (requires Firebase config in terraform.tfvars)
- `make docker-push` - Push Docker image to Artifact Registry
- `make docker-build-push` - Build and push image
- `make deploy` - Full deployment (build, push, update Cloud Run)
- `make force-revision` - Force Cloud Run to use latest image

## Development

### Tech Stack

- Next.js 14 (App Router)
- Firebase Authentication
- TypeScript
- Tailwind CSS
- HeroUI components

### Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - React components
- `contexts/` - React contexts (auth, snaptrade)
- `lib/` - Utility functions and Firebase setup
- `hooks/` - Custom React hooks

## License

Licensed under the [MIT license](./LICENSE).
