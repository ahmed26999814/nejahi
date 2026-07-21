"use client";

import Link from "next/link";
import PremiumHero from "../hero/Hero";
import BackToTopButton from "../ui/BackToTopButton";
import { contentValue } from "../common/content";
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

      <Link
        className="group relative overflow-hidden rounded-[30px] border border-emerald-200/80 bg-gradient-to-l from-emerald-50 via-white to-white p-5 shadow-premium transition hover:-translate-y-1 hover:border-mauri-green/35 hover:shadow-glow dark:border-emerald-300/15 dark:from-emerald-300/10 dark:via-white/[.055] dark:to-white/[.035]"
        href="/orientation"
      >
        <span className="absolute -left-10 -top-14 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-400/10" aria-hidden="true" />
        <span className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-mauri-green text-2xl text-white shadow-[0_14px_30px_rgba(21,128,61,.22)]">
            🎓
          </span>
          <span className="min-w-0 flex-1">
            <small className="font-black text-mauri-green dark:text-mauri-gold">
              جديد في MauriResults
            </small>
            <strong className="mt-1 block text-xl font-black text-slate-950 dark:text-white md:text-2xl">
              ماذا يمكنني دراسة بمعدلي؟
            </strong>
            <span className="mt-1 block text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
              اكتشف التخصصات المناسبة لشعبة الباك ومعدلك، واحفظ رغباتك وقارن بينها.
            </span>
          </span>
          <span className="hidden rounded-full bg-mauri-green px-4 py-2 text-xs font-black text-white transition group-hover:bg-emerald-700 sm:inline-flex">
            فتح الدليل
          </span>
        </span>
      </Link>

      <PremiumSiteBanner asset={homepageBanner} />
      <BackToTopButton />
    </section>
  );
}
