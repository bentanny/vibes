"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useRef } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const isInitialMount = useRef(true);

  // Capture previous pathname before it changes
  const prevPathname = prevPathnameRef.current;

  // Determine navigation direction
  const isAboutPage = pathname === "/about";
  const comingFromAbout = prevPathname === "/about" && pathname === "/";
  const goingToAbout = prevPathname === "/" && pathname === "/about";

  // Update ref for next render (but use current value for this render)
  if (prevPathnameRef.current !== pathname) {
    prevPathnameRef.current = pathname;
  }

  // Determine initial position - vertical slides like home->dashboard
  const getInitial = () => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return false; // No animation on first mount
    }
    if (goingToAbout) {
      return { y: "100%", opacity: 0.5 }; // About slides up from bottom
    }
    if (comingFromAbout) {
      return { y: "-100%", opacity: 0.5 }; // Home slides down from top when returning
    }
    // For other transitions
    if (prevPathname !== pathname) {
      return { y: "100%", opacity: 0.5 }; // Default: slide up from bottom
    }
    return false;
  };

  // Determine exit position - vertical slides
  const getExit = () => {
    if (isAboutPage) {
      return {
        y: "100%",
        opacity: 0.5,
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
      }; // About slides down when leaving
    }
    return {
      y: "-100%",
      opacity: 0.5,
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    }; // Home slides up when going to about
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={getInitial()}
          animate={{ y: "0%", opacity: 1 }}
          exit={getExit()}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
