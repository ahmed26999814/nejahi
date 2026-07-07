import HeroBackground from "./HeroBackground";
import LogoMark from "../common/LogoMark";

export default function Hero({ title, description, eyebrow = "MauriResults", logo = "/logo.png" }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[34px] border border-white/70 bg-white/[.78] p-5 text-center shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:p-8" dir="rtl">
      <HeroBackground />
      <div className="relative z-10 mx-auto grid max-w-3xl justify-items-center gap-4">
        <LogoMark className="h-24 w-24 rounded-[28px] md:h-32 md:w-32" src={logo} />
        <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1 text-xs font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">{eyebrow}</span>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">{title}</h1>
        {description && <p className="max-w-xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{description}</p>}
      </div>
    </section>
  );
}
