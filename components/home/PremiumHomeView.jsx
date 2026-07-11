"use client";

import { useMemo } from "react";
import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import { contentValue } from "../common/content";

const HOME_YEAR_CARDS = [
  {
    id: "year-2025",
    title: { ar: "نتائج المسابقات 2025", fr: "Résultats des concours 2025" },
    description: { ar: "كل نتائج 2025 المتوفرة الآن في مكان واحد.", fr: "Tous les résultats 2025 disponibles au même endroit." },
    available: true,
  },
  {
    id: "year-2026",
    title: { ar: "نتائج المسابقات 2026", fr: "Résultats des concours 2026" },
    description: { ar: "سيتم فتحها عند توفر نتائج منشورة.", fr: "Ouverture dès la publication des résultats." },
    available: false,
  },
];

function PremiumSiteBanner({ asset }) {
  if (!asset?.is_active || !asset?.image_url) return null;

  return (
    <figure className="overflow-hidden rounded-[24px] border border-white/70 bg-white/[.78] shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:rounded-[30px]">
      <img className="h-full max-h-[320px] w-full object-cover" src={asset.image_url} alt="" loading="lazy" decoding="async" fetchPriority="low" sizes="(max-width: 768px) 96vw, 1040px" />
    </figure>
  );
}

function normalizeYearTitle(title, yearId) {
  const fallback = `نتائج المسابقات ${String(yearId || "").replace("year-", "")}`.trim();
  return String(title || fallback).replace("نتائج مسابقات", "نتائج المسابقات").replace("نتائج المسابقات الوطنية", "نتائج المسابقات");
}

function normalizeHomeYearId(year) {
  const rawId = String(year?.id || year || "year-2025").trim();
  if (rawId.startsWith("year-")) return rawId;
  const matchedYear = rawId.match(/20\d{2}/)?.[0] || "2025";
  return `year-${matchedYear}`;
}

function createYearCard(yearValue) {
  return {
    id: `year-${yearValue}`,
    title: { ar: `نتائج المسابقات ${yearValue}`, fr: `Résultats des concours ${yearValue}` },
    description: { ar: `نتائج ${yearValue} المنشورة والمتاحة للبحث.`, fr: `Résultats ${yearValue} publiés et disponibles.` },
    available: false,
  };
}

function mergeYearCards(yearCards = []) {
  const byId = new Map(HOME_YEAR_CARDS.map((card) => [card.id, card]));
  for (const card of Array.isArray(yearCards) ? yearCards : []) {
    const id = normalizeHomeYearId(card);
    byId.set(id, { ...(byId.get(id) || createYearCard(id.replace("year-", ""))), ...card, id });
  }

  return [...byId.values()]
    .map((card) => {
      const id = normalizeHomeYearId(card);
      const yearValue = id.replace("year-", "");
      const propAvailability = Array.isArray(yearCards) && yearCards.length
        ? yearCards.find((item) => normalizeHomeYearId(item) === id)?.available
        : undefined;
      const available = yearValue === "2025"
        || propAvailability === true;
      return { ...card, id, available };
    })
    .sort((a, b) => Number(a.id.replace("year-", "")) - Number(b.id.replace("year-", "")));
}

function YearChoiceCards({ lang = "ar", onSelectYear, yearCards }) {
  const cards = useMemo(() => mergeYearCards(yearCards), [yearCards]);

  return (
    <section className="grid grid-cols-2 gap-2.5 md:gap-3">
      {cards.map((year, index) => {
        const yearId = normalizeHomeYearId(year);
        const rawTitle = year.title?.[lang] || year.title?.ar || `نتائج المسابقات ${yearId}`;
        const title = normalizeYearTitle(rawTitle, yearId);
        const description = year.description?.[lang] || year.description?.ar || "كل النتائج المتوفرة الآن في مكان واحد.";
        const available = year.available === true;
        const tone = index === 0
          ? "border-emerald-200/80 from-emerald-950/90 via-emerald-800/70 to-emerald-500/20 text-emerald-50"
          : "border-amber-200/70 from-slate-900/90 via-amber-900/35 to-amber-400/20 text-amber-50";
        return (
          <a
            key={yearId}
            href={available ? `#${yearId}` : undefined}
            aria-disabled={!available}
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
            className={`group relative block min-h-[132px] overflow-hidden rounded-[22px] border bg-gradient-to-br p-3 text-start shadow-premium transition duration-300 active:scale-[.98] hover:-translate-y-1 md:min-h-[170px] md:rounded-[30px] md:p-5 ${tone} ${available ? "" : "pointer-events-none opacity-80"}`}
          >
            <span className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-white/10 transition duration-500 group-hover:scale-150" />
            <span className="absolute bottom-3 left-3 h-14 w-14 rounded-full border border-white/10" />
            <span className="relative z-10 grid h-full grid-cols-[1fr_auto] items-start gap-3">
              <span className="min-w-0">
                <span className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg shadow-soft ring-1 ring-white/10 md:mb-3 md:h-11 md:w-11 md:rounded-2xl md:text-xl">{available ? "🎓" : "⏳"}</span>
                <strong className="block text-sm font-black leading-tight text-white sm:text-xl md:text-3xl">{title}</strong>
                <small className="mt-1.5 line-clamp-2 block text-[10px] font-bold leading-4 text-white/75 md:mt-2 md:text-xs md:leading-5">{description}</small>
              </span>
              <span className={`rounded-full px-2 py-1 text-[9px] font-black shadow-sm md:px-3 md:text-[11px] ${available ? "bg-white text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{available ? "فتح" : "قريبًا"}</span>
            </span>
          </a>
        );
      })}
    </section>
  );
}

export default function PremiumHomeView({ content = {}, homepageBanner, lang = "ar", onSelectYear, text, yearCards }) {
  const logo = contentValue(content, "logo", "/logo.png");

  return (
    <section className="app-shell grid gap-5 py-3 md:gap-10 md:py-8">
      <PremiumHero eyebrow="MauriResults" title={text.heroTitle} description={text.heroDesc} logo={logo} />
      <section className="scroll-mt-24 grid gap-3" id="years">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">النتائج المتاحة</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">اختر سنة المسابقة</h2>
          </div>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">تحديث تلقائي</span>
        </header>
        <YearChoiceCards lang={lang} onSelectYear={onSelectYear} yearCards={yearCards} />
      </section>
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
