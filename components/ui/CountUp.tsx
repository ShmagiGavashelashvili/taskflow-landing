"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

/** Counts from 0 to `value` when scrolled into view. Jumps straight to it under reduced motion. */
export default function CountUp({ value, decimals = 0, suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  const reduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setCurrent,
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  const shown = inView && reduceMotion ? value : current;
  const format = (n: number) => n.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">
        {format(value)}
        {suffix}
      </span>
      <span aria-hidden="true">
        {format(shown)}
        {suffix}
      </span>
    </span>
  );
}
