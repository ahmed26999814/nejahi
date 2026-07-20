"use client";

import Link from "next/link";
import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import { contentValue } from "../common/content";
import InstallAppCard from "./InstallAppCard";
import PremiumSiteBanner from "./PremiumSiteBanner";
import YearChoiceCards from "./YearChoiceCards";

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
      <InstallAppCard />

      <PremiumHero
        eyebrow="MauriResults"
        title={text.heroTitle}
        description={text.heroDesc}
        logo={logo}
      />

      <section className="rounded-[24px] border border-amber-300/50 bg-gradient-to-l from-amber-50 to-white p-4 shadow-sm dark:border-amber-300/15 dark:from-amber-300/5 dark:to-white/[0.03] md:p-5" aria-labelledby="bac-2026-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-amber-700 dark:text-amber-300">قريباً</p>
            <h2 id="bac-2026-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              نتائج باكالوريا 2026
            </h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
              ستتوفر في MauriResults فور صدورها الرسمية، مع البحث بالرقم أو الاسم وصفحات الأوائل والإحصائيات.
            </p>
          </div>
          <Link href="/results/bac/2026" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-mauri-green px-5 text-sm font-black text-white transition hover:opacity-90">
            متابعة الصفحة
          </Link>
        </div>
      </section>

      <nav aria-label="روابط النتائج المباشرة" className="grid grid-cols-2 gap-3">
        <Link href="/results/brevet/2026" className="rounded-2xl border border-mauri-border bg-white/80 px-4 py-3 text-center text-sm font-black text-slate-800 shadow-sm transition hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
          ابريفه 2026
        </Link>
        <Link href="/results/concours/2026" className="rounded-2xl border border-mauri-border bg-white/80 px-4 py-3 text-center text-sm font-black text-slate-800 shadow-sm transition hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
          كونكور 2026
        </Link>
      </nav>

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

      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
