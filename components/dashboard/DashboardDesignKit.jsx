import AnimatedCounter from "../ui/AnimatedCounter";
import { ChartIcon } from "../common/icons";

function percent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
}

export function DashboardMetricCard({ label, value, hint, icon = <ChartIcon /> }) {
  return (
    <article className="rounded-[26px] border border-white/70 bg-white/[.78] p-4 shadow-soft backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-premium dark:border-white/10 dark:bg-[#10231a]/75">
      <span className="grid h-10 w-10 place-items-center rounded-[16px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <strong className="mt-4 block text-2xl font-black text-slate-950 dark:text-white"><AnimatedCounter value={value} /></strong>
      <span className="mt-1 block text-xs font-black text-slate-500 dark:text-slate-300">{label}</span>
      {hint && <p className="mt-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">{hint}</p>}
    </article>
  );
}

export function BarChartCard({ title = "Bar Chart", rows = [] }) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/[.78] p-5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <div className="grid gap-1" key={row.label}>
            <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-300">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <span className="block h-full rounded-full bg-gradient-to-l from-mauri-green to-mauri-gold transition-all duration-700" style={{ width: `${percent(row.percent ?? row.value)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LeaderboardCard({ title = "Leaderboard", rows = [] }) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/[.78] p-5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-4 grid gap-2">
        {rows.map((row, index) => (
          <article className="flex items-center gap-3 rounded-[20px] border border-mauri-border bg-white/70 p-3 shadow-soft dark:border-white/10 dark:bg-white/[.06]" key={row.id || row.label}>
            <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-sm font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">#{index + 1}</span>
            <span className="min-w-0 flex-1">
              <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{row.label}</strong>
              {row.hint && <small className="line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{row.hint}</small>}
            </span>
            <strong className="text-sm font-black text-mauri-green dark:text-mauri-gold">{row.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
