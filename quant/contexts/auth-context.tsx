"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // Check if Firebase is configured
    if (!auth.app.options.apiKey) {
      throw new Error(
        "Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables."
      );
    }

    const provider = new GoogleAuthProvider();
    // Add custom parameters if needed
    provider.setCustomParameters({
      prompt: "select_account",
    });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Re-throw with more context
      if (error.code === "auth/popup-closed-by-user") {
        throw error; // User closed popup, don't show error
      }
      console.error("Firebase Auth error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Compatibility hook that mimics NextAuth's useSession
export function useSession() {
  const { user, loading, signOut } = useAuth();
  
  return {
    data: user
      ? {
          user: {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            image: user.photoURL,
          },
        }
      : null,
    status: loading ? "loading" : user ? "authenticated" : "unauthenticated",
    update: async () => {
      // Firebase handles token refresh automatically
      return Promise.resolve();
    },
  };
}

