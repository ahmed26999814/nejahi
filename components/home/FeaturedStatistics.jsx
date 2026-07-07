import AnimatedCounter from "../ui/AnimatedCounter";
import { AwardIcon, ChartIcon, SearchIcon } from "../common/icons";

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function progressValue(stats) {
  const total = safeNumber(stats?.total);
  const passed = safeNumber(stats?.passed);
  if (!total) return 0;
  return Math.max(0, Math.min(100, (passed / total) * 100));
}

export default function FeaturedStatistics({ stats, text }) {
  const passRate = progressValue(stats);
  const cards = [
    { label: text.studentCount || "الطلاب", value: safeNumber(stats?.total), icon: <SearchIcon /> },
    { label: text.passedCount || "الناجحون", value: safeNumber(stats?.passed), icon: <AwardIcon /> },
    { label: text.highestAverage || "أعلى معدل", value: Math.round(safeNumber(stats?.highest) * 100) / 100, icon: <ChartIcon /> },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-[1fr_.75fr] md:items-stretch">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <article className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white/[.78] p-4 shadow-soft backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-mauri-green/30 hover:shadow-premium dark:border-white/10 dark:bg-[#10231a]/75" key={card.label}>
            <span className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-mauri-green/10 blur-3xl transition group-hover:bg-mauri-gold/15" />
            <span className="grid h-10 w-10 place-items-center rounded-[16px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{card.icon}</span>
            <strong className="mt-4 block text-2xl font-black text-slate-950 dark:text-white">
              <AnimatedCounter value={card.value} />
            </strong>
            <span className="mt-1 block text-xs font-black text-slate-500 dark:text-slate-300">{card.label}</span>
          </article>
        ))}
      </div>

      <article className="relative overflow-hidden rounded-[26px] border border-white/70 bg-gradient-to-br from-mauri-green to-emerald-600 p-5 text-white shadow-premium dark:border-white/10">
        <span className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <span className="text-xs font-black text-white/80">Featured statistics</span>
        <h3 className="mt-2 text-xl font-black">{text.analyticsTitle || "إحصائيات النتائج"}</h3>
        <p className="mt-2 text-sm font-bold leading-7 text-white/80">{text.analyticsDesc || "لوحة مختصرة تساعد على فهم النتائج بسرعة."}</p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-white/85">
            <span>{text.passedCount || "الناجحون"}</span>
            <span>{passRate.toFixed(1)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.45)] transition-all duration-700" style={{ width: `${passRate}%` }} />
          </div>
        </div>
      </article>
    </section>
  );
}
