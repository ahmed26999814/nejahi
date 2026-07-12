"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

const ALL = "__all__";
const EMPTY = { track: "", wilaya: "", centre: "", school: "" };
const LABELS = { track: "الشعب", wilaya: "الولايات", centre: "المراكز", school: "المدارس" };

function resolveSource() {
  const id = localStorage.getItem("mauriresults-selected-exam") || "";
  if (id.startsWith("upload-")) return `upload:${id.slice(7)}`;
  return ["bac", "brevet", "bac_session"].includes(id) ? id : "";
}

function isBrevet(source) {
  return source === "brevet" || /bepc|brevet/i.test(source);
}

function findTarget() {
  const form = [...document.querySelectorAll("form.search-card")].find((item) =>
    [...item.querySelectorAll("input")].filter((input) => !input.hidden).length === 1
  );
  return form?.parentElement || null;
}

function cleanFilters(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value === ALL ? "" : value])
  );
}

async function requestApi(params) {
  const response = await fetch(`/api/forgot-number?${new URLSearchParams(params)}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function openCandidate(number) {
  const form = [...document.querySelectorAll("form.search-card")].find((item) =>
    [...item.querySelectorAll("input")].filter((input) => !input.hidden).length === 1
  );
  const input = form?.querySelector("input");
  if (!form || !input) return;

  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, number);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  form.requestSubmit();
  window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
}

function totalOf(options) {
  return options.reduce((sum, item) => sum + Number(item.total || 0), 0);
}

export default function ForgotCandidateNumber() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [options, setOptions] = useState({ track: [], wilaya: [], centre: [], school: [] });
  const [available, setAvailable] = useState({ track: true, wilaya: true, centre: true, school: true });
  const [loading, setLoading] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState("");

  const levels = useMemo(
    () => (isBrevet(source) ? ["wilaya", "centre", "school"] : ["track", "wilaya", "centre", "school"]),
    [source]
  );

  useEffect(() => {
    const refresh = () => {
      setSource(resolveSource());
      setTarget(findTarget());
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", refresh, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", refresh, true);
    };
  }, []);

  useEffect(() => {
    if (!source || source.includes("concours")) return;
    let cancelled = false;
    setValues(EMPTY);
    setCandidates([]);
    setMessage("");
    setOptions({ track: [], wilaya: [], centre: [], school: [] });
    setAvailable({ track: true, wilaya: true, centre: true, school: true });

    const firstLevel = isBrevet(source) ? "wilaya" : "track";
    setLoading(firstLevel);
    requestApi({ mode: "options", source, level: firstLevel })
      .then((data) => {
        if (cancelled) return;
        const rows = data.options || [];
        setOptions((current) => ({ ...current, [firstLevel]: rows }));
        setAvailable((current) => ({ ...current, [firstLevel]: rows.length > 0 }));
      })
      .catch(() => {
        if (!cancelled) setAvailable((current) => ({ ...current, [firstLevel]: false }));
      })
      .finally(() => {
        if (!cancelled) setLoading("");
      });

    return () => { cancelled = true; };
  }, [source]);

  if (!source || source.includes("concours") || !target) return null;

  async function loadLevel(level, nextValues) {
    setLoading(level);
    try {
      const data = await requestApi({ mode: "options", source, level, ...cleanFilters(nextValues) });
      const rows = data.options || [];
      setOptions((current) => ({ ...current, [level]: rows }));
      setAvailable((current) => ({ ...current, [level]: rows.length > 0 }));
      return rows.length > 0;
    } catch {
      setAvailable((current) => ({ ...current, [level]: false }));
      return false;
    } finally {
      setLoading("");
    }
  }

  async function loadCandidates(nextValues) {
    setLoading("candidates");
    setMessage("");
    try {
      const data = await requestApi({ source, ...cleanFilters(nextValues) });
      const rows = data.candidates || [];
      setCandidates(rows);
      if (!rows.length) setMessage("لا توجد أسماء مطابقة لهذه الاختيارات.");
    } catch {
      setCandidates([]);
      setMessage("تعذر تحميل قائمة المترشحين الآن.");
    } finally {
      setLoading("");
    }
  }

  async function selectLevel(level, value) {
    const nextValues = { ...values, [level]: value };
    const index = levels.indexOf(level);

    for (const later of levels.slice(index + 1)) {
      nextValues[later] = "";
    }

    setValues(nextValues);
    setCandidates([]);
    setMessage("");
    setOptions((current) => {
      const next = { ...current };
      for (const later of levels.slice(index + 1)) next[later] = [];
      return next;
    });

    const nextLevel = levels[index + 1];
    if (!nextLevel) {
      await loadCandidates(nextValues);
      return;
    }

    const hasNext = await loadLevel(nextLevel, nextValues);
    if (!hasNext) await loadCandidates(nextValues);
  }

  const visibleLevels = levels.filter((level) => available[level]);

  const ui = (
    <section className="candidate-filter-box" dir="rtl">
      <div className="candidate-filter-grid">
        {visibleLevels.map((level, index) => {
          const rows = options[level];
          const previous = visibleLevels[index - 1];
          const disabled = index > 0 && !values[previous];
          const allLabel = `جميع ${LABELS[level]} (${totalOf(rows)})`;

          return (
            <select
              key={level}
              className="candidate-filter-select"
              aria-label={LABELS[level]}
              value={values[level]}
              disabled={disabled || loading === level}
              onChange={(event) => selectLevel(level, event.target.value)}
            >
              <option value="">{loading === level ? "جاري التحميل..." : `اختر ${LABELS[level]}`}</option>
              {rows.length > 0 && <option value={ALL}>{allLabel}</option>}
              {rows.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.total})
                </option>
              ))}
            </select>
          );
        })}
      </div>

      {loading === "candidates" && <p className="candidate-filter-status">جاري تحميل المترشحين...</p>}
      {message && <p className="candidate-filter-status is-error">{message}</p>}

      {candidates.length > 0 && (
        <div className="candidate-filter-results">
          <h3>قائمة المترشحين</h3>
          {candidates.map((candidate) => (
            <button
              type="button"
              key={`${candidate.candidate_number}-${candidate.candidate_name}`}
              onClick={() => openCandidate(candidate.candidate_number)}
            >
              <span>{candidate.candidate_name}</span>
              <strong>{candidate.candidate_number}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );

  return createPortal(ui, target);
}
