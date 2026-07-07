"use client";

import { useState } from "react";
import { SearchIcon } from "../common/icons";
import { QuickSearchChips } from "./SearchDesignKit";

function parseAverageValue(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export default function SearchPanel(props) {
  const { error, examTitle, handleSubmit, loading, message, onPickSuggestion, query, setQuery, suggestions = [], text } = props;
  const [focused, setFocused] = useState(false);
  const visibleSuggestions = focused && suggestions.length > 0;
  const quickSearchChips = [text?.candidateNumber || "رقم المترشح", text?.studentName || "اسم المترشح", examTitle].filter(Boolean);

  function pickSuggestion(student) {
    setFocused(false);
    onPickSuggestion(student);
  }

  return (
    <form onSubmit={(event) => { setFocused(false); handleSubmit(event); }} className="search-card animate-slide-up">
      <div className="col-span-full flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>
        <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">{text?.open || "البحث مفتوح"}</span>
      </div>
      <div className="col-span-full">
        <QuickSearchChips chips={quickSearchChips} onPick={() => { setQuery(""); setFocused(true); }} />
      </div>
      <div className="relative min-w-0 flex-1">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true"><SearchIcon /></span>
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => setTimeout(() => setFocused(false), 140)} onFocus={() => setFocused(true)} placeholder={text?.searchPlaceholder || "أدخل رقم المترشح أو الاسم الكامل"} />
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
      <button className="tap-button h-12 rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(21,128,61,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(21,128,61,.28)] active:scale-[.98] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={loading}>{loading ? (text?.searching || "بحث...") : (text?.searchButton || "بحث")}</button>
      {(error || message) && <p className={`col-span-full text-center text-xs font-black md:text-start ${error ? "text-red-600 dark:text-red-300" : "text-mauri-green dark:text-mauri-gold"}`}>{error || message}</p>}
    </form>
  );
}
