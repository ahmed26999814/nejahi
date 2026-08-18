"use client";

import Link from "next/link";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import LogoMark from "../common/LogoMark";

export default function CandidatureHeader() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("mauriresults-theme");
    const next = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
    localStorage.setItem("mauriresults-theme", next);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#233653] bg-[#0d1d35]/95 text-white shadow-[0_10px_30px_rgba(2,8,23,.18)] backdrop-blur-2xl dark:border-[#233653] dark:bg-[#0d1d35]/95">
      <nav className="app-shell flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-2xl text-start transition active:scale-[.98]" aria-label="MauriResults">
          <LogoMark className="h-10 w-10 rounded-[15px]" src="/brand-logo.svg" />
          <span className="min-w-0">
            <strong className="block truncate text-base font-black tracking-tight text-white">MauriResults</strong>
            <small className="block truncate text-[11px] font-bold text-slate-400">منصة النتائج الوطنية</small>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.05] text-white transition hover:bg-white/10 active:scale-95"
            aria-label="تبديل الوضع"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[.05] px-3 text-sm font-black text-white transition hover:bg-white/10 active:scale-[.98]">
            الرئيسية
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
