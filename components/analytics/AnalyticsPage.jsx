"use client";

import { useMemo, useState } from "react";

const DONUT_COLORS = ["#0f8f55", "#12a96a", "#65b934", "#a7cf28", "#f2bd22", "#f4d44d"];

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value, digits = 0) {
  return safeNumber(value).toLocaleString("ar-MR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function stripResultsWord(value) {
  return String(value || "")
    .replace(/^\s*نتائج\s+/i, "")
    .replace(/^\s*Résultats(?:\s+de|\s+du|\s+des)?\s+/i, "")
    .trim();
}

function cleanExamTitle(exam, lang) {
  const raw = exam?.title?.[lang] || exam?.title?.ar || exam?.title || "المسابقة";
  return stripResultsWord(raw);
}

function cleanExamCards(cards = []) {
  return cards.map((card) => ({
    ...card,
    title: typeof card.title === "object"
      ? {
          ...card.title,
          ar: stripResultsWord(card.title.ar),
          fr: stripResultsWord(card.title.fr),
        }
      : stripResultsWord(card.title),
  }));
}

function getSourceKey(exam) {
  return exam?.source_key || exam?.sourceKey || exam?.source || "";
}

function getFilterKey(mode) {
  const value = String(mode || "").toLowerCase();
  if (/school|ecole|etablissement|مدرس/.test(value)) return "school";
  if (/region|wilaya|ولاية/.test(value)) return "wilaya";
  return "";
}

function getRowMetric(row, isConcours) {
  return isConcours ? safeNumber(row.average) : safeNumber(row.passRate);
}

function sortAnalyticsRows(rows, isConcours) {
  return [...(rows || [])].sort((a, b) => {
    const difference = getRowMetric(b, isConcours) - getRowMetric(a, isConcours);
    return difference || safeNumber(b.total) - safeNumber(a.total);
  });
}

function buildDonutGradient(rows, isConcours) {
  const values = rows.slice(0, 6).map((row) => Math.max(0, getRowMetric(row, isConcours)));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return "conic-gradient(#0f8f55 0 68%, #edf5ef 68% 100%)";

  let cursor = 0;
  const stops = values.map((value, index) => {
    const start = cursor;
    cursor += (value / total) * 100;
    return `${DONUT_COLORS[index]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });
  return `conic-gradient(${stops.join(",")})`;
}

function MetricButton({ label, value, onClick }) {
  return (
    <button type="button" className="analytics-metric-button" onClick={onClick}>
      <span className="block text-[11px] font-black text-[#2e7655] dark:text-emerald-300">{label}</span>
      <strong className="mt-3 block text-[1.7rem] font-black tabular-nums text-[#135d3c] dark:text-white md:text-3xl">{value}</strong>
      <span className="mt-2 block text-[9px] font-bold text-slate-400">اضغط للتفاصيل</span>
    </button>
  );
}

function ModeButtons({ modes = [], selectedMode, onSelect }) {
  if (!modes.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="tablist" aria-label="نوع الإحصائيات">
      {modes.map((mode) => {
        const id = mode.id || mode.value || mode.key;
        const label = mode.label?.ar || mode.label || mode.title || id;
        const active = id === selectedMode;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            className={`min-h-12 rounded-[16px] border px-3 py-2 text-xs font-black transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/15 ${active
              ? "border-[#176f49] bg-[#176f49] text-white shadow-[0_8px_20px_rgba(23,111,73,.18)]"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[.05] dark:text-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function DonutOverview({ rows, percent, isConcours, onSelect, canOpen, title }) {
  const visibleRows = rows.slice(0, 6);
  const background = buildDonutGradient(visibleRows, isConcours);

  return (
    <section className="analytics-reference-card rounded-[24px] p-4 md:p-5">
      <h2 className="text-center text-base font-black text-slate-950 dark:text-white md:text-lg">{title}</h2>
      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="analytics-donut mx-auto" style={{ background }}>
          <div className="analytics-donut-content">
            <strong className="text-2xl font-black tabular-nums text-[#135d3c] dark:text-emerald-300">{percent.toFixed(1)}%</strong>
            <span className="mt-1 text-[10px] font-black text-slate-500 dark:text-slate-400">{isConcours ? "مؤشر المتوسط" : "نسبة النجاح"}</span>
          </div>
        </div>

        <div className="grid gap-2">
          {visibleRows.map((row, index) => (
            <button
              type="button"
              disabled={!canOpen}
              onClick={() => onSelect(row)}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-1.5 py-1.5 text-start transition enabled:hover:bg-emerald-50 enabled:active:scale-[.99] dark:enabled:hover:bg-white/[.05]"
              key={row.id || row.label || index}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: DONUT_COLORS[index] }} />
              <span className="line-clamp-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">{row.label}</span>
              <strong className="text-xs font-black tabular-nums text-slate-800 dark:text-white">
                {isConcours ? safeNumber(row.average).toFixed(2) : `${safeNumber(row.passRate).toFixed(1)}%`}
              </strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function RankingButtons({ rows, isConcours, onSelect, canOpen }) {
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => (
        <button
          key={row.id || row.label || index}
          type="button"
          disabled={!canOpen}
          onClick={() => onSelect(row)}
          className="analytics-ranking-button"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef8f2] text-sm font-black text-[#176f49] dark:bg-emerald-300/10 dark:text-emerald-300">{index + 1}</span>
          <span className="min-w-0">
            <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{row.label}</strong>
            <small className="mt-1 block text-[10px] font-bold text-slate-400">
              {safeNumber(row.total).toLocaleString("ar-MR")} مشارك{canOpen ? " · عرض أول 10" : ""}
            </small>
          </span>
          <span className="text-left">
            <strong className="block text-base font-black tabular-nums text-[#176f49] dark:text-emerald-300">
              {isConcours ? safeNumber(row.average).toFixed(2) : `${safeNumber(row.passRate).toFixed(1)}%`}
            </strong>
            <small className="text-[9px] font-black text-slate-400">{isConcours ? "المتوسط" : "نسبة النجاح"}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function TopCandidatesSheet({ state, onClose }) {
  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5" onClick={onClose}>
      <section className="max-h-[82vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-[#0b1b12] sm:max-w-xl sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-white/10">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-[#176f49] dark:text-emerald-300">أول 10 ناجحين حسب المعدل</span>
            <h2 className="mt-1 line-clamp-1 text-lg font-black text-slate-950 dark:text-white">{state.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-700 active:scale-95 dark:bg-white/10 dark:text-white">×</button>
        </header>

        <div className="max-h-[66vh] overflow-y-auto p-3">
          {state.loading ? (
            <div className="grid min-h-40 place-items-center text-sm font-black text-[#176f49]">جاري تحميل الأوائل...</div>
          ) : state.error ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-200">{state.error}</div>
          ) : state.candidates.length ? (
            <div className="grid gap-2">
              {state.candidates.map((candidate, index) => (
                <article key={`${candidate.candidate_number}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[17px] border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[.04]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef8f2] text-sm font-black text-[#176f49] dark:bg-emerald-300/10 dark:text-emerald-300">{index + 1}</span>
                  <span className="min-w-0">
                    <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{candidate.candidate_name}</strong>
                    <small className="mt-1 block text-[10px] font-bold text-slate-400">{candidate.candidate_number}</small>
                  </span>
                  <strong className="text-base font-black tabular-nums text-[#176f49] dark:text-emerald-300">{safeNumber(candidate.candidate_score).toFixed(2)}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center text-sm font-black text-slate-400">لا توجد بيانات ناجحين لهذه المجموعة.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AnalyticsPage(props) {
  const {
    analyticsMode,
    analyticsOptions = [],
    components = {},
    examCards = [],
    lang,
    loading,
    onSelectAnalyticsMode,
    onSelectExam,
    rows = [],
    selectedExam,
    selectedExamId,
    stats = {},
    tableIcon,
    tableTitle,
    text,
  } = props;

  const { PageHero, ExamSelector, StatsTable, EmptyChoice, ChartIcon } = components;
  const [topCandidates, setTopCandidates] = useState({ open: false, loading: false, label: "", candidates: [], error: "" });

  const cleanedExamCards = useMemo(() => cleanExamCards(examCards), [examCards]);
  const sortedRows = useMemo(() => sortAnalyticsRows(rows, stats.isConcours), [rows, stats.isConcours]);
  const safeTotal = safeNumber(stats.total);
  const safePassed = safeNumber(stats.passed);
  const safeAverage = safeNumber(stats.average);
  const safeHighest = safeNumber(stats.highest || stats.highestAverage || stats.max || stats.highestScore);
  const successPercent = stats.isConcours
    ? Math.min(100, Math.max(0, (safeAverage / 200) * 100))
    : safeTotal ? Math.min(100, Math.max(0, (safePassed / safeTotal) * 100)) : 0;

  const examTitle = cleanExamTitle(selectedExam, lang);
  const filterKey = getFilterKey(analyticsMode);
  const canOpenTopCandidates = Boolean(filterKey && getSourceKey(selectedExam));
  const chartIcon = ChartIcon ? <ChartIcon /> : null;

  function scrollToDetails() {
    document.getElementById("analytics-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function openTopCandidates(row) {
    if (!canOpenTopCandidates) return;
    const label = String(row.label || "").trim();
    setTopCandidates({ open: true, loading: true, label, candidates: [], error: "" });

    try {
      const params = new URLSearchParams({ source: getSourceKey(selectedExam), [filterKey]: label });
      const response = await fetch(`/api/forgot-number?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل الأوائل");
      setTopCandidates({ open: true, loading: false, label, candidates: (data.candidates || []).slice(0, 10), error: "" });
    } catch {
      setTopCandidates({ open: true, loading: false, label, candidates: [], error: "تعذر تحميل أول الناجحين الآن." });
    }
  }

  return (
    <section className="analytics-reference-shell app-shell grid gap-4 py-3 md:gap-6 md:py-8">
      {PageHero && <PageHero eyebrow={text.analytics} title="إحصائيات النتائج" icon={chartIcon} />}
      {ExamSelector && <ExamSelector examCards={cleanedExamCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />}

      {selectedExam ? (
        <>
          <section className="analytics-reference-card rounded-[24px] px-4 py-3">
            <span className="text-[10px] font-black text-[#2e7655] dark:text-emerald-300">المسابقة المختارة</span>
            <h1 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{examTitle}</h1>
          </section>

          <section className="grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="ملخص الإحصائيات">
            <MetricButton label={stats.isConcours ? text.participants : "المترشحون"} value={formatNumber(safeTotal)} onClick={scrollToDetails} />
            <MetricButton label={stats.isConcours ? text.averageScore : text.passedCount} value={stats.isConcours ? formatNumber(safeAverage, 2) : formatNumber(safePassed)} onClick={scrollToDetails} />
            <MetricButton label="نسبة النجاح" value={`${successPercent.toFixed(1)}%`} onClick={scrollToDetails} />
            <MetricButton label={stats.isConcours ? text.highestScore : text.highestAverage} value={formatNumber(safeHighest, 2)} onClick={scrollToDetails} />
          </section>

          <ModeButtons modes={analyticsOptions} selectedMode={analyticsMode} onSelect={onSelectAnalyticsMode} />

          <DonutOverview
            rows={sortedRows}
            percent={successPercent}
            isConcours={stats.isConcours}
            onSelect={openTopCandidates}
            canOpen={canOpenTopCandidates}
            title={tableTitle}
          />

          <section id="analytics-details" className="analytics-reference-card scroll-mt-24 grid gap-3 rounded-[24px] p-3 md:p-5">
            <header className="flex items-center justify-between gap-3 px-1 py-1">
              <div>
                <span className="text-[10px] font-black text-[#2e7655] dark:text-emerald-300">مرتبة حسب أعلى نسبة نجاح</span>
                <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">{tableTitle}</h2>
              </div>
              <span className="rounded-full bg-[#eef8f2] px-3 py-1.5 text-[10px] font-black text-[#176f49] dark:bg-emerald-300/10 dark:text-emerald-300">{sortedRows.length.toLocaleString("ar-MR")}</span>
            </header>

            {loading ? (
              <div className="grid gap-2">{Array.from({ length: 6 }).map((_, index) => <span className="skeleton h-[68px] rounded-[18px]" key={index} />)}</div>
            ) : (
              <RankingButtons rows={sortedRows} isConcours={stats.isConcours} onSelect={openTopCandidates} canOpen={canOpenTopCandidates} />
            )}

            {StatsTable && (
              <details className="rounded-[17px] border border-slate-100 bg-slate-50/60 dark:border-white/10 dark:bg-white/[.03]">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[#176f49] dark:text-emerald-300">عرض الجدول التفصيلي</summary>
                <div className="border-t border-slate-100 p-2 dark:border-white/10">
                  <StatsTable icon={tableIcon} isConcours={stats.isConcours} loading={loading} rows={sortedRows} text={text} title={tableTitle} />
                </div>
              </details>
            )}
          </section>
        </>
      ) : EmptyChoice ? <EmptyChoice text={text} /> : null}

      <TopCandidatesSheet state={topCandidates} onClose={() => setTopCandidates((current) => ({ ...current, open: false }))} />
    </section>
  );
}
