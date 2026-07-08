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
    { id: "2025", title: { ar: "نتائج المسابقات الوطنية 2025", fr: "Résultats nationaux 2025" }, description: { ar: "اختر نتائج 2025 للباكالوريا، أبريفه، كونكور والامتياز في واجهة واحدة سهلة وسريعة.", fr: "Résultats nationaux 2025" }, available: true },
    { id: "2026", title: { ar: "نتائج المسابقات الوطنية 2026", fr: "Résultats nationaux 2026" }, description: { ar: "سيتم فتح هذا القسم فور صدور النتائج الرسمية لسنة 2026.", fr: "Bientôt après publication officielle" }, available: false },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {cards.map((year) => {
        const title = year.title?.[lang] || year.title?.ar || `نتائج المسابقات الوطنية ${year.id}`;
        const description = year.description?.[lang] || year.description?.ar || "نتائج المسابقات الوطنية";
        const available = year.available !== false;
        return (
          <button
            key={year.id || title}
            type="button"
            disabled={!available}
            onClick={() => available && onSelectYear?.(year)}
            className={`group relative min-h-[170px] overflow-hidden rounded-[34px] border p-5 text-start shadow-premium transition duration-300 ${available ? "border-emerald-200/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.18),transparent_38%),linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,253,245,.86),rgba(255,255,255,.96))] hover:-translate-y-1 hover:border-mauri-green/50 dark:border-emerald-300/15 dark:bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,.18),transparent_40%),linear-gradient(135deg,#10231a,#143621,#07130d)]" : "border-slate-200 bg-white/70 opacity-80 dark:border-white/10 dark:bg-white/10"}`}
          >
            <span className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-mauri-green/10 transition group-hover:scale-125" />
            <span className="absolute bottom-4 left-4 h-16 w-16 rounded-full border border-mauri-green/10" />
            <span className="relative z-10 grid h-full content-between gap-4">
              <span className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-mauri-green/15 bg-white/75 px-3 py-1 text-[11px] font-black text-mauri-green shadow-sm backdrop-blur-xl dark:border-emerald-300/20 dark:bg-white/10 dark:text-emerald-200">MauriResults</span>
                {!available && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">قريبًا</span>}
              </span>
              <span>
                <strong className="block text-2xl font-black leading-tight text-slate-950 dark:text-white">{title}</strong>
                <small className="mt-3 block text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{description}</small>
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

function HomeQuickActions() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <a className="rounded-[22px] border border-mauri-green/20 bg-white/85 px-4 py-3 text-center text-sm font-black text-mauri-green shadow-soft transition hover:-translate-y-0.5 hover:bg-mauri-green hover:text-white dark:border-emerald-300/20 dark:bg-white/10 dark:text-emerald-200" href="#developer">
        عن المطور
      </a>
      <a className="rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-200" href="#contact">
        اتصل بنا
      </a>
    </div>
  );
}

export default function PremiumHomeView({ content = {}, homepageBanner, lang = "ar", onSelectYear, text, yearCards = [] }) {
  const logo = contentValue(content, "logo", "/logo.png");

  return (
    <section className="app-shell grid gap-6 py-4 md:gap-8 md:py-8">
      <PremiumHero eyebrow="MauriResults" title={text.heroTitle} description={text.heroDesc} logo={logo} />
      <YearChoiceCards lang={lang} onSelectYear={onSelectYear} yearCards={yearCards} />
      <HomeQuickActions />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
