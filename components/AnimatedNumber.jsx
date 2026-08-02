"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Tweens a numeric display value when `value` changes.
 */
export default function AnimatedNumber({
  value,
  duration = 420,
  format,
  className,
}) {
  const target = Number(value);
  const valid = Number.isFinite(target);
  const [display, setDisplay] = useState(valid ? target : 0);
  const displayRef = useRef(valid ? target : 0);

  useEffect(() => {
    if (!valid) return undefined;

    const from = displayRef.current;
    if (from === target) {
      setDisplay(target);
      return undefined;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (target - from) * easeOutCubic(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, valid, duration]);

  if (!valid) {
    return <span className={className}>{value ?? "—"}</span>;
  }

  const formatted = typeof format === "function" ? format(display) : String(display);
  return <span className={className}>{formatted}</span>;
}
