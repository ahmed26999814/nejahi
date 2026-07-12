"use client";

import { useState } from "react";
import { SearchIcon } from "../common/icons";
import SearchFeedback from "./SearchFeedback";
import SearchSuggestions from "./SearchSuggestions";
import { getSearchInputMode } from "./searchUtils";

export default function SearchPanel(props) {
  const {
    error,
    examTitle,
    handleSubmit,
    loading,
    message,
    onPickSuggestion,
    query,
    setQuery,
    suggestions = [],
    text,
  } = props;

  const [focused, setFocused] = useState(false);
  const visibleSuggestions = focused && suggestions.length > 0;

  function submit(event) {
    setFocused(false);
    handleSubmit(event);
  }

  function pickSuggestion(student) {
    setFocused(false);
    onPickSuggestion(student);
  }

  return (
    <form
      onSubmit={submit}
      className="search-card animate-slide-up"
      aria-busy={loading}
    >
      <div className="col-span-full grid gap-2 px-1 md:flex md:items-center md:justify-between">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">
          {examTitle}
        </span>
        <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
          البحث عن طريق الرقم أو الاسم
        </span>
      </div>

      <div className="relative min-w-0 flex-1">
        <label className="relative block">
          <span
            className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold"
            aria-hidden="true"
          >
            <SearchIcon />
          </span>
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => setTimeout(() => setFocused(false), 140)}
            onFocus={() => setFocused(true)}
            placeholder={text?.searchPlaceholder || "أدخل رقم المترشح أو الاسم الكامل"}
            inputMode={getSearchInputMode(query)}
            enterKeyHint="search"
            autoComplete="off"
            aria-describedby={(error || message) ? "search-feedback" : undefined}
          />
        </label>

        {visibleSuggestions && (
          <SearchSuggestions
            suggestions={suggestions}
            onPick={pickSuggestion}
          />
        )}
      </div>

      <button
        className="search-submit mobile-sticky-search tap-button"
        type="submit"
        disabled={loading}
      >
        {loading && <span className="search-spinner" aria-hidden="true" />}
        <span>{loading ? (text?.searching || "بحث...") : (text?.searchButton || "بحث")}</span>
      </button>

      <SearchFeedback error={error} message={message} text={text} />
    </form>
  );
}
