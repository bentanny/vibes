"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { useAuth } from "@/contexts/auth-context";
import { SignInModal } from "@/components/sign-in-modal";
import { Logo } from "@/components/icons";

export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      setIsSignInOpen(false);
      setIsRedirecting(true);
      const timeout = setTimeout(() => {
        router.replace("/strategies");
      }, 350);
      return () => clearTimeout(timeout);
    }

    setIsSignInOpen(true);
  }, [loading, router, user]);

  const showLoading = loading || isRedirecting;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-stone-50 via-white to-stone-100 px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 shadow-sm">
            <Logo size={22} className="text-stone-900" />
            <span className="text-sm font-semibold tracking-[0.3em] uppercase text-stone-800">
              Quant
            </span>
          </div>
        </div>

        {showLoading ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-500">
              Loading your strategies workspace...
            </p>
            <div className="flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-stone-900">
              Welcome to Vibe Trade Quant
            </h1>
            <p className="text-sm text-stone-600">
              Sign in to access your strategies and backtests.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
              <span className="h-px w-10 bg-stone-200" />
              <span>Secure sign-in with Google or email</span>
              <span className="h-px w-10 bg-stone-200" />
            </div>
            <div>
              <Button variant="bordered" onPress={() => setIsSignInOpen(true)}>
                Sign in
              </Button>
            </div>
          </div>
        )}
      </div>

      <SignInModal isOpen={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </div>
  );
}
