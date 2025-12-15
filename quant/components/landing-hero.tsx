"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Chip } from "@heroui/chip";
import { StrategyInput } from "@/components/strategy-input";

// Mouse Parallax Component
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

export const LandingHero = ({
  onDeploy,
  initialStrategy,
  imgSrc,
}: {
  onDeploy: (strategy: string) => void;
  initialStrategy: string;
  imgSrc: string;
}) => {
  const [strategy, setStrategy] = useState(initialStrategy);

  const handleSubmit = () => {
    if (strategy.trim()) {
      onDeploy(strategy);
    }
  };

  return (
    <div
      className="relative w-full h-full h-[100dvh] overflow-hidden text-white m-0 p-0"
      style={{ maxHeight: "100dvh", overscrollBehavior: "none" }}
    >
      {/* Dynamic Background - extends to cover navbar area */}
      <div className="absolute inset-0 z-0">
        {/* The Image with a slow pan effect */}
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={imgSrc}
              alt="Classical Fresco"
              fill
              priority
              unoptimized
              className="opacity-60 object-cover"
              style={{
                objectPosition: "center 40%",
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

                <p className="mt-6 text-sm md:text-xl font-light text-white/70 max-w-xl mx-auto leading-relaxed">
                  Describe your trading strategy in plain English. Our AI agents
                  execute, optimize, and scale your positions instantly.
                </p>
              </motion.div>

              {/* Input Section */}
              <StrategyInput
                value={strategy}
                onChange={setStrategy}
                onSubmit={handleSubmit}
                placeholder="Buy BTC when price spikes 5%..."
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
