import { AwardIcon, CheckCircleIcon, InfoIcon, UserIcon } from "../common/icons";

export function StatusBadge({ status = "unknown", label }) {
  const styles = {
    admis: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    sessionnaire: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    ajourne: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
    absent: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
    calm: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
    unknown: "bg-mauri-green/10 text-mauri-green ring-mauri-green/20 dark:text-emerald-300",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ring-1 ${styles[status] || styles.unknown}`}>
      <CheckCircleIcon />
      {label || status}
    </span>
  );
}

export function ScoreBadge({ value, max, label = "المعدل" }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-mauri-green to-emerald-600 p-4 text-white shadow-premium">
      <span className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/20 blur-3xl" />
      <span className="text-[11px] font-black text-white/75">{label}</span>
      <strong className="mt-1 block text-3xl font-black">{value}{max ? <small className="text-base text-white/70"> / {max}</small> : null}</strong>
    </div>
  );
}

export function CandidateProfileCard({ name, id, school, status, statusLabel, score, maxScore }) {
  return (
    <article className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/[.82] p-5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <span className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-mauri-green/10 blur-3xl" />
      <span className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-mauri-gold/10 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><UserIcon /></span>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <h3 className="mt-4 text-balance text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">{name}</h3>
      <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{id} - {school}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[.7fr_1fr] sm:items-center">
        <ScoreBadge value={score} max={maxScore} />
        <div className="rounded-[22px] border border-mauri-border bg-white/60 p-4 dark:border-white/10 dark:bg-white/[.06]">
          <span className="inline-flex items-center gap-2 text-xs font-black text-mauri-green dark:text-mauri-gold"><AwardIcon /> بطاقة نتيجة جاهزة للمشاركة</span>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">تفاصيل المترشح مصممة لتكون واضحة على الهاتف وقابلة للطباعة والمشاركة.</p>
        </div>
      </div>
    </article>
  );
}

export function ResultDetailsGrid({ details = [] }) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {details.map((item) => (
        <article className="rounded-[20px] border border-white/70 bg-white/[.72] p-3 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[.06]" key={item.label}>
          <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><InfoIcon /></span>
          <span className="mt-2 block text-[11px] font-black text-slate-500 dark:text-slate-400">{item.label}</span>
          <strong className="mt-1 block break-words text-sm font-black text-slate-950 dark:text-white">{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

export function ResultActionRail({ children }) {
  return (
    <div className="grid gap-2 rounded-[26px] border border-white/70 bg-white/[.72] p-3 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[.06] sm:grid-cols-4">
      {children}
    </div>
  );
}
