"use client";

import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import { contentValue } from "../common/content";
import PremiumSiteBanner from "./PremiumSiteBanner";
import Bac2026CountdownNotice from "../layout/Bac2026CountdownNotice";
import HomeResultsFinder from "./HomeResultsFinder";
import YearChoiceCards from "./YearChoiceCards";

export default function PremiumHomeView({
  content = {},
  homepageBanner,
  lang = "ar",
  onSelectYear,
  text,
  yearCards,
  examCards,
  catalogStatus,
  onRetry,
  onSearch,
}) {
  const logo = contentValue(content, "logo", "/brand-logo.svg");
  const labels = lang === "fr"
    ? {
        available: "Résultats disponibles",
        chooseYear: "Choisissez l’année du concours",
        automatic: "2025 · 2026",
      }
    : {
        available: "النتائج المتاحة",
        chooseYear: "اختر سنة المسابقة",
        automatic: "2025 · 2026",
      };

  return (
    <section className="app-shell results-home">
      <PremiumHero
        eyebrow="MauriResults"
        title={text.heroTitle}
        description={text.heroDesc}
        logo={logo}
        lang={lang}
      />

      <div id="quick-search" className="results-quick-search"><HomeResultsFinder exams={examCards} lang={lang} status={catalogStatus} onRetry={onRetry} onSearch={onSearch} /></div>

      <section className="scroll-mt-24 grid gap-3" id="years">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">
              {labels.available}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              {labels.chooseYear}
            </h2>
          </div>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
            {labels.automatic}
          </span>
        </header>

        <YearChoiceCards
          lang={lang}
          onSelectYear={onSelectYear}
          yearCards={yearCards}
        />
      </section>

      <Bac2026CountdownNotice exams={examCards} status={catalogStatus} lang={lang} />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
