import { AwardIcon, HashIcon, InfoIcon } from "../common/icons";
import { ScoreBadge, StatusBadge } from "./ResultDesignKit";
import VerificationBadge from "./VerificationBadge";

export default function ResultOfficialSummary({ average, code, exam, maxScore, name, number, status, statusLabel, text }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/[.82] p-5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
      <span className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-mauri-green/10 blur-3xl" />
      <span className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-mauri-gold/10 blur-3xl" />
      <div className="relative z-10 grid gap-4 lg:grid-cols-[1fr_.45fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} label={statusLabel} />
            <VerificationBadge label={text?.verification || "رقم التحقق"} value={code} />
          </div>
          <p className="mt-4 text-[11px] font-black text-mauri-green dark:text-mauri-gold">{text?.studentName || "اسم المترشح"}</p>
          <h2 className="mt-1 text-balance text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">{name}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 rounded-[18px] border border-white/70 bg-white/[.72] px-3 py-2 text-xs font-black text-slate-600 shadow-soft dark:border-white/10 dark:bg-white/[.06] dark:text-slate-300"><HashIcon />{number}</span>
            <span className="inline-flex items-center gap-2 rounded-[18px] border border-white/70 bg-white/[.72] px-3 py-2 text-xs font-black text-slate-600 shadow-soft dark:border-white/10 dark:bg-white/[.06] dark:text-slate-300"><AwardIcon />{exam}</span>
          </div>
        </div>
        <ScoreBadge label={text?.averageLabel || "المعدل"} value={average} max={maxScore} />
      </div>
    </section>
  );
}
