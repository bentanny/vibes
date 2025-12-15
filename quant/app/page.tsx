"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Twitter, Linkedin } from "lucide-react";
import { DashboardView } from "@/components/dashboard-view";
import { IntelligenceView } from "@/components/intelligence-view";

/* ============================================================================
 * ALTERNATIVE LANDING PAGE IMPLEMENTATION - CHANGE LOG
 * ============================================================================
 *
 * This file was modified to support an alternative landing page alongside
 * the original landing page. Changes can be reversed if needed.
 *
 * CHANGES MADE:
 * 1. Added query parameter detection (`?v=alt`) to switch between landing pages
 * 2. Extracted LandingHero component to components/landing-hero.tsx
 * 3. Created AlternativeLanding component in components/alternative-landing.tsx
 * 4. Implemented dynamic imports for code-splitting (only loads the requested page)
 * 5. Added conditional rendering logic to switch between landing pages
 *
 * FILES CREATED:
 * - components/landing-hero.tsx (extracted from original LandingHero)
 * - components/alternative-landing.tsx (new sentiment-based landing page)
 *
 * HOW IT WORKS:
 * - Default route `/` shows the original LandingHero
 * - Route `/?v=alt` shows the AlternativeLanding (sentiment trading view)
 * - Both pages share the same props (onDeploy, initialStrategy, imgSrc)
 * - Dynamic imports ensure only the requested landing page is loaded
 *
 * TO REVERSE THESE CHANGES:
 * 1. Remove the `useSearchParams` import and `isAltVersion` logic
 * 2. Remove the `AlternativeLanding` dynamic import
 * 3. Remove the conditional rendering in the landing view section
 * 4. Either inline LandingHero back into this file OR keep it separate
 * 5. Delete components/alternative-landing.tsx
 * 6. Optionally delete components/landing-hero.tsx if inlining
 *
 * ============================================================================ */

// Dynamic imports with code splitting - only loads the landing page that's needed
// CHANGE: LandingHero was extracted to components/landing-hero.tsx for code splitting
const LandingHero = dynamic(
  () =>
    import("@/components/landing-hero").then((mod) => ({
      default: mod.LandingHero,
    })),
  {
    loading: () => (
      <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    ),
    ssr: false, // Disable SSR for better code splitting
  },
);

// CHANGE: Added AlternativeLanding dynamic import for alternative landing page
const AlternativeLanding = dynamic(
  () =>
    import("@/components/alternative-landing").then((mod) => ({
      default: mod.AlternativeLanding,
    })),
  {
    loading: () => (
      <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    ),
    ssr: false, // Disable SSR for better code splitting
  },
);

// About View Component
const AboutView = ({ imgSrc }: { imgSrc: string }) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "https://images.unsplash.com/photo-1544084944-15a3ad96e9d4?q=80&w=1920&auto=format&fit=crop";
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Reuse */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={imgSrc}
            onError={handleImgError}
            alt="Classical Fresco"
            className="w-full h-full object-cover opacity-40 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </div>
      <div className="relative z-10 pt-32 pb-20 px-8 max-w-[1400px] mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-medium leading-tight text-white/90">
            Architects of <span className="italic text-amber-100">Alpha</span>
          </h2>
          <div className="w-24 h-[1px] bg-white/30 mx-auto mt-6" />
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
          {/* Person 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/3 backdrop-blur-md border border-white/10 p-8 rounded-2xl group hover:bg-white/7 transition-colors"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-full border-2 border-white/20 p-1 mb-6 overflow-hidden relative">
                <img
                  src="/david.jpeg"
                  alt="David Bentz"
                  className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <h3 className="text-2xl font-serif text-white mb-1">
                David Bentz
              </h3>
              <span className="text-xs uppercase tracking-[0.2em] text-amber-200/80 mb-6">
                Engineering
              </span>
              <p className="text-white/70 font-light leading-relaxed mb-8">
                Former quant strategist at Renaissance Technologies. Specialized
                in high-frequency statistical arbitrage and machine learning
                signal generation. Building Aether to democratize
                institutional-grade execution logic.
              </p>
              <div className="flex gap-4">
                <button className="p-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors">
                  <Twitter size={16} />
                </button>
                <button className="p-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors">
                  <Linkedin size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Person 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/3 backdrop-blur-md border border-white/10 p-8 rounded-2xl group hover:bg-white/7 transition-colors"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-full border-2 border-white/20 p-1 mb-6 overflow-hidden relative">
                <img
                  src="/ben.jpeg"
                  alt="Benjamin Tannyhill"
                  className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <h3 className="text-2xl font-serif text-white mb-1">
                Benjamin Tannyhill
              </h3>
              <span className="text-xs uppercase tracking-[0.2em] text-amber-200/80 mb-6">
                Product + Design
              </span>
              <p className="text-white/70 font-light leading-relaxed mb-8">
                PhD in Computational Game Theory from MIT. Previously led DeFi
                risk modeling at Uniswap Labs. Focused on creating resilient,
                autonomous agent structures that adapt to volatile market
                conditions in real-time.
              </p>
              <div className="flex gap-4">
                <button className="p-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors">
                  <Twitter size={16} />
                </button>
                <button className="p-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors">
                  <Linkedin size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

type ViewType = "landing" | "dashboard" | "about" | "intelligence";

const DEFAULT_IMG_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/1/13/Fran%C3%A7ois_Lemoyne_-_L%27Apoth%C3%A9ose_d%27Hercule_-_Google_Art_Project.jpg";

const MainContent = () => {
  // CHANGE: Alternative landing page - detect query parameter ?v=alt to show alternative version
  // To remove: Delete these two lines and remove isAltVersion from conditional rendering below
  const searchParams = useSearchParams();
  const isAltVersion = searchParams.get("v") === "alt";

  // Initialize with server-safe defaults, hydrate from localStorage in useEffect
  const [view, setView] = useState<ViewType>("landing");
  const [submittedStrategy, setSubmittedStrategy] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Track where we're navigating to/from for animations
  const [targetView, setTargetView] = useState<ViewType | null>(null);
  const [previousView, setPreviousView] = useState<ViewType | null>(null);

  const [imgSrc, setImgSrc] = useState(DEFAULT_IMG_SRC);

  // Hydrate state from localStorage after mount (client-side only)
  useEffect(() => {
    const savedView = localStorage.getItem("quant-view") as ViewType | null;
    const savedStrategy = localStorage.getItem("quant-strategy") || "";
    const savedImgSrc = localStorage.getItem("quant-imgSrc") || DEFAULT_IMG_SRC;

    if (savedView) {
      setView(savedView);
      setHasNavigated(savedView !== "landing");
    }
    setSubmittedStrategy(savedStrategy);
    setImgSrc(savedImgSrc);
    setIsHydrated(true);
  }, []);

  const aboutImgSrc =
    "https://upload.wikimedia.org/wikipedia/commons/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg";

  const intelligenceImgSrc =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg";

  // Listen for navigation events from PageNavbar
  useEffect(() => {
    const handleNavigateView = (e: CustomEvent<ViewType>) => {
      const newTarget = e.detail;
      if (newTarget !== view) {
        setPreviousView(view);
        setTargetView(newTarget);
        setHasNavigated(true);
        setView(newTarget);
        if (typeof window !== "undefined") {
          localStorage.setItem("quant-view", newTarget);
        }
      }
    };

    window.addEventListener(
      "navigateView",
      handleNavigateView as EventListener,
    );
    return () => {
      window.removeEventListener(
        "navigateView",
        handleNavigateView as EventListener,
      );
    };
  }, [view]);

  const handleDeploy = (strategy: string) => {
    setSubmittedStrategy(strategy);
    setPreviousView(view);
    setTargetView("dashboard");
    setHasNavigated(true);
    setView("dashboard");
    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("quant-view", "dashboard");
      localStorage.setItem("quant-strategy", strategy);
    }
  };

  const handleGoBack = () => {
    setPreviousView("dashboard");
    setTargetView("landing");
    setHasNavigated(true);
    setView("landing");
    // Update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("quant-view", "landing");
    }
  };

  // Animation variants for consistent transitions
  // Vertical animations (for dashboard)
  const slideUpExit = {
    y: "-100%",
    opacity: 0.5,
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  const slideDownExit = {
    y: "100%",
    opacity: 0.5,
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  const slideUpEnter = {
    initial: { y: "100%", opacity: 0.5 },
    animate: { y: "0%", opacity: 1 },
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  const slideDownEnter = {
    initial: { y: "-100%", opacity: 0.5 },
    animate: { y: "0%", opacity: 1 },
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  // Horizontal animations (for about/navbar items)
  const slideLeftExit = {
    x: "-100%",
    opacity: 0.5,
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  const slideRightExit = {
    x: "100%",
    opacity: 0.5,
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  const slideFromRight = {
    initial: { x: "100%", opacity: 0.5 },
    animate: { x: "0%", opacity: 1 },
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  const slideFromLeft = {
    initial: { x: "-100%", opacity: 0.5 },
    animate: { x: "0%", opacity: 1 },
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  };

  // Landing variants with dynamic exit based on custom prop (targetView)
  const landingVariants = {
    initial: { x: "-100%", y: "0%", opacity: 0.5 },
    initialFromDashboard: { x: "0%", y: "-100%", opacity: 0.5 },
    animate: { x: "0%", y: "0%", opacity: 1 },
    exit: (custom: ViewType) =>
      custom === "dashboard"
        ? {
            y: "-100%",
            opacity: 0.5,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }
        : {
            x: "-100%",
            opacity: 0.5,
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          },
  };

  // Determine initial variant for landing
  const landingInitial = !hasNavigated
    ? false
    : previousView === "dashboard"
      ? "initialFromDashboard"
      : "initial";

  // Don't render animated content until hydration is complete to prevent mismatches
  if (!isHydrated) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-black font-sans" />
    );
  }

  return (
    <div
      className="w-screen h-[100dvh] overflow-hidden font-sans"
      style={{
        backgroundColor: "transparent",
        maxHeight: "100dvh",
        overscrollBehavior: "none",
      }}
    >
      <AnimatePresence mode="wait" custom={targetView}>
        {/* CHANGE: Conditional landing page rendering - key changes based on alt version */}
        {view === "landing" && (
          <motion.div
            key={isAltVersion ? "landing-alt" : "landing"}
            className="w-full h-full"
            variants={landingVariants}
            initial={landingInitial}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* CHANGE: Conditional rendering based on query parameter */}
            {isAltVersion ? (
              <AlternativeLanding
                onDeploy={handleDeploy}
                initialStrategy={submittedStrategy}
                imgSrc={imgSrc}
              />
            ) : (
              <LandingHero
                onDeploy={handleDeploy}
                initialStrategy={submittedStrategy}
                imgSrc={imgSrc}
              />
            )}
          </motion.div>
        )}
        {view === "dashboard" && (
          <motion.div
            key="dashboard"
            className="w-full h-full"
            initial={slideUpEnter.initial}
            animate={slideUpEnter.animate}
            exit={slideDownExit}
            transition={slideUpEnter.transition}
          >
            <DashboardView
              strategy={submittedStrategy}
              imgSrc={imgSrc}
              onGoBack={handleGoBack}
            />
          </motion.div>
        )}
        {view === "about" && (
          <motion.div
            key="about"
            className="w-full h-full"
            initial={slideFromRight.initial}
            animate={slideFromRight.animate}
            exit={slideRightExit}
            transition={slideFromRight.transition}
          >
            <AboutView imgSrc={aboutImgSrc} />
          </motion.div>
        )}
        {view === "intelligence" && (
          <motion.div
            key="intelligence"
            className="w-full h-full"
            initial={slideFromRight.initial}
            animate={slideFromRight.animate}
            exit={slideRightExit}
            transition={slideFromRight.transition}
          >
            <IntelligenceView imgSrc={intelligenceImgSrc} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wrapper to handle Suspense for useSearchParams
const PageContent = () => {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen overflow-hidden bg-black font-sans" />
      }
    >
      <MainContent />
    </Suspense>
  );
};

export default PageContent;
