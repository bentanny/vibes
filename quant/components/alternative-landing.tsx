"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Activity } from "lucide-react";
import { StrategyInput } from "@/components/strategy-input";
import { NewsCard } from "@/components/news-card";

const NEWS_EVENTS = [
  { text: "BREAKING: ETF Approved", impact: 25, sentiment: "positive" },
  {
    text: "Whale Alert: 5000 BTC moved to exchange",
    impact: -30,
    sentiment: "negative",
  },
  {
    text: "Inflation data comes in lower than expected",
    impact: 15,
    sentiment: "positive",
  },
  {
    text: "Major exchange halts withdrawals",
    impact: -45,
    sentiment: "negative",
  },
  { text: "Tech sector rally continues", impact: 10, sentiment: "positive" },
  { text: "Regulatory concerns mounting", impact: -15, sentiment: "negative" },
  { text: "New ATH reached!", impact: 20, sentiment: "positive" },
];

// Mouse Parallax Component (extracted for reuse)
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

/**
 * Alternative Landing Page Component - Sentiment Trading View
 *
 * Props:
 * - onDeploy: (strategy: string) => void - Function to deploy a strategy
 * - initialStrategy: string - The current strategy value
 * - imgSrc: string - The background image source (kept for consistency, but not used in this design)
 */
export const AlternativeLanding = ({
  onDeploy,
  initialStrategy,
  imgSrc,
}: {
  onDeploy: (strategy: string) => void;
  initialStrategy: string;
  imgSrc: string;
}) => {
  const [strategy, setStrategy] = useState(initialStrategy || "");
  const [dataPoints, setDataPoints] = useState(Array(100).fill(50));
  const [activeNews, setActiveNews] = useState<
    Array<{
      id: number;
      text: string;
      impact: number;
      sentiment: "positive" | "negative";
      x: number;
    }>
  >([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Simulation State - SMOOTHER SETTINGS
  const volatilityRef = useRef(0.5);
  const trendRef = useRef(0.02);
  const priceRef = useRef(100);

  // Add news event - INCREASED FREQUENCY
  const triggerNews = () => {
    const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
    const id = Date.now();

    // Impact on chart parameters
    volatilityRef.current = 1.5;
    trendRef.current += event.impact * 0.03;

    // Determine side: Left or Right to avoid center input area (35% - 65%)
    const side = Math.random() > 0.5 ? "left" : "right";
    // Left: 5% to 30% | Right: 70% to 95%
    const xPos =
      side === "left" ? Math.random() * 25 + 5 : Math.random() * 25 + 70;

    setActiveNews((prev) => [
      ...prev,
      {
        ...event,
        id,
        x: xPos,
        sentiment: event.sentiment as "positive" | "negative",
      },
    ]);

    setTimeout(() => {
      setActiveNews((prev) => prev.filter((n) => n.id !== id));
      // Ease back
      setTimeout(() => {
        volatilityRef.current = 0.5;
        trendRef.current = 0.02;
      }, 2000);
    }, 2500); // 2.5s duration on screen
  };

  useEffect(() => {
    // Initial pop
    triggerNews();

    const newsInterval = setInterval(() => {
      // 30% chance every 1.5s -> Slower frequency
      if (Math.random() > 0.9) triggerNews();
    }, 1500);

    return () => clearInterval(newsInterval);
  }, []);

  useEffect(() => {
    let lastTimestamp = 0;
    const interval = 50; // Update every 50ms (20fps) for slower chart movement

    const updateChart = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;

      if (elapsed > interval) {
        setDataPoints((prev) => {
          const last = priceRef.current;
          const change =
            (Math.random() - 0.5) * volatilityRef.current + trendRef.current;
          let newPrice = last + change;

          if (newPrice < 10) newPrice = 10;

          priceRef.current = newPrice;

          const newData = [...prev.slice(1), newPrice];
          return newData;
        });
        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(updateChart);
    };

    animationRef.current = requestAnimationFrame(updateChart);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Cubic Bezier Smoothing
  const getPath = (points: number[]) => {
    const width = 1000;
    const height = 400;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const stepX = width / (points.length - 1);

    const normalize = (val: number) => {
      return height - ((val - min) / range) * height * 0.8 - height * 0.1;
    };

    let d = `M 0 ${normalize(points[0])}`;
    for (let i = 0; i < points.length - 1; i++) {
      const x0 = i * stepX;
      const y0 = normalize(points[i]);
      const x1 = (i + 1) * stepX;
      const y1 = normalize(points[i + 1]);

      const cpx1 = x0 + stepX * 0.5;
      const cpy1 = y0;
      const cpx2 = x1 - stepX * 0.5;
      const cpy2 = y1;

      d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${x1} ${y1}`;
    }
    return d;
  };

  const areaPath = `
    ${getPath(dataPoints)} 
    L 1000 400 L 0 400 Z
  `;

  const handleSubmit = () => {
    if (strategy.trim()) {
      onDeploy(strategy);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      {/* Central Container - Expanded but limited */}
      <div className="relative w-full max-w-[90vw] h-[80vh] bg-stone-900/50 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* --- Live Chart Background --- */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
          <svg
            viewBox="0 0 1000 400"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#chartGradient)" />
            <path
              d={getPath(dataPoints)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* --- News Bubbles (z-30 to appear above content overlay background) --- */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {activeNews.map((news) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: -250, scale: 1 }} // Float higher since window is taller
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
                transition={{ duration: 3.5, ease: "easeOut" }} // Slower float for larger area
                style={{ left: `${news.x}%`, bottom: "0%" }}
                className="absolute origin-bottom"
              >
                <NewsCard text={news.text} sentiment={news.sentiment} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* --- Content Overlay --- */}
        <main className="relative z-20 w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent">
          <MouseParallax>
            <div className="relative max-w-2xl w-full">
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md mb-6">
                    <Activity
                      size={14}
                      className="text-amber-200 animate-pulse"
                    />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/80">
                      Live Sentiment Analysis
                    </span>
                  </div>

                  {/* Updated Font: Sans Serif & Removed Italics for Modern Look */}
                  <h1 className="text-4xl md:text-5xl font-sans font-medium leading-tight tracking-tight text-white drop-shadow-2xl">
                    Trade the{" "}
                    <span className="font-bold text-amber-200">Narrative</span>
                  </h1>

                  <p className="mt-4 text-base font-light text-white/70 max-w-md mx-auto leading-relaxed">
                    Real-time natural language processing of market catalysts.
                    Execute instantly on news before the candle closes.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-8"
                >
                  <StrategyInput
                    value={strategy}
                    onChange={setStrategy}
                    onSubmit={handleSubmit}
                    placeholder="e.g. Long BTC if 'ETF' mentioned with positive sentiment..."
                  />
                </motion.div>
              </div>
            </div>
          </MouseParallax>
        </main>
      </div>
    </div>
  );
};
