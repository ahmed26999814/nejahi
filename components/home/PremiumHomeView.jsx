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
      {cards.map((year) => {
        const rawTitle = year.title?.[lang] || year.title?.ar || `نتائج المسابقات ${year.id}`;
        const title = normalizeYearTitle(rawTitle, year.id);
        const description = year.description?.[lang] || year.description?.ar || "كل النتائج المتوفرة الآن في مكان واحد.";
        const available = year.available !== false;
        return (
          <button
            key={year.id || title}
            type="button"
            disabled={!available}
            onClick={() => available && onSelectYear?.(year)}
            className={`group relative min-h-[158px] overflow-hidden rounded-[34px] border p-5 text-start shadow-premium transition duration-300 active:scale-[.99] ${available ? "border-emerald-200/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.20),transparent_38%),linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,253,245,.86),rgba(255,255,255,.96))] hover:-translate-y-1 hover:border-mauri-green/50 dark:border-emerald-300/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,.20),transparent_40%),linear-gradient(135deg,#10231a,#143621,#07130d)]" : "border-slate-200 bg-white/65 opacity-80 dark:border-white/10 dark:bg-white/10"}`}
          >
            <span className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-mauri-green/10 transition group-hover:scale-125" />
            <span className="absolute bottom-4 left-4 h-16 w-16 rounded-full border border-mauri-green/10" />
            <span className="relative z-10 flex h-full flex-col justify-between gap-4">
              <span className="flex items-start justify-between gap-3">
                <strong className="block max-w-[78%] text-3xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">{title}</strong>
                <span className={`rounded-full px-3 py-1 text-[11px] font-black shadow-sm ${available ? "bg-mauri-green text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200"}`}>{available ? "فتح النتائج" : "قريبًا"}</span>
              </span>
              <small className="block text-xs font-bold leading-6 text-slate-500 dark:text-slate-300 md:text-sm">{description}</small>
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
