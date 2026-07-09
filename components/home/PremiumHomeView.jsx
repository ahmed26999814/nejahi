"use client";

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
    description: { ar: "سيتم فتحها عند توفر النتائج الرسمية.", fr: "Ouverture à la publication des résultats officiels." },
    available: false,
  },
];

function PremiumSiteBanner({ asset }) {
  if (!asset?.is_active || !asset?.image_url) return null;

  return (
    <figure className="overflow-hidden rounded-[30px] border border-white/70 bg-white/[.78] shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <img className="h-full max-h-[320px] w-full object-cover" src={asset.image_url} alt="" loading="lazy" />
    </figure>
  );
}

function normalizeYearTitle(title, yearId) {
  const fallback = `نتائج المسابقات ${String(yearId || "").replace("year-", "")}`.trim();
  return String(title || fallback).replace("نتائج مسابقات", "نتائج المسابقات").replace("نتائج المسابقات الوطنية", "نتائج المسابقات");
}

function normalizeHomeYearId(year) {
  const rawId = String(year?.id || "year-2025").trim();
  if (rawId.startsWith("year-")) return rawId;
  const matchedYear = rawId.match(/20\d{2}/)?.[0] || "2025";
  return `year-${matchedYear}`;
}

function openYearFallback(yearId) {
  if (typeof window === "undefined") return;
  window.history.pushState({ view: "year" }, "", `#${yearId}`);
  window.dispatchEvent(new PopStateEvent("popstate", { state: { view: "year" } }));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function YearChoiceCards({ lang = "ar", onSelectYear }) {
  const cards = HOME_YEAR_CARDS;

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {cards.map((year, index) => {
        const yearId = normalizeHomeYearId(year);
        const rawTitle = year.title?.[lang] || year.title?.ar || `نتائج المسابقات ${yearId}`;
        const title = normalizeYearTitle(rawTitle, yearId);
        const description = year.description?.[lang] || year.description?.ar || "كل النتائج المتوفرة الآن في مكان واحد.";
        const available = year.available !== false;
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
              if (typeof onSelectYear === "function") onSelectYear(payload);
              window.setTimeout(() => openYearFallback(yearId), 0);
            }}
            className={`group relative block min-h-[132px] overflow-hidden rounded-[28px] border bg-gradient-to-br p-4 text-start shadow-premium transition duration-300 active:scale-[.99] hover:-translate-y-0.5 ${tone} ${available ? "" : "pointer-events-none opacity-80"}`}
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
          </a>
        );
      })}
    </section>
  );
}

export default function PremiumHomeView({ content = {}, homepageBanner, lang = "ar", onSelectYear, text }) {
  const logo = contentValue(content, "logo", "/logo.png");

  return (
    <section className="app-shell grid gap-6 py-4 md:gap-8 md:py-8">
      <PremiumHero eyebrow="MauriResults" title={text.heroTitle} description={text.heroDesc} logo={logo} />
      <YearChoiceCards lang={lang} onSelectYear={onSelectYear} />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
