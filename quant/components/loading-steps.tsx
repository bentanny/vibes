"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

const LOADING_STEPS = [
  "Thinking",
  "Analyzing the strategy",
  "Reviewing asset data",
  "Planning strategy timing",
  "Defining sell conditions",
];

export function LoadingSteps() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-6 overflow-hidden relative flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 20, opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: -20, opacity: 0, rotateX: 90 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <AnimatedShinyText className="italic">
            {LOADING_STEPS[currentIndex]}...
          </AnimatedShinyText>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
