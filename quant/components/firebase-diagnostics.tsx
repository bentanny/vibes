"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

/**
 * Firebase Diagnostics Component
 * 
 * Only shows in development mode. Displays Firebase configuration status.
 * Can be toggled with localStorage flag: `firebase-diagnostics=true`
 */
export function FirebaseDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if explicitly enabled via localStorage
    if (typeof window !== "undefined") {
      const enabled = localStorage.getItem("firebase-diagnostics") === "true";
      setShow(enabled && process.env.NODE_ENV !== "production");
    }
  }, []);

  useEffect(() => {
    if (!show) return;

    const checks: string[] = [];
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!apiKey) {
      checks.push("❌ NEXT_PUBLIC_FIREBASE_API_KEY is not set");
    } else {
      checks.push(`✅ NEXT_PUBLIC_FIREBASE_API_KEY is set`);
    }

    if (!authDomain) {
      checks.push("❌ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set");
    } else {
      checks.push(`✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set`);
    }

    if (!projectId) {
      checks.push("❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
    } else {
      checks.push(`✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID is set`);
    }

    if (auth.app.options.apiKey) {
      checks.push("✅ Firebase app is initialized");
    } else {
      checks.push("❌ Firebase app is not properly initialized");
    }

    setDiagnostics(checks);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg max-w-sm z-50 shadow-lg">
      <div className="font-bold mb-2 text-yellow-400">Firebase Diagnostics</div>
      <ul className="space-y-1">
        {diagnostics.map((check, i) => (
          <li key={i} className="font-mono">{check}</li>
        ))}
      </ul>
      <button
        onClick={() => {
          localStorage.removeItem("firebase-diagnostics");
          setShow(false);
        }}
        className="mt-2 text-xs text-gray-400 hover:text-white"
      >
        Hide (set localStorage: firebase-diagnostics=false)
      </button>
    </div>
  );
}

