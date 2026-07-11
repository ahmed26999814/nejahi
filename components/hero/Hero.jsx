import HeroBackground from "./HeroBackground";
import LogoMark from "../common/LogoMark";

export default function Hero({ title, description, eyebrow = "MauriResults", logo = "/logo.png" }) {
  return (
    <section className="mobile-compact-hero relative isolate overflow-hidden rounded-[28px] border border-white/70 bg-white/[.80] px-4 py-4 text-center shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:rounded-[36px] md:px-8 md:py-10" dir="rtl">
      <HeroBackground />
      <div className="relative z-10 mx-auto grid max-w-4xl justify-items-center gap-2.5 md:gap-4">
        <LogoMark className="h-16 w-16 rounded-[20px] ring-4 ring-white/50 dark:ring-white/5 md:h-32 md:w-32 md:rounded-[28px] md:ring-8" src={logo} />
        <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3.5 py-1.5 text-xs font-black tracking-wide text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">{eyebrow}</span>
        <h1 className="max-w-3xl text-balance text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="max-w-2xl text-xs font-bold leading-5 text-slate-600 dark:text-slate-300 md:text-base md:leading-7">{description}</p>}
      </div>
    </section>
  );
}
