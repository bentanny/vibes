import { NextResponse } from "next/server";

/**
 * Debug endpoint to check Firebase configuration in deployed app
 * Only available in production for troubleshooting
 */
export async function GET() {
  // Only show config in production (for debugging deployment issues)
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in production" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    firebase_api_key: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 20)}...`
      : "NOT SET",
    firebase_auth_domain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "NOT SET",
    firebase_project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT SET",
    firebase_storage_bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "NOT SET",
    firebase_messaging_sender_id: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "NOT SET",
    firebase_app_id: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "NOT SET",
  });
}

