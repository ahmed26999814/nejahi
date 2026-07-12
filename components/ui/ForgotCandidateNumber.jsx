"use client";

import { createPortal } from "react-dom";
import { submitCandidateNumber } from "../search/candidate-filters/api";
import {
  FILTER_LABELS,
  formatCandidateScore,
  getDecisionLabel,
  isBrevetSource,
  totalOptions,
} from "../search/candidate-filters/config";
import { useCandidateFilters } from "../search/candidate-filters/useCandidateFilters";

function FilterSelect({ level, rows, value, loading, onChange }) {
  const placeholder = rows.length
    ? `جميع ${FILTER_LABELS[level]} (${totalOptions(rows)})`
    : `اختر ${FILTER_LABELS[level]}`;

  return (
    <select
      className="candidate-filter-select"
      aria-label={FILTER_LABELS[level]}
      value={value}
      disabled={loading === level || !rows.length}
      onChange={(event) => onChange(level, event.target.value)}
    >
      <option value="">{loading === level ? "جاري التحميل..." : placeholder}</option>
      {rows.map((item) => (
        <option key={item.value} value={item.value}>
          {item.value} ({item.total})
        </option>
      ))}
    </select>
  );
}

function CandidateRow({ candidate, index }) {
  const decision = getDecisionLabel(candidate.candidate_decision);

  return (
    <button
      type="button"
      onClick={() => submitCandidateNumber(candidate.candidate_number)}
    >
      <span className="candidate-rank">{index + 1}</span>
      <span className="candidate-main">
        <b>{candidate.candidate_name}</b>
        <small>{candidate.candidate_number}</small>
      </span>
      <span className={`candidate-decision ${decision === "دورة تكميلية" ? "is-session" : "is-success"}`}>
        {decision}
      </span>
      <strong>{formatCandidateScore(candidate.candidate_score)}</strong>
    </button>
  );
}

export default function ForgotCandidateNumber() {
  const {
    source,
    target,
    levels,
    values,
    options,
    visibleCount,
    loading,
    candidates,
    message,
    selectLevel,
  } = useCandidateFilters();

  if (!source || !target) return null;

  const visibleLevels = levels.slice(0, visibleCount);
  const content = (
    <section className="candidate-filter-box" dir="rtl">
      <div className={`candidate-filter-grid count-${visibleLevels.length}`}>
        {visibleLevels.map((level) => (
          <FilterSelect
            key={level}
            level={level}
            rows={options[level] || []}
            value={values[level]}
            loading={loading}
            onChange={selectLevel}
          />
        ))}
      </div>

      {loading === "candidates" && (
        <p className="candidate-filter-status">جاري تحميل الناجحين...</p>
      )}
      {message && (
        <p className="candidate-filter-status is-error">{message}</p>
      )}

      {candidates.length > 0 && (
        <div className="candidate-filter-results">
          <h3>
            {isBrevetSource(source)
              ? "قائمة الناجحين"
              : "الناجحون وأصحاب الدورة التكميلية"}
          </h3>
          {candidates.map((candidate, index) => (
            <CandidateRow
              key={`${candidate.candidate_number}-${candidate.candidate_name}`}
              candidate={candidate}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );

  return createPortal(content, target);
}
