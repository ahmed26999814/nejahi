"use client";

import { useEffect } from "react";

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

export default function KeyboardViewportGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let largestViewportHeight = viewport?.height || window.innerHeight;
    let scrollTimer;

    const activeEditable = () => {
      const element = document.activeElement;
      return element instanceof HTMLElement && element.matches(EDITABLE_SELECTOR) ? element : null;
    };

    const update = () => {
      const focused = activeEditable();
      const currentHeight = viewport?.height || window.innerHeight;

      if (!focused && currentHeight > largestViewportHeight * 0.9) {
        largestViewportHeight = Math.max(largestViewportHeight, currentHeight);
      }

      const keyboardVisible = Boolean(
        focused && currentHeight < largestViewportHeight - 140,
      );

      root.classList.toggle("keyboard-visible", keyboardVisible);
      root.style.setProperty(
        "--keyboard-visible-height",
        `${Math.max(0, largestViewportHeight - currentHeight)}px`,
      );
    };

    const keepFocusedControlVisible = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const focused = activeEditable();
        if (!focused) return;
        focused.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        update();
      }, 220);
    };

    const onFocusIn = () => {
      update();
      keepFocusedControlVisible();
    };
    const onFocusOut = () => window.setTimeout(update, 160);

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", update, { passive: true });
    viewport?.addEventListener("resize", update, { passive: true });
    viewport?.addEventListener("scroll", update, { passive: true });
    update();

    return () => {
      window.clearTimeout(scrollTimer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      root.classList.remove("keyboard-visible");
      root.style.removeProperty("--keyboard-visible-height");
    };
  }, []);

  return null;
}
