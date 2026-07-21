"use client";

import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  GitCompareArrows,
  GraduationCap,
} from "lucide-react";
import { getFit, STATUS_STYLES } from "./orientation-utils";

export default function OrientationProgramCard({
  average,
  compareIds,
  onCompare,
  onSave,
  program,
  savedIds,
}) {
  const fit = getFit(program, average);
  const style = STATUS_STYLES[fit.key];
  const saved = savedIds.includes(program.id);
  const compared = compareIds.includes(program.id);

  return (
    <article className="group flex min-w-0 flex-col rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_34px_rgba(15,23,42,.05)] transition hover:border-mauri-green/35 dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className={`rounded-xl border px-2.5 py-1.5 text-xs font-black ${style.className}`}>
          {style.label}
        </span>
        <span className="shrink-0 text-left">
          <small className="block text-xs font-bold text-slate-400">آخر معدل</small>
          <strong className="block text-xl font-black text-mauri-green dark:text-mauri-gold">
            {program.lastScore.toFixed(2)}
          </strong>
        </span>
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <span className="inline-flex rounded-lg bg-mauri-green/8 px-2 py-1 text-xs font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
          {program.category}
        </span>
        <h2 className="mt-2 text-lg font-black leading-7 text-slate-950 dark:text-white">
          {program.name}
        </h2>
        <div className="mt-3 grid min-w-0 gap-2 text-sm font-bold text-slate-500 dark:text-slate-300">
          <span className="flex min-w-0 items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />
            <span className="min-w-0">{program.institution}</span>
          </span>
          <span className="flex min-w-0 items-start gap-2">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />
            <span className="min-w-0">{program.faculty}</span>
          </span>
        </div>

        {Number.isFinite(average) && (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {fit.delta >= 0
              ? `معدلك أعلى بـ ${fit.delta.toFixed(2)}`
              : `الفارق ${Math.abs(fit.delta).toFixed(2)}`}
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-mauri-green px-4 text-sm font-black text-white transition hover:bg-emerald-700 active:scale-[.98]"
          href={`/orientation/${program.id}`}
        >
          التفاصيل
        </Link>
        <button
          className={`grid h-10 w-10 place-items-center rounded-xl border transition active:scale-95 ${
            saved
              ? "border-mauri-green bg-mauri-green text-white"
              : "border-slate-200 text-slate-500 hover:border-mauri-green hover:text-mauri-green dark:border-white/10 dark:text-slate-300"
          }`}
          onClick={() => onSave(program.id)}
          type="button"
          aria-label={saved ? "إزالة من الرغبات المحفوظة" : "حفظ ضمن الرغبات"}
          title={saved ? "محفوظ" : "حفظ"}
        >
          {saved ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
        </button>
        <button
          className={`grid h-10 w-10 place-items-center rounded-xl border transition active:scale-95 ${
            compared
              ? "border-mauri-gold bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200"
              : "border-slate-200 text-slate-500 hover:border-mauri-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300"
          }`}
          onClick={() => onCompare(program.id)}
          type="button"
          aria-label={compared ? "إزالة من المقارنة" : "إضافة إلى المقارنة"}
          title="مقارنة"
        >
          <GitCompareArrows className="h-4.5 w-4.5" />
        </button>
      </div>
    </article>
  );
}
