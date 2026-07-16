"use client";

import { useEffect, useState } from "react";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.5 14.3A8.4 8.4 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z" />
    </svg>
  );
}

function applyTheme(nextTheme) {
  const theme = nextTheme === "light" ? "light" : "dark";
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  localStorage.setItem("mauriresults-theme", theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", theme === "dark" ? "#07130d" : "#f3f7f4");
  });
  return theme;
}

export default function BepcSubjectsThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("mauriresults-theme");
    const initial = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(applyTheme(initial));
  }, []);

  function toggleTheme() {
    setTheme(applyTheme(theme === "dark" ? "light" : "dark"));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed left-[4.15rem] top-[calc(env(safe-area-inset-top)+.65rem)] z-50 grid h-10 w-10 place-items-center rounded-[15px] border border-slate-200 bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,.12)] transition active:scale-95 dark:border-white/10 dark:bg-[#10241a] dark:text-amber-300 sm:left-[calc((100vw-42rem)/2+4.15rem)]"
      aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
