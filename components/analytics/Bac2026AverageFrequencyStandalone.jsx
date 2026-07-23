"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INITIAL_LIMIT = 36;

function formatAverage(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

export default function Bac2026AverageFrequencyStandalone() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/bac-2026-average-frequency", {
      headers: { Accept: "application/json" },
    })
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

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().replace(",", ".");
    if (!normalized) return rows;

    return rows
      .filter((row) => formatAverage(row.average).includes(normalized))
      .sort((a, b) => {
        const parsedQuery = Number(normalized);
        const exactValue = Number.isFinite(parsedQuery) ? parsedQuery.toFixed(2) : normalized;
        const exactA = formatAverage(a.average) === exactValue ? 1 : 0;
        const exactB = formatAverage(b.average) === exactValue ? 1 : 0;
        return exactB - exactA || Number(b.average) - Number(a.average);
      });
  }, [query, rows]);

  const successfulCount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.occurrences || 0), 0),
    [rows],
  );

  useEffect(() => {
    setLimit(INITIAL_LIMIT);
  }, [query]);

  const visibleRows = filteredRows.slice(0, limit);

  return (
    <main dir="rtl" className="app-background min-h-screen px-3 pb-10 pt-4 text-mauri-ink dark:text-white md:px-5 md:py-8">
      <section className="app-shell grid gap-4 md:gap-6">
        <header className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-premium dark:border-white/10 dark:bg-white/[.05] md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-black text-[#2e7655] dark:text-emerald-300">قسم مستقل · للناجحين فقط</span>
              <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">تكرار المعدلات</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">
                ابحث عن أي معدل لمعرفة عدد مرات تكراره بين الناجحين في باكالوريا 2026.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-700 transition active:scale-[.98] dark:border-white/10 dark:bg-white/[.05] dark:text-white"
            >
              العودة للرئيسية
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 md:max-w-xl">
            <article className="rounded-[20px] bg-[#eef8f2] p-4 dark:bg-emerald-300/10">
              <span className="text-[10px] font-black text-[#2e7655] dark:text-emerald-300">المعدلات المختلفة</span>
              <strong className="mt-2 block text-2xl font-black tabular-nums text-[#176f49] dark:text-white">
                {rows.length.toLocaleString("ar-MR")}
              </strong>
            </article>
            <article className="rounded-[20px] bg-slate-50 p-4 dark:bg-white/[.05]">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">إجمالي الناجحين</span>
              <strong className="mt-2 block text-2xl font-black tabular-nums text-slate-950 dark:text-white">
                {successfulCount.toLocaleString("ar-MR")}
              </strong>
            </article>
          </div>
        </header>

        <section className="rounded-[26px] border border-slate-100 bg-white p-3 shadow-premium dark:border-white/10 dark:bg-white/[.04] md:p-5">
          <label className="grid gap-2">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200">اكتب المعدل</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              inputMode="decimal"
              placeholder="مثال: 10 أو 12.50"
              className="min-h-14 rounded-[18px] border border-slate-200 bg-white px-4 text-base font-black text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-400/10 dark:border-white/10 dark:bg-white/[.05] dark:text-white"
            />
          </label>

          <div className="mt-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span className="skeleton h-[92px] rounded-[18px]" key={index} />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[18px] bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-200">{error}</div>
            ) : visibleRows.length ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {visibleRows.map((row) => (
                    <article
                      key={formatAverage(row.average)}
                      className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-3 text-center dark:border-white/10 dark:bg-white/[.04]"
                    >
                      <span className="text-[10px] font-black text-slate-400">المعدل</span>
                      <strong className="mt-1 block text-xl font-black tabular-nums text-[#176f49] dark:text-emerald-300">
                        {formatAverage(row.average)}
                      </strong>
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
                    className="mt-4 min-h-12 w-full rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition active:scale-[.99] dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
                  >
                    عرض المزيد
                  </button>
                )}
              </>
            ) : (
              <div className="rounded-[18px] bg-slate-50 p-5 text-center text-sm font-bold text-slate-400 dark:bg-white/[.04]">لا يوجد معدل مطابق.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
