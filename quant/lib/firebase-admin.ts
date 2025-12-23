import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let auth: Auth;

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
  } else {
    // Use Application Default Credentials (works on GCP or with gcloud auth)
    app = initializeApp();
  }
  auth = getAuth(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { auth };

/**
 * Verify a Firebase ID token and return the decoded token
 */
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Invalid token: ${error}`);
  }
}

