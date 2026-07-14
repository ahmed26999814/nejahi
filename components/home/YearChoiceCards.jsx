"use client";

import { useMemo } from "react";
import { mergeYearCards, normalizeHomeYearId, normalizeYearTitle } from "./yearCards";

export default function YearChoiceCards({ lang = "ar", onSelectYear, yearCards }) {
  const cards = useMemo(() => mergeYearCards(yearCards), [yearCards]);

  return (
    <section className="grid grid-cols-2 gap-2.5 md:gap-3" aria-label={lang === "ar" ? "سنوات النتائج" : "Années des résultats"}>
      {cards.map((year, index) => {
        const yearId = normalizeHomeYearId(year);
        const yearValue = yearId.replace("year-", "");
        const rawTitle = year.title?.[lang] || year.title?.ar || `نتائج المسابقات ${yearValue}`;
        const title = normalizeYearTitle(rawTitle, yearId);
        const description = year.description?.[lang] || year.description?.ar || "كل النتائج المتوفرة الآن في مكان واحد.";
        const available = year.available === true;
        const tone = index === 0
          ? "border-emerald-200/80 from-emerald-950/95 via-emerald-800/75 to-emerald-500/25 text-emerald-50"
          : "border-amber-200/70 from-slate-950/95 via-amber-900/40 to-amber-400/25 text-amber-50";

        return (
          <a
            key={yearId}
            href={available ? `#${yearId}` : undefined}
            aria-disabled={!available}
            aria-label={`${title} — ${available ? (lang === "ar" ? "متاحة" : "Disponible") : (lang === "ar" ? "قريبًا" : "Bientôt")}`}
            onClick={(event) => {
              if (!available) {
                event.preventDefault();
                return;
              }

              const payload = { ...year, id: yearId, available: true };
              if (typeof onSelectYear === "function") {
                event.preventDefault();
                onSelectYear(payload);
              }
            }}
            className={`group relative block min-h-[132px] overflow-hidden rounded-[22px] border bg-gradient-to-br p-3 text-start shadow-premium outline-none transition duration-300 active:scale-[.97] focus-visible:ring-4 focus-visible:ring-mauri-green/30 md:min-h-[170px] md:rounded-[30px] md:p-5 ${tone} ${available ? "hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,.18)]" : "pointer-events-none opacity-75"}`}
            data-haptic={available ? "true" : undefined}
          >
            <span className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-white/10 transition duration-500 group-hover:scale-150" />
            <span className="absolute bottom-3 left-3 h-14 w-14 rounded-full border border-white/10" />
            <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 opacity-0 transition group-hover:opacity-100" />
            <span className="relative z-10 grid h-full grid-cols-[1fr_auto] items-start gap-2.5">
              <span className="min-w-0">
                <span className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg shadow-soft ring-1 ring-white/10 md:mb-3 md:h-11 md:w-11 md:rounded-2xl md:text-xl">
                  {available ? "🎓" : "⏳"}
                </span>
                <strong className="block text-sm font-black leading-tight text-white sm:text-xl md:text-3xl">
                  {title}
                </strong>
                <small className="mt-1.5 line-clamp-2 block text-[10px] font-bold leading-4 text-white/75 md:mt-2 md:text-xs md:leading-5">
                  {description}
                </small>
              </span>
              <span className={`rounded-full px-2 py-1 text-[9px] font-black shadow-sm ring-1 ring-white/20 md:px-3 md:text-[11px] ${available ? "bg-white text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                {available ? (lang === "ar" ? "مفتوحة" : "Ouvert") : (lang === "ar" ? "قريبًا" : "Bientôt")}
              </span>
            </span>
          </a>
        );
      })}
    </section>
  );
}
