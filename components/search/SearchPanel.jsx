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
    <form onSubmit={(event) => { setFocused(false); handleSubmit(event); }} className="search-card animate-slide-up" aria-busy={loading}>
      <div className="col-span-full grid gap-2 px-1 md:flex md:items-center md:justify-between">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>
        <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
          البحث عن طريق الرقم أو الاسم
        </span>
      </div>
      <div className="relative min-w-0 flex-1">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true"><SearchIcon /></span>
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => setTimeout(() => setFocused(false), 140)} onFocus={() => setFocused(true)} placeholder={text?.searchPlaceholder || "أدخل رقم المترشح أو الاسم الكامل"} inputMode={/^\d*$/.test(query) ? "numeric" : "text"} enterKeyHint="search" autoComplete="off" aria-describedby={(error || message) ? "search-feedback" : undefined} />
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
      <button className="search-submit mobile-sticky-search tap-button" type="submit" disabled={loading}>
        {loading && <span className="search-spinner" aria-hidden="true" />}
        <span>{loading ? (text?.searching || "بحث...") : (text?.searchButton || "بحث")}</span>
      </button>
      {(error || message) && <div id="search-feedback" role={error ? "alert" : "status"} className={`search-feedback ${error ? "search-feedback-error" : "search-feedback-success"}`}><p>{error || message}</p>{error && <ul className="mt-1 list-disc ps-5 font-bold"><li>{text?.checkCandidateNumber || "تأكد من كتابة رقم المترشح بصورة صحيحة."}</li><li>{text?.checkExam || "تأكد من اختيار المسابقة الصحيحة."}</li><li>{text?.tryLeadingZeros || "جرّب الرقم بالأصفار الموجودة في بدايته أو بدونها."}</li></ul>}</div>}
    </form>
  );
}
