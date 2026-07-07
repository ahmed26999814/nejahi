import HeroBackground from "./HeroBackground";
import HeroButtons from "./HeroButtons";
import HeroStats from "./HeroStats";
import HeroTrustBadges from "./HeroTrustBadges";
import GlassCard from "../ui/GlassCard";

export default function Hero({ title, description, eyebrow = "MauriResults", stats, onSearchClick, onExploreClick, searchLabel, exploreLabel }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[34px] border border-white/70 bg-white/[.78] p-5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:p-8" dir="rtl">
      <HeroBackground />
      <div className="grid gap-5 md:grid-cols-[1.2fr_.8fr] md:items-center">
        <div className="relative z-10 grid gap-4 text-start">
          <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1 text-xs font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">{eyebrow}</span>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">{title}</h1>
          <p className="max-w-xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          <HeroButtons onSearchClick={onSearchClick} onExploreClick={onExploreClick} searchLabel={searchLabel} exploreLabel={exploreLabel} />
          <HeroTrustBadges />
        </div>
        <GlassCard className="relative z-10 hidden md:block">
          <span className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">لوحة النتائج</span>
          <strong className="mt-2 block text-2xl font-black text-slate-950 dark:text-white">MauriResults</strong>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">منصة سريعة ومنظمة لعرض نتائج المسابقات الوطنية في موريتانيا.</p>
          <HeroStats stats={stats} />
        </GlassCard>
      </div>
    </section>
  );
}
