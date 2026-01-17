import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let auth: Auth;
let initializationError: string | null = null;

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  // For local development, you can use Application Default Credentials
  // or provide a service account key file
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("[Firebase Admin] Initialized with service account key");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use ADC with explicit credentials file
    app = initializeApp();
    console.log(
      "[Firebase Admin] Initialized with GOOGLE_APPLICATION_CREDENTIALS"
    );
  } else {
    // Use Application Default Credentials (works on GCP or with gcloud auth)
    try {
      app = initializeApp();
      console.log("[Firebase Admin] Initialized with Application Default Credentials");
    } catch (error) {
      initializationError =
        "Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY " +
        "or GOOGLE_APPLICATION_CREDENTIALS, or run on GCP with default credentials.";
      console.error(`[Firebase Admin] ${initializationError}`);
      // Create a placeholder app to prevent crashes
      app = initializeApp({ projectId: "demo-project" });
    }
  }
  auth = getAuth(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { auth };

/**
 * Verify a Firebase ID token and return the decoded token.
 * Throws an error if verification fails or Firebase Admin is not properly configured.
 */
export async function verifyIdToken(idToken: string) {
  if (initializationError) {
    throw new Error(initializationError);
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("INVALID_ARGUMENT")) {
        throw new Error("Invalid ID token format");
      }
      if (error.message.includes("expired")) {
        throw new Error("ID token has expired");
      }
      if (error.message.includes("Firebase ID token has been revoked")) {
        throw new Error("ID token has been revoked");
      }
    }
    throw new Error(`Token verification failed: ${error}`);
  }
}
