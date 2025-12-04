"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Sparkles, Twitter, Linkedin } from "lucide-react";
import { Chip } from "@heroui/chip";
import { StrategyInput } from "@/components/strategy-input";
import { DashboardView } from "@/components/dashboard-view";
import { IntelligenceView } from "@/components/intelligence-view";

// --- Components ---

const MouseParallax = ({
  children,
  stiffness = 250,
  damping = 20,
}: {
  children: React.ReactNode;
  stiffness?: number;
  damping?: number;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), {
    stiffness,
    damping,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), {
    stiffness,
    damping,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full h-full flex items-center justify-center perspective-1000"
    >
      {children}
    </motion.div>
  );
};

const LandingHero = ({
  onDeploy,
  initialStrategy,
  imgSrc,
}: {
  onDeploy: (strategy: string) => void;
  initialStrategy: string;
  imgSrc: string;
}) => {
  const [strategy, setStrategy] = useState(initialStrategy);

  // Fallback image if the user's uploaded file isn't found in the local path during preview
  const handleImgError = () => {
    // Image error handled by parent
  };

  const handleSubmit = () => {
    if (strategy.trim()) {
      onDeploy(strategy);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        {/* The Image with a slow pan effect */}
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={imgSrc}
              onError={handleImgError}
              alt="Classical Fresco"
              className="opacity-60 w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: "center 40%",
                // Ensure image always fills the screen
                minWidth: "100%",
                minHeight: "100%",
              }}
            />
          </div>

          {/* Gradient Overlays for readability and mood - subtle edge darkening */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          {/* Additional subtle edge darkening - radial gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)",
            }}
          />

          {/* Grain texture for vintage/modern feel */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </div>

      {/* Main Interactive Area */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
        <MouseParallax>
          <div className="relative max-w-4xl w-full">
            {/* Typography Content */}
            <div className="text-center space-y-8 relative z-20">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 mb-6">
                  <Chip
                    className="px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md"
                    variant="flat"
                    startContent={
                      <Sparkles size={14} className="text-amber-200" />
                    }
                  >
                    <span className="text-[10px] pl-1 uppercase tracking-[0.2em] text-white/80">
                      Agentic Trading
                    </span>
                  </Chip>
                </div>

                <h1 className="text-5xl md:text-8xl font-serif font-medium leading-tight tracking-tight mix-blend-overlay text-white drop-shadow-2xl">
                  Strategy{" "}
                  <span className="italic font-light text-amber-100/90">
                    Unbound
                  </span>
                </h1>

                <p className="mt-6 text-lg md:text-xl font-light text-white/70 max-w-xl mx-auto leading-relaxed">
                  Describe your trading strategy in plain English. Our AI agents
                  execute, optimize, and scale your positions instantly.
                </p>
              </motion.div>

              {/* Input Section */}
              <StrategyInput
                value={strategy}
                onChange={setStrategy}
                onSubmit={handleSubmit}
                placeholder="e.g. Buy ETH when RSI < 30 and volume spikes..."
              />
            </div>
          </div>
        </MouseParallax>

        {/* Floating Decorative Elements */}
        <div className="absolute bottom-10 left-10 hidden md:block">
          <p className="text-xs text-white/30 uppercase tracking-[0.3em] rotate-90 origin-bottom-left absolute bottom-0 left-0 w-max">
            System Status: Operational
          </p>
        </div>

        <div className="absolute bottom-10 right-10 hidden md:block">
          <div className="w-24 h-[1px] bg-white/20 mb-4" />
          <p className="text-xs text-right text-white/50 leading-loose italic">
            "Markets never sleep.
            <br />
            Neither do we."
          </p>
        </div>
      </main>

      {/* Styles for Typography */}
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap");

        body {
          font-family: "Inter", sans-serif;
        }
        h1,
        h2,
        h3,
        .font-serif {
          font-family: "Playfair Display", serif;
        }
      `}</style>
    </div>
  );
};

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
    setPreviousView(view);
    setTargetView("landing");
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
    initial: { x: "-100%", opacity: 0.5 },
    initialFromDashboard: { y: "-100%", opacity: 0.5 },
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
    <div className="w-screen h-screen overflow-hidden bg-black font-sans">
      <AnimatePresence mode="wait" custom={targetView}>
        {view === "landing" && (
          <motion.div
            key="landing"
            className="w-full h-full"
            variants={landingVariants}
            initial={landingInitial}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <LandingHero
              onDeploy={handleDeploy}
              initialStrategy={submittedStrategy}
              imgSrc={imgSrc}
            />
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

export default MainContent;
