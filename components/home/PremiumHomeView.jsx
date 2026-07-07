"use client";

import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import ScrollProgress from "../ui/ScrollProgress";
import FAQSection from "./FAQSection";
import FeaturedStatistics from "./FeaturedStatistics";
import TestimonialsSection from "./TestimonialsSection";

function metricValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function PremiumYearCards({ lang, onSelectYear, text, yearCards }) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4" aria-label={text.chooseExam || "اختر المسابقة"}>
      {yearCards.map((year) => (
        <button
          className={`exam-card exam-card-${year.tone} ${year.available ? "" : "is-locked"}`}
          disabled={!year.available}
          key={year.id}
          onClick={() => onSelectYear(year)}
          type="button"
        >
          <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/40 blur-3xl dark:bg-white/10" aria-hidden="true" />
          <span className="exam-card-icon">{year.icon}</span>
          <span className="min-w-0 text-start">
            <strong className="block text-lg font-black text-slate-950 dark:text-white">{year.title[lang]}</strong>
            <small className="mt-1 block text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">{year.description[lang]}</small>
          </span>
          {!year.available && <span className="soon-badge">{text.soon}</span>}
        </button>
      ))}
    </section>
  );
}

function PremiumSiteBanner({ asset }) {
  if (!asset?.is_active || !asset?.image_url) return null;

  return (
    <figure className="overflow-hidden rounded-[30px] border border-white/70 bg-white/[.78] shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <img
        className="h-full max-h-[320px] w-full object-cover"
        src={asset.image_url}
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.closest("figure")?.remove();
        }}
      />
    </figure>
  );
}

export default function PremiumHomeView({ homepageBanner, lang = "ar", onSelectYear, stats, text, yearCards = [] }) {
  const activeYear = yearCards.find((year) => year.available) || yearCards[0];
  const openActiveYear = () => {
    if (activeYear) onSelectYear(activeYear);
  };

  const heroStats = [
    { label: text.studentCount || "النتائج", value: metricValue(stats?.total) },
    { label: text.passedCount || "الناجحون", value: metricValue(stats?.passed) },
    { label: text.highestAverage || "أعلى معدل", value: Math.round(metricValue(stats?.highest) * 100) / 100 },
  ];

  return (
    <section className="app-shell grid gap-6 py-4 md:gap-8 md:py-8">
      <ScrollProgress />
      <PremiumHero
        eyebrow="MauriResults"
        title={text.heroTitle}
        description={text.heroDesc}
        stats={heroStats}
        onSearchClick={openActiveYear}
        onExploreClick={openActiveYear}
        searchLabel={text.searchButton || "بحث"}
        exploreLabel={text.chooseExam || "اختر المسابقة"}
      />

      <FeaturedStatistics stats={stats} text={text} />

      <section className="grid gap-2 text-start">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{text.chooseExam}</span>
        <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{text.yearPageTitle}</h2>
        <p className="max-w-2xl text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{text.yearPageDesc}</p>
      </section>

      <PremiumYearCards lang={lang} onSelectYear={onSelectYear} text={text} yearCards={yearCards} />
      <TestimonialsSection />
      <FAQSection />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
