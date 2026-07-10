import { memo } from "react";

const TONES = {
  admis: "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100",
  sessionnaire: "border-amber-500/35 bg-amber-50 text-amber-800 dark:border-amber-300/45 dark:bg-amber-400/15 dark:text-amber-100",
  ajourne: "border-red-500/30 bg-red-50 text-red-800 dark:border-red-300/45 dark:bg-red-500/15 dark:text-red-100",
  absent: "border-slate-400/35 bg-slate-100 text-slate-800 dark:border-slate-300/35 dark:bg-slate-400/15 dark:text-slate-100",
  unknown: "border-slate-300/50 bg-slate-50 text-slate-800 dark:border-white/20 dark:bg-white/10 dark:text-white",
};

function DecisionStrip({ label = "القرار", status }) {
  const tone = TONES[status?.className] || TONES.unknown;
  return (
    <div className={`mt-3 flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-3 shadow-sm ${tone}`} role="status" aria-label={`${label}: ${status?.label || "-"}`}>
      <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-black dark:bg-white/10">{label}</span>
      <strong className="text-xl font-black leading-tight md:text-2xl">{status?.label || "-"}</strong>
    </div>
  );
}

export default memo(DecisionStrip);
