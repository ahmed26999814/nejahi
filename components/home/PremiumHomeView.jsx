"use client";

import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import { contentValue } from "../common/content";

function PremiumSiteBanner({ asset }) {
  if (!asset?.is_active || !asset?.image_url) return null;

  return (
    <figure className="overflow-hidden rounded-[30px] border border-white/70 bg-white/[.78] shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <img className="h-full max-h-[320px] w-full object-cover" src={asset.image_url} alt="" loading="lazy" />
    </figure>
  );
}

function normalizeYearTitle(title, yearId) {
  const fallback = `نتائج المسابقات ${yearId || ""}`.trim();
  return String(title || fallback).replace("نتائج مسابقات", "نتائج المسابقات").replace("نتائج المسابقات الوطنية", "نتائج المسابقات");
}

function YearChoiceCards({ lang = "ar", onSelectYear, yearCards = [] }) {
  const cards = yearCards.length ? yearCards : [
    { id: "2025", title: { ar: "نتائج المسابقات 2025", fr: "Résultats 2025" }, description: { ar: "كل النتائج المتوفرة الآن في مكان واحد.", fr: "Tous les résultats disponibles" }, available: true },
    { id: "2026", title: { ar: "نتائج المسابقات 2026", fr: "Résultats 2026" }, description: { ar: "سيتم فتحها عند توفر النتائج.", fr: "Bientôt" }, available: false },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {cards.map((year, index) => {
        const rawTitle = year.title?.[lang] || year.title?.ar || `نتائج المسابقات ${year.id}`;
        const title = normalizeYearTitle(rawTitle, year.id);
        const description = year.description?.[lang] || year.description?.ar || "كل النتائج المتوفرة الآن في مكان واحد.";
        const available = year.available !== false;
        const tone = index === 0
          ? "border-emerald-200/80 from-emerald-950/90 via-emerald-800/70 to-emerald-500/20 text-emerald-50"
          : "border-amber-200/70 from-slate-900/90 via-amber-900/35 to-amber-400/20 text-amber-50";
        return (
          <button
            key={year.id || title}
            type="button"
            disabled={!available}
            onClick={() => available && onSelectYear?.(year)}
            className={`group relative min-h-[132px] overflow-hidden rounded-[28px] border bg-gradient-to-br p-4 text-start shadow-premium transition duration-300 active:scale-[.99] hover:-translate-y-0.5 ${tone} ${available ? "" : "opacity-80"}`}
          >
            <span className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-white/10 transition group-hover:scale-125" />
            <span className="absolute bottom-3 left-3 h-14 w-14 rounded-full border border-white/10" />
            <span className="relative z-10 grid h-full grid-cols-[1fr_auto] items-start gap-3">
              <span className="min-w-0">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-xl shadow-soft ring-1 ring-white/10">{index === 0 ? "🎓" : "⏳"}</span>
                <strong className="block text-2xl font-black leading-tight text-white md:text-3xl">{title}</strong>
                <small className="mt-2 block text-xs font-bold leading-5 text-white/75">{description}</small>
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black shadow-sm ${available ? "bg-white text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{available ? "فتح" : "قريبًا"}</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

export default function PremiumHomeView({ content = {}, homepageBanner, lang = "ar", onSelectYear, text, yearCards = [] }) {
  const logo = contentValue(content, "logo", "/logo.png");

  return (
    <section className="app-shell grid gap-6 py-4 md:gap-8 md:py-8">
      <PremiumHero eyebrow="MauriResults" title={text.heroTitle} description={text.heroDesc} logo={logo} />
      <YearChoiceCards lang={lang} onSelectYear={onSelectYear} yearCards={yearCards} />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
