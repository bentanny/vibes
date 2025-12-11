import React, { useEffect, useState } from "react";
import { Target, BanknoteArrowDown, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface NextStepsProps {
  ticker?: string;
}

export default function NextSteps({ ticker = "AAPL" }: NextStepsProps) {
  const [showIcon1, setShowIcon1] = useState(false);
  const [showIcon2, setShowIcon2] = useState(false);
  const [showIcon3, setShowIcon3] = useState(false);
  const [hoverIcon1, setHoverIcon1] = useState(0);
  const [hoverIcon2, setHoverIcon2] = useState(0);
  const [hoverIcon3, setHoverIcon3] = useState(0);

  useEffect(() => {
    // First icon: delayChildren (0.3) + row duration (0.6) = 0.9s
    const timer1 = setTimeout(() => setShowIcon1(true), 900);
    // Second icon: delayChildren (0.3) + stagger (1.5) + row duration (0.6) = 2.4s
    const timer2 = setTimeout(() => setShowIcon2(true), 2400);
    // Third icon: delayChildren (0.3) + stagger*2 (3.0) + row duration (0.6) = 3.9s
    const timer3 = setTimeout(() => setShowIcon3(true), 3900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 1.5, // Wait for row appear + icon animation before next row
        delayChildren: 0.3,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="w-full max-w-md bg-transparent">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* --- Item 1: Monitoring --- */}
        <motion.div className="flex items-start gap-3" variants={rowVariants}>
          <div
            className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer"
            onMouseEnter={() => setHoverIcon1((prev) => prev + 1)}
          >
            {showIcon1 && (
              <motion.div
                key={hoverIcon1}
                initial={{ scale: 1 }}
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <Target size={16} className="text-amber-600" />
              </motion.div>
            )}
            {!showIcon1 && <Target size={16} className="text-amber-600" />}
          </div>
          <div>
            <p className="text-sm font-medium text-stone-800 leading-none">
              Our AI monitors {ticker} for buy or sell signals
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Our agent works 24/7 so you don&apos;t have to
            </p>
          </div>
        </motion.div>

        {/* --- Item 2: Automation --- */}
        <motion.div className="flex items-start gap-3" variants={rowVariants}>
          <div
            className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer"
            onMouseEnter={() => setHoverIcon2((prev) => prev + 1)}
          >
            {showIcon2 && (
              <motion.div
                key={hoverIcon2}
                initial={{ rotate: 0 }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 0.8,
                  ease: "backInOut",
                }}
              >
                <BanknoteArrowDown size={16} className="text-emerald-600" />
              </motion.div>
            )}
            {!showIcon2 && (
              <BanknoteArrowDown size={16} className="text-emerald-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-stone-800 leading-none">
              We automate your trades using your brokerage
            </p>
            <p className="text-xs text-stone-500 mt-1">
              No manual action required from you
            </p>
          </div>
        </motion.div>

        {/* --- Item 3: Protection --- */}
        <motion.div className="flex items-start gap-3" variants={rowVariants}>
          <div
            className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer"
            onMouseEnter={() => setHoverIcon3((prev) => prev + 1)}
          >
            {showIcon3 && (
              <motion.div
                key={hoverIcon3}
                initial={{ rotate: 0 }}
                animate={{
                  rotate: [0, -15, 15, -15, 15, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                }}
              >
                <Shield size={16} className="text-blue-600" />
              </motion.div>
            )}
            {!showIcon3 && <Shield size={16} className="text-blue-600" />}
          </div>
          <div>
            <p className="text-sm font-medium text-stone-800 leading-none">
              Uses automated stop-loss for downside protection
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Limits your downside risk
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
