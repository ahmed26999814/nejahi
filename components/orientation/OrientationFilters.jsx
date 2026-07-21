"use client";

import { Building2, Heart, Search, Sparkles } from "lucide-react";
import { STREAM_ORDER } from "../../data/orientation-programs";

export default function OrientationFilters({
  averageInput,
  categories,
  category,
  institution,
  institutions,
  onReset,
  query,
  savedCount,
  savedOnly,
  setAverageInput,
  setCategory,
  setInstitution,
  setQuery,
  setSavedOnly,
  setSort,
  setStream,
  setStudyType,
  sort,
  stream,
  studyType,
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">البحث الذكي</p>
          <h2 className="text-xl font-black">حدد بياناتك</h2>
        </div>
        <button className="text-xs font-black text-slate-500 underline-offset-4 hover:text-mauri-green hover:underline dark:text-slate-300" onClick={onReset} type="button">
          إعادة الضبط
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <label className="grid gap-1.5">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">شعبة الباك</span>
          <select className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" value={stream} onChange={(event) => setStream(event.target.value)}>
            <option value="">كل الشعب</option>
            {STREAM_ORDER.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">المعدل</span>
          <input className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" inputMode="decimal" min="0" max="20" step="0.01" placeholder="مثال: 13.50" value={averageInput} onChange={(event) => setAverageInput(event.target.value)} />
        </label>

        <label className="grid gap-1.5">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">مكان الدراسة</span>
          <select className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" value={studyType} onChange={(event) => setStudyType(event.target.value)}>
            <option value="">الداخل والخارج</option>
            <option>داخل موريتانيا</option>
            <option>بعثة خارجية</option>
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">المجال</span>
          <select className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">كل المجالات</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label className="col-span-2 grid gap-1.5 lg:col-span-2">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">اسم التخصص أو المؤسسة</span>
          <span className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-12 w-full rounded-2xl border border-slate-200 bg-white pr-10 pl-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" placeholder="ابحث بالاسم، الكلية أو الجامعة" value={query} onChange={(event) => setQuery(event.target.value)} />
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">المؤسسة</span>
          <select className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" value={institution} onChange={(event) => setInstitution(event.target.value)}>
            <option value="">كل المؤسسات</option>
            {institutions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-300">الترتيب</span>
          <select className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recommended">الأنسب أولاً</option>
            <option value="score-desc">أعلى معدل مسجل</option>
            <option value="score-asc">أقل معدل مسجل</option>
            <option value="name">حسب الاسم</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-black transition ${savedOnly ? "border-mauri-green bg-mauri-green text-white" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-200"}`} onClick={() => setSavedOnly((value) => !value)} type="button">
          <Heart className="h-4 w-4" /> المحفوظة ({savedCount})
        </button>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-xs font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={() => { setSort("score-desc"); setInstitution(""); }} type="button">
          <Sparkles className="h-4 w-4" /> الأعلى تنافساً
        </button>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-xs font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={() => setInstitution("جامعة نواذيبو")} type="button">
          <Building2 className="h-4 w-4" /> جامعة نواذيبو
        </button>
      </div>
    </section>
  );
}
