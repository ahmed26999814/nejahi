"use client";

import { SearchIcon } from "../common/icons";

export function QuickSearchChips({ chips = [], onPick }) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          className="rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green transition hover:-translate-y-0.5 hover:bg-mauri-green hover:text-white active:scale-95 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300"
          onClick={() => onPick?.(chip)}
          type="button"
          key={chip}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

export function AdvancedFiltersCard({ children, title = "فلاتر متقدمة" }) {
  return (
    <section className="rounded-[26px] border border-white/70 bg-white/[.78] p-4 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><SearchIcon /></span>
        <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      </div>
      <div className="grid gap-2 md:grid-cols-3">{children}</div>
    </section>
  );
}

export function SearchSkeleton({ rows = 4 }) {
  return (
    <section className="grid gap-2 rounded-[26px] border border-white/70 bg-white/[.78] p-4 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      {Array.from({ length: rows }).map((_, index) => (
        <span className="skeleton h-14 rounded-[18px]" key={index} />
      ))}
    </section>
  );
}

export function EmptySearchState({ title = "لا توجد نتائج", description = "جرّب كتابة رقم المترشح بدقة أو استخدم الاسم الكامل." }) {
  return (
    <section className="grid justify-items-center gap-3 rounded-[28px] border border-dashed border-mauri-green/25 bg-white/[.70] p-6 text-center shadow-soft backdrop-blur-xl dark:border-emerald-300/20 dark:bg-white/[.06]">
      <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><SearchIcon /></span>
      <div>
        <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 max-w-md text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
    </section>
  );
}
