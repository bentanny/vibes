"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Checkbox } from "@heroui/checkbox";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/icons";

interface SignInModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SignInModal({ isOpen, onOpenChange }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", {
        callbackUrl: window.location.href,
      });
    } catch {
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsEmailLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setIsEmailLoading(false);
      } else if (result?.ok) {
        onOpenChange(false);
        // Optionally refresh the page to update session state
        window.location.reload();
      }
    } catch {
      setError("An error occurred. Please try again.");
      setIsEmailLoading(false);
    }
  };

  const isLoading = isGoogleLoading || isEmailLoading;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-stone-900/40 backdrop-blur-sm",
        base: "border border-stone-200 bg-[#fdfbf7] shadow-2xl shadow-stone-300/50",
        header: "bg-[#f7f5f1]",
        body: "py-6 bg-[#fdfbf7]",
        footer: "bg-[#f7f5f1]",
        closeButton:
          "hover:bg-stone-100 active:bg-stone-200 text-stone-500 hover:text-stone-700",
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 items-center pt-8 pb-4 bg-[#fdfbf7]">
              {/* Decorative Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-stone-200 via-amber-400 to-stone-200 rounded-t-lg" />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center gap-2 mb-2"
              >
                <Logo size={24} className="text-stone-900 bg-stone-900/40" />
                <span className="text-sm tracking-[0.2em] uppercase font-medium text-stone-900">
                  Quant
                </span>
              </motion.div>
            </ModalHeader>

            <ModalBody>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="space-y-4"
              >
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Google Sign In Button */}
                <Button
                  className="w-full border border-stone-300 text-xs uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 bg-transparent"
                  variant="bordered"
                  size="lg"
                  radius="full"
                  startContent={
                    !isGoogleLoading && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )
                  }
                  onPress={handleGoogleSignIn}
                  isLoading={isGoogleLoading}
                  isDisabled={isLoading}
                >
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6 mt-2">
                  <Divider className="flex-1 bg-stone-200" />
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">
                    or sign in with email
                  </span>
                  <Divider className="flex-1 bg-stone-200" />
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <Input
                    type="email"
                    label="Email"
                    value={email}
                    onValueChange={setEmail}
                    startContent={
                      <Mail
                        size={16}
                        className="text-stone-400 flex-shrink-0"
                      />
                    }
                    variant="bordered"
                    size="lg"
                    radius="lg"
                    isDisabled={isLoading}
                  />

                  <Input
                    type={isPasswordVisible ? "text" : "password"}
                    label="Password"
                    value={password}
                    onValueChange={setPassword}
                    startContent={<Lock size={16} className="text-stone-400" />}
                    endContent={
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="focus:outline-none"
                      >
                        {isPasswordVisible ? (
                          <EyeOff
                            size={16}
                            className="text-stone-400 hover:text-stone-600 transition-colors"
                          />
                        ) : (
                          <Eye
                            size={16}
                            className="text-stone-400 hover:text-stone-600 transition-colors"
                          />
                        )}
                      </button>
                    }
                    variant="bordered"
                    size="lg"
                    radius="lg"
                    isDisabled={isLoading}
                  />

                  <div className="flex justify-between items-center">
                    <Checkbox
                      isSelected={rememberMe}
                      onValueChange={setRememberMe}
                      size="sm"
                      classNames={{
                        label: "text-xs text-stone-500",
                        wrapper:
                          "before:border-stone-300 after:bg-amber-500 group-data-[selected=true]:after:bg-amber-500",
                      }}
                      isDisabled={isLoading}
                    >
                      Remember me
                    </Checkbox>
                    <button
                      type="button"
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-lg shadow-stone-300/30"
                    size="lg"
                    radius="lg"
                    endContent={!isEmailLoading && <ArrowRight size={16} />}
                    isLoading={isEmailLoading}
                    isDisabled={isLoading}
                  >
                    <span className="text-sm font-medium uppercase tracking-wider">
                      Sign In
                    </span>
                  </Button>
                  <p className="text-[10px] text-stone-400 text-center uppercase tracking-wider">
                    By signing in, you agree to our Terms & Privacy Policy
                  </p>
                </form>
              </motion.div>
            </ModalBody>

            <ModalFooter className="flex flex-col items-center py-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex items-center gap-2 text-xs text-stone-500"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>
                  Don&apos;t have an account?{" "}
                  <button className="text-amber-600 hover:text-amber-700 font-semibold transition-colors">
                    Create one
                  </button>
                </span>
              </motion.div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
