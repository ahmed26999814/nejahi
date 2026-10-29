"use client";

import { useMemo } from "react";
import { mergeYearCards, normalizeHomeYearId } from "./yearCards";

export default function YearChoiceCards({ lang = "ar", onSelectYear, yearCards }) {
  const cards = useMemo(() => mergeYearCards(yearCards), [yearCards]);
  const french = lang === "fr";
  return (
    <div className="results-year-grid" aria-label={french ? "Années des résultats" : "سنوات النتائج"}>
      {cards.map((year) => {
        const id = normalizeHomeYearId(year);
        const value = id.replace("year-", "");
        const available = year.available === true;
        const title = french ? `Concours ${value}` : `مسابقات ${value}`;
        return (
          <a key={id} className="results-year-card" href={available ? `#${id}` : undefined} aria-disabled={!available} onClick={(event) => {
            if (!available) { event.preventDefault(); return; }
            if (onSelectYear) { event.preventDefault(); onSelectYear({ ...year, id }); }
          }}>
            <div className="results-year-top"><span className="results-year-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v7"/></svg></span><span className="results-year-status">{available ? (french ? "Résultats publiés" : "نتائج منشورة") : (french ? "Indisponible" : "غير متاحة حاليًا")}</span></div>
            <strong className="results-year-value" dir="ltr">{value}</strong>
            <div className="results-year-bottom"><div><h3>{title}</h3><p>{french ? "Bac, BEPC, Concours et Excellence" : "باكالوريا، ابريفه، كونكور والامتياز"}</p></div><span className="results-year-arrow" aria-hidden="true">{french ? "↗" : "↖"}</span></div>
          </a>
        );
      })}
    </div>
  );
}
