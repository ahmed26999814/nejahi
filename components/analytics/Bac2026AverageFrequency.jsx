"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const INITIAL_LIMIT = 36;

function formatAverage(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function isBac2026Analytics(shell) {
  if (!shell) return false;

  const title = String(shell.querySelector("h1")?.textContent || "").trim();
  const examId = String(localStorage.getItem("mauriresults-selected-exam") || "").trim();
  const titleMatches = /2026/.test(title) && /(باكالوريا|bac)/i.test(title);
  const idMatches = /(?:bac.*2026|2026.*bac|results[_-]?bac[_-]?2026)/i.test(examId);

  return titleMatches || idMatches;
}

export default function Bac2026AverageFrequency() {
  const [target, setTarget] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  useEffect(() => {
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const shell = document.querySelector(".analytics-reference-shell");
        setTarget(isBac2026Analytics(shell) ? shell : null);
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    if (!target || rows.length || loading) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/bac-2026-average-frequency", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر تحميل البيانات");
        return data;
      })
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch(() => {
        if (!cancelled) setError("تعذر تحميل تكرار المعدلات الآن.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [target, rows.length, loading]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().replace(",", ".");
    if (!normalized) return rows;

    return rows
      .filter((row) => formatAverage(row.average).includes(normalized))
      .sort((a, b) => {
        const exactA = formatAverage(a.average) === Number(normalized).toFixed(2) ? 1 : 0;
        const exactB = formatAverage(b.average) === Number(normalized).toFixed(2) ? 1 : 0;
        return exactB - exactA || Number(b.average) - Number(a.average);
      });
  }, [query, rows]);

  useEffect(() => {
    setLimit(INITIAL_LIMIT);
  }, [query]);

  if (!target) return null;

  const visibleRows = filteredRows.slice(0, limit);

  return createPortal(
    <section className="analytics-reference-card grid gap-4 rounded-[24px] p-3 md:p-5" aria-labelledby="bac-2026-average-frequency-title">
      <header className="flex flex-wrap items-start justify-between gap-3 px-1">
        <div>
          <span className="text-[10px] font-black text-[#2e7655] dark:text-emerald-300">للناجحين فقط</span>
          <h2 id="bac-2026-average-frequency-title" className="mt-1 text-base font-black text-slate-950 dark:text-white md:text-lg">عدد تكرار المعدلات</h2>
          <p className="mt-1 text-[11px] font-bold text-slate-400">خاص بباكالوريا 2026 — مثال: كم مرة تكرر المعدل 10.00.</p>
        </div>
        <span className="rounded-full bg-[#eef8f2] px-3 py-1.5 text-[10px] font-black text-[#176f49] dark:bg-emerald-300/10 dark:text-emerald-300">
          {rows.length.toLocaleString("ar-MR")} معدل
        </span>
      </header>

      <label className="grid gap-1.5">
        <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">البحث عن معدل</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          inputMode="decimal"
          placeholder="مثال: 10 أو 10.00"
          className="min-h-12 rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
        />
      </label>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => <span className="skeleton h-[88px] rounded-[18px]" key={index} />)}
        </div>
      ) : error ? (
        <div className="rounded-[18px] bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-200">{error}</div>
      ) : visibleRows.length ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {visibleRows.map((row) => (
              <article key={formatAverage(row.average)} className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-white/10 dark:bg-white/[.04]">
                <span className="text-[10px] font-black text-slate-400">المعدل</span>
                <strong className="mt-1 block text-xl font-black tabular-nums text-[#176f49] dark:text-emerald-300">{formatAverage(row.average)}</strong>
                <span className="mt-2 block text-[11px] font-bold text-slate-500 dark:text-slate-300">
                  تكرر <b className="font-black text-slate-950 dark:text-white">{Number(row.occurrences || 0).toLocaleString("ar-MR")}</b> مرة
                </span>
              </article>
            ))}
          </div>

          {visibleRows.length < filteredRows.length && (
            <button
              type="button"
              onClick={() => setLimit((current) => current + INITIAL_LIMIT)}
              className="min-h-11 rounded-[15px] border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-800 transition active:scale-[.99] dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
            >
              عرض المزيد
            </button>
          )}
        </>
      ) : (
        <div className="rounded-[18px] bg-slate-50 p-4 text-center text-sm font-bold text-slate-400 dark:bg-white/[.04]">لا يوجد معدل مطابق.</div>
      )}
    </section>,
    target,
  );
}
