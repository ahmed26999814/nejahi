"use client";

import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  GitCompareArrows,
  GraduationCap,
  MapPin,
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
    <article className="group flex min-h-full flex-col rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_45px_rgba(15,23,42,.055)] transition hover:-translate-y-1 hover:border-mauri-green/35 hover:shadow-[0_20px_55px_rgba(21,128,61,.10)] dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${style.className}`}>
          {style.label}
        </span>
        <strong className="rounded-2xl bg-mauri-green/10 px-3 py-2 text-lg font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
          {program.lastScore.toFixed(2)}
        </strong>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">
          {program.category}
        </p>
        <h2 className="mt-1 text-lg font-black leading-7 text-slate-950 dark:text-white">
          {program.name}
        </h2>
        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
          <span className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />
            {program.institution}
          </span>
          <span className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />
            {program.faculty}
          </span>
          <span className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />
            {program.country} · {program.stream}
          </span>
        </div>

        {Number.isFinite(average) && (
          <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {fit.delta >= 0
              ? `معدلك أعلى من آخر معدل مسجل بـ ${fit.delta.toFixed(2)}`
              : `يفصلك عن آخر معدل مسجل ${Math.abs(fit.delta).toFixed(2)}`}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-mauri-green px-4 text-sm font-black text-white transition hover:bg-emerald-700 active:scale-[.98]"
          href={`/orientation/${program.id}`}
        >
          تفاصيل التخصص
        </Link>
        <button
          className={`grid h-11 w-11 place-items-center rounded-2xl border transition active:scale-95 ${
            saved
              ? "border-mauri-green bg-mauri-green text-white"
              : "border-slate-200 text-slate-500 hover:border-mauri-green hover:text-mauri-green dark:border-white/10 dark:text-slate-300"
          }`}
          onClick={() => onSave(program.id)}
          type="button"
          aria-label={saved ? "إزالة من الرغبات المحفوظة" : "حفظ ضمن الرغبات"}
          title={saved ? "محفوظ" : "حفظ"}
        >
          {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
        </button>
        <button
          className={`grid h-11 w-11 place-items-center rounded-2xl border transition active:scale-95 ${
            compared
              ? "border-mauri-gold bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200"
              : "border-slate-200 text-slate-500 hover:border-mauri-gold hover:text-amber-700 dark:border-white/10 dark:text-slate-300"
          }`}
          onClick={() => onCompare(program.id)}
          type="button"
          aria-label={compared ? "إزالة من المقارنة" : "إضافة إلى المقارنة"}
          title="مقارنة"
        >
          <GitCompareArrows className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
