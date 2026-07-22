"use client";

import { Building2, ChevronLeft, GraduationCap, MapPin } from "lucide-react";

export default function OrientationFacultyCard({ faculty, onSelect }) {
  const categoryPreview = faculty.categories.slice(0, 2);

  return (
    <button
      className="group relative min-w-0 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-4 text-right shadow-[0_12px_38px_rgba(15,23,42,.06)] transition duration-200 hover:-translate-y-1 hover:border-mauri-green/35 hover:shadow-[0_18px_44px_rgba(21,128,61,.12)] active:scale-[.985] dark:border-white/10 dark:bg-white/[.055]"
      onClick={() => onSelect(faculty.key)}
      type="button"
    >
      <span className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl transition group-hover:scale-125 dark:bg-emerald-400/10" aria-hidden="true" />

      <span className="relative flex min-w-0 items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-mauri-green text-white shadow-[0_10px_24px_rgba(21,128,61,.24)]">
          <GraduationCap className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-lg font-black leading-7 text-slate-950 dark:text-white">
            {faculty.faculty}
          </strong>
          <span className="mt-1 flex min-w-0 items-start gap-1.5 text-xs font-bold leading-5 text-slate-500 dark:text-slate-300">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauri-green" />
            <span>{faculty.institution}</span>
          </span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-mauri-green group-hover:text-white dark:bg-white/10 dark:text-slate-200">
          <ChevronLeft className="h-4 w-4" />
        </span>
      </span>

      <span className="relative mt-4 grid grid-cols-3 gap-2">
        <span className="rounded-2xl bg-emerald-50 px-2.5 py-2 text-center dark:bg-emerald-300/10">
          <small className="block text-[10px] font-black text-emerald-700 dark:text-emerald-200">التخصصات</small>
          <strong className="mt-0.5 block text-xl font-black text-emerald-800 dark:text-emerald-100">{faculty.programs.length}</strong>
        </span>
        <span className="rounded-2xl bg-slate-50 px-2.5 py-2 text-center dark:bg-white/5">
          <small className="block text-[10px] font-black text-slate-500 dark:text-slate-300">أدنى معدل</small>
          <strong className="mt-0.5 block text-xl font-black text-slate-800 dark:text-white">{faculty.minimumScore.toFixed(2)}</strong>
        </span>
        <span className="rounded-2xl bg-amber-50 px-2.5 py-2 text-center dark:bg-amber-300/10">
          <small className="block text-[10px] font-black text-amber-700 dark:text-amber-200">فرصة قوية</small>
          <strong className="mt-0.5 block text-xl font-black text-amber-800 dark:text-amber-100">{faculty.strongCount}</strong>
        </span>
      </span>

      <span className="relative mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-200">
          <MapPin className="h-3 w-3" />
          {faculty.country}
        </span>
        {categoryPreview.map((category) => (
          <span className="rounded-lg bg-mauri-green/8 px-2 py-1 text-[11px] font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300" key={category}>
            {category}
          </span>
        ))}
        {faculty.categories.length > categoryPreview.length && (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">
            +{faculty.categories.length - categoryPreview.length}
          </span>
        )}
      </span>
    </button>
  );
}
