"use client";

import { useEffect, useMemo, useState } from "react";
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

function mergeYearCards(yearCards = [], activeYears = []) {
  const normalizedActiveYears = new Set(activeYears.map((year) => String(year)));
  normalizedActiveYears.add("2025");

  const byId = new Map(HOME_YEAR_CARDS.map((card) => [card.id, card]));
  for (const card of Array.isArray(yearCards) ? yearCards : []) {
    const id = normalizeHomeYearId(card);
    byId.set(id, { ...(byId.get(id) || createYearCard(id.replace("year-", ""))), ...card, id });
  }

  for (const yearValue of normalizedActiveYears) {
    const id = `year-${yearValue}`;
    if (!byId.has(id)) byId.set(id, createYearCard(yearValue));
  }

  return [...byId.values()]
    .map((card) => {
      const id = normalizeHomeYearId(card);
      const yearValue = id.replace("year-", "");
      const propAvailability = Array.isArray(yearCards) && yearCards.length
        ? yearCards.find((item) => normalizeHomeYearId(item) === id)?.available
        : undefined;
      const available = yearValue === "2025"
        || normalizedActiveYears.has(yearValue)
        || propAvailability === true;
      return { ...card, id, available };
    })
    .sort((a, b) => Number(a.id.replace("year-", "")) - Number(b.id.replace("year-", "")));
}

function YearChoiceCards({ lang = "ar", onSelectYear, yearCards, activeYears }) {
  const cards = useMemo(() => mergeYearCards(yearCards, activeYears), [yearCards, activeYears]);

  return (
    <section className="grid gap-3 md:grid-cols-2">
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
            className={`group relative block min-h-[132px] overflow-hidden rounded-[28px] border bg-gradient-to-br p-4 text-start shadow-premium transition duration-300 active:scale-[.99] hover:-translate-y-0.5 ${tone} ${available ? "" : "pointer-events-none opacity-80"}`}
          >
            <span className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-white/10 transition group-hover:scale-125" />
            <span className="absolute bottom-3 left-3 h-14 w-14 rounded-full border border-white/10" />
            <span className="relative z-10 grid h-full grid-cols-[1fr_auto] items-start gap-3">
              <span className="min-w-0">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-xl shadow-soft ring-1 ring-white/10">{available ? "🎓" : "⏳"}</span>
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

export default function PremiumHomeView({ content = {}, homepageBanner, lang = "ar", onSelectYear, text, yearCards }) {
  const logo = contentValue(content, "logo", "/logo.png");
  const [activeYears, setActiveYears] = useState(["2025"]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public-exams", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : { exams: [] })
      .then((data) => {
        const years = (Array.isArray(data?.exams) ? data.exams : [])
          .filter((exam) => exam?.is_active !== false)
          .map((exam) => String(exam?.year || "").trim())
          .filter((year) => /^20\d{2}$/.test(year));
        const propYears = (Array.isArray(yearCards) ? yearCards : [])
          .filter((year) => year?.available)
          .map((year) => normalizeHomeYearId(year).replace("year-", ""));
        setActiveYears(["2025", ...new Set([...years, ...propYears])]);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          const propYears = (Array.isArray(yearCards) ? yearCards : [])
            .filter((year) => year?.available)
            .map((year) => normalizeHomeYearId(year).replace("year-", ""));
          setActiveYears(["2025", ...new Set(propYears)]);
        }
      });

    return () => controller.abort();
  }, [yearCards]);

  return (
    <section className="app-shell grid gap-6 py-4 md:gap-8 md:py-8">
      <PremiumHero eyebrow="MauriResults" title={text.heroTitle} description={text.heroDesc} logo={logo} />
      <YearChoiceCards lang={lang} onSelectYear={onSelectYear} yearCards={yearCards} activeYears={activeYears} />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
