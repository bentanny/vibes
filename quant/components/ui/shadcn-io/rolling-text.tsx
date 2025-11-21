"use client";

import * as React from "react";
import {
  motion,
  useInView,
  type UseInViewOptions,
  type Transition,
} from "framer-motion";

const ENTRY_ANIMATION = {
  initial: { rotateX: 0 },
  animate: { rotateX: 90 },
};

const EXIT_ANIMATION = {
  initial: { rotateX: 90 },
  animate: { rotateX: 0 },
};

const formatCharacter = (char: string) => (char === " " ? "\u00A0" : char);

type RollingTextProps = Omit<
  React.ComponentProps<"span">,
  "children" | "ref"
> & {
  transition?: Transition;
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  inViewOnce?: boolean;
  text: string;
  autoTrigger?: boolean;
  autoTriggerInterval?: number;
};

const RollingText = React.forwardRef<HTMLSpanElement, RollingTextProps>(
  function RollingText(
    {
      transition = { duration: 0.5, delay: 0.1, ease: "easeOut" },
      inView = false,
      inViewMargin = "0px",
      inViewOnce = true,
      text,
      autoTrigger = false,
      autoTriggerInterval = 8000, // Default 8 seconds
      ...props
    },
    ref,
  ) {
    const localRef = React.useRef<HTMLSpanElement>(null);
    const [animationKey, setAnimationKey] = React.useState(0);
    const [isAnimated, setIsAnimated] = React.useState(false);

    React.useImperativeHandle(ref, () => localRef.current!);

    const inViewResult = useInView(localRef, {
      once: inViewOnce,
      margin: inViewMargin,
    });
    const isInView = !inView || inViewResult;
    const shouldAnimate = isInView || (autoTrigger && isAnimated);

    React.useEffect(() => {
      if (!autoTrigger) return;

      // Initial animation
      setIsAnimated(true);

      // Set up interval for periodic animation
      const interval = setInterval(() => {
        setIsAnimated(false);
        setAnimationKey((prev) => prev + 1);

        // Trigger animation again after a brief delay
        setTimeout(() => {
          setIsAnimated(true);
        }, 50);
      }, autoTriggerInterval);

      return () => clearInterval(interval);
    }, [autoTrigger, autoTriggerInterval]);

    const characters = React.useMemo(() => text.split(""), [text]);

    return (
      <span
        data-slot="rolling-text"
        {...props}
        ref={localRef}
        key={animationKey}
      >
        {characters.map((char, idx) => (
          <span
            key={`${animationKey}-${idx}`}
            className="relative inline-block w-auto"
            style={{
              perspective: "9999999px",
              transformStyle: "preserve-3d",
            }}
            aria-hidden="true"
          >
            <motion.span
              className="absolute inline-block origin-[50%_25%]"
              style={{ backfaceVisibility: "hidden" }}
              initial={ENTRY_ANIMATION.initial}
              animate={shouldAnimate ? ENTRY_ANIMATION.animate : undefined}
              transition={{
                ...transition,
                delay: idx * (transition?.delay ?? 0),
              }}
            >
              {formatCharacter(char)}
            </motion.span>
            <motion.span
              className="absolute inline-block origin-[50%_100%]"
              style={{ backfaceVisibility: "hidden" }}
              initial={EXIT_ANIMATION.initial}
              animate={shouldAnimate ? EXIT_ANIMATION.animate : undefined}
              transition={{
                ...transition,
                delay: idx * (transition?.delay ?? 0) + 0.3,
              }}
            >
              {formatCharacter(char)}
            </motion.span>
            <span className="invisible">{formatCharacter(char)}</span>
          </span>
        ))}

        <span key="sr-only" className="sr-only">
          {text}
        </span>
      </span>
    );
  },
);

export { RollingText, type RollingTextProps };
