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

const HOW_IT_WORKS = [
  { number: "01", icon: "📅", title: "اختر السنة", description: "ابدأ بسنة المسابقة، ولن تظهر لك إلا النتائج المنشورة والمفعلة." },
  { number: "02", icon: "🔎", title: "اختر المسابقة وابحث", description: "استخدم رقم المترشح أو الاسم، أو مسار الولاية والمقاطعة والمركز للكونكور." },
  { number: "03", icon: "🏆", title: "اعرض وشارك النتيجة", description: "اطّلع على القرار والرتبة والتفاصيل، ثم شارك رابط النتيجة أو اطبعها." },
];

const FAQ_ITEMS = [
  { question: "متى تُفتح نتائج سنة جديدة؟", answer: "تُفتح السنة تلقائيًا فور نشر نتيجة مفعلة من لوحة الإدارة، وتظل مغلقة قبل ذلك." },
  { question: "لماذا لا يظهر بعض الحقول في بطاقة النتيجة؟", answer: "تعرض البطاقة فقط الحقول الموجودة والمربوطة فعليًا في ملف النتائج، حتى تبقى واضحة ودقيقة." },
  { question: "هل يمكن البحث من الهاتف؟", answer: "نعم. الواجهة مهيأة للهاتف، والبحث والنتائج والإحصائيات تعمل بتصميم متجاوب." },
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
            className={`group relative block min-h-[150px] overflow-hidden rounded-[30px] border bg-gradient-to-br p-5 text-start shadow-premium transition duration-300 active:scale-[.99] hover:-translate-y-1 ${tone} ${available ? "" : "pointer-events-none opacity-80"}`}
          >
            <span className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-white/10 transition duration-500 group-hover:scale-150" />
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

function FeaturedStats({ stats = {} }) {
  const cards = [
    { icon: "👥", label: "عدد المترشحين", value: Number(stats.total || 0).toLocaleString("ar-MR") },
    { icon: "✅", label: "الناجحون", value: Number(stats.passed || 0).toLocaleString("ar-MR") },
    { icon: "⭐", label: "أعلى معدل", value: Number(stats.highest || 0).toFixed(2) },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="إحصائيات مميزة">
      {cards.map((card) => (
        <article className="group rounded-[26px] border border-white/70 bg-white/[.82] p-4 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-premium dark:border-white/10 dark:bg-white/[.07]" key={card.label}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mauri-green/10 text-xl transition group-hover:scale-110 dark:bg-emerald-300/10">{card.icon}</span>
            <div>
              <strong className="block text-xl font-black text-slate-950 dark:text-white">{card.value}</strong>
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{card.label}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="grid gap-4">
      <header className="text-center">
        <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">طريقة الاستخدام</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">من البحث إلى النتيجة في ثلاث خطوات</h2>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {HOW_IT_WORKS.map((step) => (
          <article className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/[.80] p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-premium dark:border-white/10 dark:bg-white/[.07]" key={step.number}>
            <span className="absolute left-4 top-3 text-4xl font-black text-mauri-green/[.08] dark:text-white/[.05]">{step.number}</span>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mauri-green/10 text-2xl dark:bg-emerald-300/10">{step.icon}</span>
            <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{step.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="grid gap-4">
      <header className="text-center">
        <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">الأسئلة الشائعة</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">إجابات سريعة وواضحة</h2>
      </header>
      <div className="mx-auto grid w-full max-w-3xl gap-2">
        {FAQ_ITEMS.map((item) => (
          <details className="group rounded-[22px] border border-white/70 bg-white/[.82] p-4 shadow-soft backdrop-blur-xl open:shadow-premium dark:border-white/10 dark:bg-white/[.07]" key={item.question}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950 dark:text-white">
              {item.question}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mauri-green/10 text-mauri-green transition group-open:rotate-45 dark:bg-emerald-300/10 dark:text-emerald-300">+</span>
            </summary>
            <p className="mt-3 border-t border-mauri-border/60 pt-3 text-sm font-bold leading-7 text-slate-500 dark:border-white/10 dark:text-slate-300">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function PremiumHomeView({ content = {}, homepageBanner, lang = "ar", onSelectYear, stats = {}, text, yearCards }) {
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
    <section className="app-shell grid gap-7 py-4 md:gap-10 md:py-8">
      <PremiumHero eyebrow="MauriResults" title={text.heroTitle} description={text.heroDesc} logo={logo} />
      <FeaturedStats stats={stats} />
      <section className="scroll-mt-24 grid gap-3" id="years">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">النتائج المتاحة</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">اختر سنة المسابقة</h2>
          </div>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">تحديث تلقائي</span>
        </header>
        <YearChoiceCards lang={lang} onSelectYear={onSelectYear} yearCards={yearCards} activeYears={activeYears} />
      </section>
      <PremiumSiteBanner asset={homepageBanner} />
      <HowItWorks />
      <FAQSection />
      <BackToTopButton />
    </section>
  );
}
