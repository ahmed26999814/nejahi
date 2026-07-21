"use client";

import { ChevronDown, Heart, Search, SlidersHorizontal } from "lucide-react";
import { STREAM_ORDER } from "../../data/orientation-programs";

const fieldClass = "h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-mauri-green dark:border-white/10 dark:bg-[#0b1c13]";

export default function OrientationFilters({
  advancedOpen,
  averageInput,
  categories,
  category,
  formError,
  institution,
  institutions,
  onEdit,
  onReset,
  onSubmit,
  query,
  savedCount,
  savedOnly,
  setAdvancedOpen,
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
  submitted,
}) {
  if (!submitted) {
    return (
      <section className="w-full min-w-0 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055]">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">أدخل بياناتك</h2>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">
            نحتاج الشعبة والمعدل فقط لعرض التخصصات المناسبة.
          </p>
        </div>

        <form className="grid min-w-0 grid-cols-2 gap-3" onSubmit={onSubmit}>
          <label className="grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">شعبة الباك</span>
            <select className={fieldClass} value={stream} onChange={(event) => setStream(event.target.value)} required>
              <option value="">اختر الشعبة</option>
              {STREAM_ORDER.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">المعدل</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              min="0"
              max="20"
              step="0.01"
              placeholder="13.50"
              value={averageInput}
              onChange={(event) => setAverageInput(event.target.value)}
              required
            />
          </label>

          {formError && (
            <p className="col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 dark:bg-rose-300/10 dark:text-rose-200">
              {formError}
            </p>
          )}

          <button className="col-span-2 min-h-12 rounded-2xl bg-mauri-green px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(21,128,61,.2)] transition active:scale-[.98]" type="submit">
            عرض التخصصات المناسبة
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-soft dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span className="rounded-xl bg-mauri-green/10 px-3 py-2 text-sm font-black text-mauri-green dark:text-emerald-300">
            {stream}
          </span>
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-white">
            المعدل {averageInput}
          </span>
        </div>
        <button className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={onEdit} type="button">
          تعديل
        </button>
      </div>

      <button
        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        onClick={() => setAdvancedOpen((value) => !value)}
        type="button"
        aria-expanded={advancedOpen}
      >
        <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> فلاتر إضافية</span>
        <ChevronDown className={`h-4 w-4 transition ${advancedOpen ? "rotate-180" : ""}`} />
      </button>

      {advancedOpen && (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-white/5">
          <label className="grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">مكان الدراسة</span>
            <select className={fieldClass} value={studyType} onChange={(event) => setStudyType(event.target.value)}>
              <option value="">الداخل والخارج</option>
              <option>داخل موريتانيا</option>
              <option>بعثة خارجية</option>
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">المجال</span>
            <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">كل المجالات</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="col-span-2 grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">البحث عن تخصص</span>
            <span className="relative min-w-0">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${fieldClass} pr-10`} placeholder="اسم التخصص أو الجامعة" value={query} onChange={(event) => setQuery(event.target.value)} />
            </span>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">المؤسسة</span>
            <select className={fieldClass} value={institution} onChange={(event) => setInstitution(event.target.value)}>
              <option value="">كل المؤسسات</option>
              {institutions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="px-1 text-sm font-black text-slate-600 dark:text-slate-200">الترتيب</span>
            <select className={fieldClass} value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recommended">الأنسب أولاً</option>
              <option value="score-desc">أعلى معدل</option>
              <option value="score-asc">أقل معدل</option>
              <option value="name">حسب الاسم</option>
            </select>
          </label>

          <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
            <button className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-black ${savedOnly ? "border-mauri-green bg-mauri-green text-white" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-200"}`} onClick={() => setSavedOnly((value) => !value)} type="button">
              <Heart className="h-4 w-4" /> المحفوظة ({savedCount})
            </button>
            <button className="min-h-10 px-2 text-sm font-black text-slate-500 underline-offset-4 hover:text-mauri-green hover:underline dark:text-slate-300" onClick={onReset} type="button">
              مسح الفلاتر
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
