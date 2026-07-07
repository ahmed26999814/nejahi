"use client";

import { ChartIcon, SearchIcon } from "../common/icons";

export default function FloatingActionButton({ onNavigate, text }) {
  return (
    <div className="fixed bottom-24 right-4 z-40 grid gap-2 md:bottom-6">
      <button
        className="group grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-mauri-green to-emerald-600 text-white shadow-premium transition duration-300 hover:-translate-y-1 active:scale-95"
        onClick={() => onNavigate?.("exam")}
        type="button"
        aria-label={text?.search || "البحث"}
      >
        <SearchIcon />
        <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white opacity-0 shadow-premium transition group-hover:opacity-100 dark:bg-white dark:text-slate-950">{text?.search || "البحث"}</span>
      </button>
      <button
        className="group grid h-12 w-12 place-items-center rounded-full border border-white/70 bg-white/[.88] text-mauri-green shadow-premium backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-mauri-green hover:text-white active:scale-95 dark:border-white/10 dark:bg-[#10231a]/90 dark:text-emerald-300"
        onClick={() => onNavigate?.("analytics")}
        type="button"
        aria-label={text?.analytics || "الإحصائيات"}
      >
        <ChartIcon />
        <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white opacity-0 shadow-premium transition group-hover:opacity-100 dark:bg-white dark:text-slate-950">{text?.analytics || "الإحصائيات"}</span>
      </button>
    </div>
  );
}
