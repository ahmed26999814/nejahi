import AnimatedCounter from "../ui/AnimatedCounter";
import { ChartIcon } from "../common/icons";

function percent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
}

const cardClass = "rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-soft transition-[transform,border-color,box-shadow] duration-200 dark:border-white/10 dark:bg-[#10231a] md:rounded-[30px] md:p-5";
const interactiveClass = "cursor-pointer touch-manipulation hover:-translate-y-0.5 hover:border-mauri-green/35 hover:shadow-premium active:translate-y-0 active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mauri-green/15";

function CardShell({ children, className = "", onClick, ariaLabel }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${cardClass} ${interactiveClass} w-full text-start ${className}`}
      >
        {children}
      </button>
    );
  }

  return <section className={`${cardClass} ${className}`}>{children}</section>;
}

function CardHeader({ title, actionLabel, onClick }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="min-w-0 text-base font-black text-slate-950 dark:text-white md:text-lg">{title}</h3>
      {onClick && (
        <span className="shrink-0 rounded-full bg-mauri-green/10 px-3 py-1.5 text-[10px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
          {actionLabel || "عرض التفاصيل"} ←
        </span>
      )}
    </div>
  );
}

export function DashboardMetricCard({ label, value, hint, icon = <ChartIcon />, onClick }) {
  return (
    <CardShell onClick={onClick} ariaLabel={`${label}: ${value}`}>
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <strong className="mt-3 block text-2xl font-black tabular-nums text-slate-950 dark:text-white"><AnimatedCounter value={value} /></strong>
      <span className="mt-1 block text-xs font-black text-slate-500 dark:text-slate-300">{label}</span>
      {hint && <p className="mt-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">{hint}</p>}
    </CardShell>
  );
}

export function BarChartCard({ title = "Bar Chart", rows = [], onClick, onRowClick, actionLabel }) {
  return (
    <CardShell className="min-w-0" onClick={onClick} ariaLabel={onClick ? `${title}، عرض التفاصيل` : undefined}>
      <CardHeader title={title} actionLabel={actionLabel} onClick={onClick} />
      <div className="mt-4 grid gap-2.5">
        {rows.map((row) => {
          const content = (
            <>
              <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-500 dark:text-slate-300">
                <span className="min-w-0 truncate">{row.label}</span>
                <span className="shrink-0 tabular-nums text-mauri-green dark:text-mauri-gold">{row.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <span className="block h-full rounded-full bg-gradient-to-l from-mauri-green to-mauri-gold" style={{ width: `${percent(row.percent ?? row.value)}%` }} />
              </div>
            </>
          );

          return onRowClick ? (
            <button
              type="button"
              className="grid touch-manipulation gap-1.5 rounded-xl p-1.5 text-start transition hover:bg-mauri-green/5 active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauri-green/20"
              key={row.id || row.label}
              onClick={(event) => {
                event.stopPropagation();
                onRowClick(row);
              }}
            >
              {content}
            </button>
          ) : (
            <div className="grid gap-1.5" key={row.id || row.label}>{content}</div>
          );
        })}
      </div>
    </CardShell>
  );
}

export function PieChartCard({ title = "Pie Chart", value = 68, label = "نسبة النجاح", onClick, actionLabel }) {
  const p = percent(value);
  return (
    <CardShell onClick={onClick} ariaLabel={onClick ? `${title}: ${p.toFixed(0)} بالمائة، عرض التفاصيل` : undefined}>
      <CardHeader title={title} actionLabel={actionLabel} onClick={onClick} />
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4 md:grid-cols-1 md:place-items-center">
        <div
          className="grid h-28 w-28 shrink-0 place-items-center rounded-full shadow-soft md:h-36 md:w-36"
          style={{ background: `conic-gradient(#15803d ${p * 3.6}deg, rgba(21,128,61,.10) 0deg)` }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-soft dark:bg-[#10231a] md:h-24 md:w-24">
            <strong className="text-xl font-black tabular-nums text-mauri-green dark:text-mauri-gold md:text-2xl">{p.toFixed(0)}%</strong>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-300 md:text-[10px]">{label}</span>
          </div>
        </div>
        <div className="min-w-0 md:text-center">
          <strong className="block text-sm font-black text-slate-900 dark:text-white">ملخص سريع</strong>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">اضغط لعرض الجدول والتفاصيل الكاملة.</p>
        </div>
      </div>
    </CardShell>
  );
}

export function LeaderboardCard({ title = "Leaderboard", rows = [], onRowClick }) {
  return (
    <CardShell>
      <CardHeader title={title} />
      <div className="mt-4 grid gap-2">
        {rows.map((row, index) => (
          <button
            type="button"
            className={`${interactiveClass} flex w-full items-center gap-3 rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-3 text-start dark:border-white/10 dark:bg-white/[.05]`}
            key={row.id || row.label}
            onClick={() => onRowClick?.(row)}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-mauri-green/10 text-sm font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">#{index + 1}</span>
            <span className="min-w-0 flex-1">
              <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{row.label}</strong>
              {row.hint && <small className="line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{row.hint}</small>}
            </span>
            <strong className="shrink-0 text-sm font-black tabular-nums text-mauri-green dark:text-mauri-gold">{row.value}</strong>
          </button>
        ))}
      </div>
    </CardShell>
  );
}
