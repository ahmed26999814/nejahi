"use client";

import { useId } from "react";

import { SearchIcon } from "../common/icons";
import ForgotCandidateNumber from "../ui/ForgotCandidateNumber";
import SearchFeedback from "./SearchFeedback";
import { sanitizeCandidateNumber } from "./searchUtils";

export default function SearchPanel(props) {
  const {
    error,
    examTitle,
    handleSubmit,
    loading,
    message,
    query,
    setQuery,
    text,
  } = props;

  const feedbackId = useId();
  const hintId = useId();
  const isFrench = text?.searchButton === "Rechercher";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="search-card animate-slide-up"
        aria-busy={loading}
      >
        <div className="col-span-full grid gap-2 px-1 md:flex md:items-center md:justify-between">
          <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">
            {examTitle}
          </span>
          <span className="w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
            {isFrench ? "Recherche rapide par numéro" : "بحث سريع برقم المترشح"}
          </span>
        </div>

        <div className="relative min-w-0 flex-1">
          <label className="relative block">
            <span className="mb-2 block text-sm font-bold">{isFrench ? "Numéro du candidat" : "رقم المترشح"}</span>
            <span
              className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold"
              aria-hidden="true"
            >
              <SearchIcon />
            </span>
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(sanitizeCandidateNumber(event.target.value))}
              placeholder={isFrench ? "Entrez le numéro du candidat" : "أدخل رقم المترشح"}
              inputMode="numeric"
              dir="ltr"
              type="text"
              name="candidate"
              aria-invalid={Boolean(error)}
              pattern="[0-9]*"
              enterKeyHint="search"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              maxLength={20}
              minLength={1}
              required
              aria-label={isFrench ? "Numéro du candidat" : "رقم المترشح"}
              aria-describedby={`${hintId}${error || message ? ` ${feedbackId}` : ""}`}
            />
          </label>
        </div>

        <button
          className="search-submit mobile-sticky-search tap-button"
          type="submit"
          disabled={loading}
        >
          {loading && <span className="search-spinner" aria-hidden="true" />}
          <span>{loading ? (text?.searching || "بحث...") : (text?.searchButton || "بحث")}</span>
        </button>

        <p id={hintId} className="col-span-full text-sm text-slate-600 dark:text-slate-300">{isFrench ? "Saisissez votre numéro pour rechercher le résultat du concours sélectionné." : "أدخل رقم المترشح للبحث عن نتيجته في المسابقة المختارة."}</p>
        <SearchFeedback id={feedbackId} error={error} message={message} text={text} />
      </form>
      <ForgotCandidateNumber />
    </>
  );
}
