"use client";

import PremiumHero from "../hero/Hero";

function metricValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function PremiumYearCards({ lang, onSelectYear, text, yearCards }) {
  return (
    <section className="premium-year-grid" aria-label={text.chooseExam || "اختر المسابقة"}>
      {yearCards.map((year) => (
        <button
          className={`premium-year-card exam-card-${year.tone} ${year.available ? "" : "is-locked"}`}
          disabled={!year.available}
          key={year.id}
          onClick={() => onSelectYear(year)}
          type="button"
        >
          <span className="premium-year-card-glow" aria-hidden="true" />
          <span className="premium-year-card-icon">{year.icon}</span>
          <span className="min-w-0 text-start">
            <strong>{year.title[lang]}</strong>
            <small>{year.description[lang]}</small>
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
    <figure className="premium-site-banner">
      <img
        src={asset.image_url}
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.closest(".premium-site-banner")?.remove();
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
    <section className="app-shell premium-home-view">
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

      <section className="premium-home-section-header">
        <span>{text.chooseExam}</span>
        <h2>{text.yearPageTitle}</h2>
        <p>{text.yearPageDesc}</p>
      </section>

      <PremiumYearCards lang={lang} onSelectYear={onSelectYear} text={text} yearCards={yearCards} />
      <PremiumSiteBanner asset={homepageBanner} />
    </section>
  );
}
