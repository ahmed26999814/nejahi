"use client";

import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import { contentValue } from "../common/content";
import PremiumSiteBanner from "./PremiumSiteBanner";
import YearChoiceCards from "./YearChoiceCards";
import ExamLibraryPromo from "./ExamLibraryPromo";

export default function PremiumHomeView({
  content = {},
  homepageBanner,
  lang = "ar",
  onSelectYear,
  text,
  yearCards,
}) {
  const logo = contentValue(content, "logo", "/logo.png");

  return (
    <section className="app-shell grid gap-5 py-3 md:gap-10 md:py-8">
      <PremiumHero
        eyebrow="MauriResults"
        title={text.heroTitle}
        description={text.heroDesc}
        logo={logo}
      />

      <section className="scroll-mt-24 grid gap-3" id="years">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">
              النتائج المتاحة
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              اختر سنة المسابقة
            </h2>
          </div>
          <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
            تحديث تلقائي
          </span>
        </header>

        <YearChoiceCards
          lang={lang}
          onSelectYear={onSelectYear}
          yearCards={yearCards}
        />
      </section>

      <ExamLibraryPromo />
      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
