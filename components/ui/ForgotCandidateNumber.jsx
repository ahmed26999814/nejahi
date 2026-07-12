"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

const EMPTY = { track: "", wilaya: "", centre: "", school: "" };
const EMPTY_OPTIONS = { track: [], wilaya: [], centre: [], school: [] };
const LABELS = { track: "الشعب", wilaya: "الولايات", centre: "المراكز", school: "المدارس" };

function sourceFromValue(value) {
  const id = String(value || "").replace(/^#/, "").trim().toLowerCase();
  if (!id) return "";
  if (id.startsWith("upload-")) return `upload:${id.slice(7)}`;
  if (id.startsWith("upload:")) return id;
  if (/concours|c1as|كونكور/.test(id)) return "";
  if (/bac.*(?:session|sc|supp|compl)|(?:session|sc|supp|compl).*bac|تكمي/.test(id)) return "bac_session";
  if (/brevet|bepc|ابريف|أبريف|بريف/.test(id)) return "brevet";
  if (/(^|[-_])bac($|[-_0-9])|baccalaur/.test(id)) return "bac";
  return "";
}

function resolveSource() {
  const stored = localStorage.getItem("mauriresults-selected-exam") || "";
  const fromStored = sourceFromValue(stored);
  if (fromStored) return fromStored;
  const fromHash = sourceFromValue(window.location.hash);
  if (fromHash) return fromHash;
  const pageText = document.body?.textContent || "";
  if (/الدورة التكميلية|session complémentaire/i.test(pageText)) return "bac_session";
  if (/نتائج أبريفه|نتائج ابريفه|BEPC|Brevet/i.test(pageText)) return "brevet";
  if (/نتائج باكالوريا|نتائج البكالوريا|Baccalauréat|Bac 20/i.test(pageText)) return "bac";
  return "";
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

async function requestApi(params) {
  const response = await fetch(`/api/forgot-number?${new URLSearchParams(params)}`, { cache: "force-cache" });
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

function decisionLabel(value) {
  const text = String(value || "");
  return /sessionnaire|تكميلية|تكميلي/i.test(text) ? "دورة تكميلية" : "ناجح";
}

function formatScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score.toFixed(2) : "—";
}

export default function ForgotCandidateNumber() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [visibleCount, setVisibleCount] = useState(1);
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
    window.addEventListener("hashchange", refresh);
    window.addEventListener("popstate", refresh);
    document.addEventListener("click", refresh, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", refresh);
      window.removeEventListener("popstate", refresh);
      document.removeEventListener("click", refresh, true);
    };
  }, []);

  useEffect(() => {
    if (!source || source.includes("concours")) return;
    let cancelled = false;
    const firstLevel = levels[0];
    setValues(EMPTY);
    setOptions(EMPTY_OPTIONS);
    setVisibleCount(1);
    setCandidates([]);
    setMessage("");
    setLoading(firstLevel);
    requestApi({ mode: "options", source, level: firstLevel })
      .then((data) => {
        if (!cancelled) setOptions((current) => ({ ...current, [firstLevel]: data.options || [] }));
      })
      .catch(() => {
        if (!cancelled) setMessage("تعذر تحميل خيارات البحث.");
      })
      .finally(() => {
        if (!cancelled) setLoading("");
      });
    return () => { cancelled = true; };
  }, [source, levels]);

  if (!source || source.includes("concours") || !target) return null;

  async function loadCandidates(nextValues) {
    setLoading("candidates");
    setMessage("");
    try {
      const data = await requestApi({ source, ...nextValues });
      const rows = data.candidates || [];
      setCandidates(rows);
      if (!rows.length) setMessage("لا توجد نتائج ناجحة مطابقة لهذه الاختيارات.");
    } catch {
      setCandidates([]);
      setMessage("تعذر تحميل قائمة الناجحين الآن.");
    } finally {
      setLoading("");
    }
  }

  async function selectLevel(level, value) {
    const index = levels.indexOf(level);
    const nextValues = { ...values, [level]: value };
    for (const later of levels.slice(index + 1)) nextValues[later] = "";
    setValues(nextValues);
    setCandidates([]);
    setMessage("");
    setOptions((current) => {
      const next = { ...current };
      for (const later of levels.slice(index + 1)) next[later] = [];
      return next;
    });
    if (!value) {
      setVisibleCount(index + 1);
      return;
    }
    const nextLevel = levels[index + 1];
    if (!nextLevel) {
      setVisibleCount(levels.length);
      await loadCandidates(nextValues);
      return;
    }
    setLoading(nextLevel);
    try {
      const data = await requestApi({ mode: "options", source, level: nextLevel, ...nextValues });
      const rows = data.options || [];
      if (!rows.length) {
        setVisibleCount(index + 1);
        await loadCandidates(nextValues);
        return;
      }
      setOptions((current) => ({ ...current, [nextLevel]: rows }));
      setVisibleCount(index + 2);
    } catch {
      setMessage("تعذر تحميل الخيارات التالية.");
      setVisibleCount(index + 1);
    } finally {
      setLoading("");
    }
  }

  const visibleLevels = levels.slice(0, visibleCount);
  const ui = (
    <section className="candidate-filter-box" dir="rtl">
      <div className={`candidate-filter-grid count-${visibleLevels.length}`}>
        {visibleLevels.map((level) => {
          const rows = options[level] || [];
          const placeholder = rows.length ? `جميع ${LABELS[level]} (${totalOf(rows)})` : `اختر ${LABELS[level]}`;
          return (
            <select
              key={level}
              className="candidate-filter-select"
              aria-label={LABELS[level]}
              value={values[level]}
              disabled={loading === level || !rows.length}
              onChange={(event) => selectLevel(level, event.target.value)}
            >
              <option value="">{loading === level ? "جاري التحميل..." : placeholder}</option>
              {rows.map((item) => <option key={item.value} value={item.value}>{item.value} ({item.total})</option>)}
            </select>
          );
        })}
      </div>

      {loading === "candidates" && <p className="candidate-filter-status">جاري تحميل الناجحين...</p>}
      {message && <p className="candidate-filter-status is-error">{message}</p>}

      {candidates.length > 0 && (
        <div className="candidate-filter-results">
          <h3>{isBrevet(source) ? "قائمة الناجحين" : "الناجحون وأصحاب الدورة التكميلية"}</h3>
          {candidates.map((candidate, index) => (
            <button
              type="button"
              key={`${candidate.candidate_number}-${candidate.candidate_name}`}
              onClick={() => openCandidate(candidate.candidate_number)}
            >
              <span className="candidate-rank">{index + 1}</span>
              <span className="candidate-main">
                <b>{candidate.candidate_name}</b>
                <small>{candidate.candidate_number}</small>
              </span>
              <span className={`candidate-decision ${decisionLabel(candidate.candidate_decision) === "دورة تكميلية" ? "is-session" : "is-success"}`}>
                {decisionLabel(candidate.candidate_decision)}
              </span>
              <strong>{formatScore(candidate.candidate_score)}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );

  return createPortal(ui, target);
}
