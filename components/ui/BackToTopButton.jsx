"use client";

import { useEffect, useState } from "react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 420);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`fixed bottom-24 left-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-white/70 bg-white/[.88] text-mauri-green shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-mauri-green hover:text-white active:scale-95 dark:border-white/10 dark:bg-[#10231a]/90 md:bottom-6 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
      aria-label="العودة إلى الأعلى"
    >
      ↑
    </button>
  );
}
