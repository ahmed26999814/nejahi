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

function YearChoiceCards({ lang = "ar", onSelectYear, yearCards = [] }) {
  const cards = yearCards.length ? yearCards : [
    { id: "2025", title: { ar: "نتائج المسابقات 2025", fr: "Résultats 2025" }, description: { ar: "الباكالوريا، أبريفه، كونكور والامتياز.", fr: "Examens nationaux 2025" }, available: true },
    { id: "2026", title: { ar: "نتائج المسابقات 2026", fr: "Résultats 2026" }, description: { ar: "قريبًا عند صدور النتائج الرسمية.", fr: "Bientôt" }, available: false },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {cards.map((year, index) => {
        const title = year.title?.[lang] || year.title?.ar || `نتائج المسابقات ${year.id}`;
        const description = year.description?.[lang] || year.description?.ar || "نتائج المسابقات الوطنية";
        const available = year.available !== false;
        return (
          <button
            key={year.id || title}
            type="button"
            disabled={!available}
            onClick={() => available && onSelectYear?.(year)}
            className={`group relative overflow-hidden rounded-[30px] border p-5 text-start shadow-premium transition duration-300 ${available ? "border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/70 to-white hover:-translate-y-1 hover:border-mauri-green/50 dark:border-emerald-300/15 dark:from-[#10231a] dark:via-[#143621] dark:to-[#07130d]" : "border-slate-200 bg-white/70 opacity-70 dark:border-white/10 dark:bg-white/10"}`}
          >
            <span className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-mauri-green/10 transition group-hover:scale-125" />
            <span className="relative z-10 grid gap-3">
              <span className="flex items-center justify-between gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mauri-green text-xl font-black text-white shadow-soft">{index === 0 ? "25" : "26"}</span>
                {!available && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">قريبًا</span>}
              </span>
              <span>
                <strong className="block text-xl font-black text-slate-950 dark:text-white">{title}</strong>
                <small className="mt-2 block text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{description}</small>
              </span>
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
