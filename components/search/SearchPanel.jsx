"use client";

import { useState } from "react";
import { SearchIcon } from "../common/icons";

function parseAverageValue(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export default function SearchPanel(props) {
  const { error, examTitle, handleSubmit, loading, message, onPickSuggestion, query, setQuery, suggestions = [], text } = props;
  const [focused, setFocused] = useState(false);
  const visibleSuggestions = focused && suggestions.length > 0;

  function pickSuggestion(student) {
    setFocused(false);
    onPickSuggestion(student);
  }

  return (
    <form onSubmit={(event) => { setFocused(false); handleSubmit(event); }} className="search-card animate-slide-up">
      <div className="col-span-full grid gap-2 px-1 md:flex md:items-center md:justify-between">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>
        <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
          البحث عن طريق الرقم أو الاسم
        </span>
      </div>
      <div className="relative min-w-0 flex-1">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true"><SearchIcon /></span>
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => setTimeout(() => setFocused(false), 140)} onFocus={() => setFocused(true)} placeholder={text?.searchPlaceholder || "أدخل رقم المترشح أو الاسم الكامل"} inputMode={/^\d*$/.test(query) ? "numeric" : "text"} enterKeyHint="search" autoComplete="off" />
        </label>
        {visibleSuggestions && (
          <div className="suggestions-panel">
            {suggestions.map((student) => (
              <button className="suggestion-item" key={student.id} onMouseDown={(event) => event.preventDefault()} onClick={() => pickSuggestion(student)} type="button">
                <span className="min-w-0 text-start">
                  <strong className="line-clamp-1 block">{student.name}</strong>
                  <small className="line-clamp-1 text-slate-500 dark:text-slate-400">{student.id}{student.track ? " - " + student.track : ""}</small>
                </span>
                <span className="rounded-full bg-mauri-green/10 px-2 py-1 text-xs font-black text-mauri-green">{parseAverageValue(student.MOD).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="mobile-sticky-search tap-button h-12 rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(21,128,61,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(21,128,61,.28)] active:scale-[.98] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={loading}>{loading ? (text?.searching || "بحث...") : (text?.searchButton || "بحث")}</button>
      {(error || message) && <div className={`col-span-full rounded-[16px] px-3 py-2 text-xs font-black leading-6 ${error ? "bg-red-50 text-red-700 dark:bg-red-300/10 dark:text-red-200" : "bg-emerald-50 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-200"}`}><p>{error || message}</p>{error && <ul className="mt-1 list-disc ps-5 font-bold"><li>{text?.checkCandidateNumber || "تأكد من كتابة رقم المترشح بصورة صحيحة."}</li><li>{text?.checkExam || "تأكد من اختيار المسابقة الصحيحة."}</li><li>{text?.tryLeadingZeros || "جرّب الرقم بالأصفار الموجودة في بدايته أو بدونها."}</li></ul>}</div>}
    </form>
  );
}
