"use client";

import { useEffect, useMemo, useState } from "react";

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export default function AnimatedCounter({ value = 0, duration = 900, locale = "ar-MR", className = "" }) {
  const target = useMemo(() => toNumber(value), [value]);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const totalFrames = Math.max(18, Math.round(duration / 16));
    const start = display;
    const delta = target - start;

    function tick() {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + delta * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <span className={className}>
      {Math.round(display).toLocaleString(locale)}
    </span>
  );
}
