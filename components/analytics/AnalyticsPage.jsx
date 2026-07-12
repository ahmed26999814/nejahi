"use client";

import { useMemo, useState } from "react";
import { BarChartCard, PieChartCard } from "../dashboard/DashboardDesignKit";

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
    const metricDifference = getRowMetric(b, isConcours) - getRowMetric(a, isConcours);
    if (metricDifference) return metricDifference;
    return safeNumber(b.total) - safeNumber(a.total);
  });
}

function buildRows(rows, stats, text) {
  return (rows || []).slice(0, 6).map((row) => {
    const rowAverage = safeNumber(row.average);
    const rowPassRate = safeNumber(row.passRate);
    const rowTotal = safeNumber(row.total);
    return {
      id: row.id || row.label,
      label: row.label || text.unavailable,
      value: stats?.isConcours ? rowAverage.toFixed(2) : rowPassRate.toFixed(1) + "%",
      percent: stats?.isConcours
        ? Math.min(100, Math.max(0, (rowAverage / 200) * 100))
        : rowPassRate,
      hint: rowTotal ? `${rowTotal.toLocaleString("ar-MR")} مشارك` : undefined,
      raw: row,
    };
  });
}

function MetricButton({ label, value, icon, onClick, featured = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[108px] overflow-hidden rounded-[20px] border p-3.5 text-start shadow-soft transition-[transform,box-shadow,border-color] duration-150 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20 md:min-h-[126px] md:rounded-[24px] md:p-4 ${featured
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-emerald-950 text-white shadow-[0_16px_35px_rgba(5,80,45,.22)]"
        : "border-slate-200/90 bg-white text-slate-950 hover:border-emerald-400/50 hover:shadow-premium dark:border-white/10 dark:bg-[#10231a] dark:text-white"
      }`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-xl text-base md:h-9 md:w-9 md:text-lg ${featured ? "bg-white/15" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300"}`}>
        {icon}
      </span>
      <strong className="mt-2.5 block text-xl font-black tabular-nums md:mt-3 md:text-2xl">{value}</strong>
      <span className={`mt-1 block text-[11px] font-black md:text-xs ${featured ? "text-emerald-100" : "text-slate-500 dark:text-slate-300"}`}>{label}</span>
      <span className={`absolute bottom-3 left-3 text-sm transition-transform group-hover:-translate-x-1 ${featured ? "text-white/70" : "text-emerald-600"}`}>←</span>
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
            className={`min-h-12 rounded-2xl border px-3 py-2 text-xs font-black transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20 ${active
              ? "border-emerald-500 bg-emerald-600 text-white shadow-[0_10px_22px_rgba(5,150,90,.22)]"
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

function RankingButtons({ rows, isConcours, onSelect, canOpen }) {
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => {
        const rate = safeNumber(row.passRate);
        const average = safeNumber(row.average);
        return (
          <button
            key={row.id || row.label || index}
            type="button"
            disabled={!canOpen}
            onClick={() => onSelect(row)}
            className="grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-slate-200/90 bg-white p-3 text-start shadow-sm transition active:scale-[.99] disabled:cursor-default dark:border-white/10 dark:bg-white/[.04] enabled:hover:border-emerald-400/50 enabled:hover:bg-emerald-50/40 enabled:focus-visible:outline-none enabled:focus-visible:ring-4 enabled:focus-visible:ring-emerald-400/15 dark:enabled:hover:bg-emerald-300/[.05]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-emerald-600 text-sm font-black text-white">
              {index + 1}
            </span>
            <span className="min-w-0">
              <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{row.label}</strong>
              <small className="mt-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {safeNumber(row.total).toLocaleString("ar-MR")} مشارك
                {canOpen ? " · اضغط لعرض أول 10" : ""}
              </small>
            </span>
            <span className="text-left">
              <strong className="block text-base font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                {isConcours ? average.toFixed(2) : `${rate.toFixed(1)}%`}
              </strong>
              <small className="text-[9px] font-black text-slate-400">
                {isConcours ? "المتوسط" : "نسبة النجاح"}
              </small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TopCandidatesSheet({ state, onClose }) {
  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onClick={onClose}>
      <section
        dir="rtl"
        className="max-h-[82vh] w-full overflow-hidden rounded-t-[28px] border border-white/10 bg-[#071a11] text-white shadow-2xl sm:max-w-xl sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-emerald-300">أول 10 ناجحين حسب المعدل</span>
            <h2 className="mt-1 line-clamp-1 text-lg font-black">{state.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl active:scale-95">×</button>
        </header>

        <div className="max-h-[66vh] overflow-y-auto p-3">
          {state.loading ? (
            <div className="grid min-h-40 place-items-center text-sm font-black text-emerald-200">جاري تحميل الأوائل...</div>
          ) : state.error ? (
            <div className="rounded-2xl bg-red-400/10 p-4 text-sm font-bold text-red-200">{state.error}</div>
          ) : state.candidates.length ? (
            <div className="grid gap-2">
              {state.candidates.map((candidate, index) => (
                <article key={`${candidate.candidate_number}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-white/10 bg-white/[.05] p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-emerald-500/15 text-sm font-black text-emerald-300">{index + 1}</span>
                  <span className="min-w-0">
                    <strong className="line-clamp-1 block text-sm font-black">{candidate.candidate_name}</strong>
                    <small className="mt-1 block text-[11px] font-bold text-white/50">{candidate.candidate_number}</small>
                  </span>
                  <strong className="text-base font-black tabular-nums text-emerald-300">{safeNumber(candidate.candidate_score).toFixed(2)}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center text-sm font-black text-white/60">لا توجد بيانات ناجحين لهذه المجموعة.</div>
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
  const [topCandidates, setTopCandidates] = useState({
    open: false,
    loading: false,
    label: "",
    candidates: [],
    error: "",
  });

  const cleanedExamCards = useMemo(() => cleanExamCards(examCards), [examCards]);
  const sortedRows = useMemo(() => sortAnalyticsRows(rows, stats.isConcours), [rows, stats.isConcours]);
  const safeTotal = safeNumber(stats.total);
  const safePassed = safeNumber(stats.passed);
  const safeAverage = safeNumber(stats.average);
  const safeHighest = safeNumber(stats.highest || stats.highestAverage || stats.max || stats.highestScore);
  const successPercent = stats.isConcours
    ? Math.min(100, Math.max(0, (safeAverage / 200) * 100))
    : safeTotal
      ? Math.min(100, Math.max(0, (safePassed / safeTotal) * 100))
      : 0;

  const analyticsDashboardRows = buildRows(sortedRows, stats, text);
  const chartIcon = ChartIcon ? <ChartIcon /> : null;
  const examTitle = cleanExamTitle(selectedExam, lang);
  const filterKey = getFilterKey(analyticsMode);
  const canOpenTopCandidates = Boolean(filterKey && getSourceKey(selectedExam));

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
    <section className="app-shell grid gap-4 py-3 md:gap-6 md:py-8">
      {PageHero && <PageHero eyebrow={text.analytics} title="الإحصائيات" icon={chartIcon} />}
      {ExamSelector && <ExamSelector examCards={cleanedExamCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />}

      {selectedExam ? (
        <>
          <header className="relative overflow-hidden rounded-[24px] border border-emerald-400/20 bg-gradient-to-l from-[#052f20] via-[#075b3b] to-[#0b7a4d] p-4 text-white shadow-[0_18px_45px_rgba(2,60,38,.22)] md:rounded-[28px] md:p-5">
            <span className="absolute -left-12 -top-16 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-emerald-200 md:text-[11px]">المسابقة المختارة</span>
                <h1 className="mt-1 text-xl font-black leading-tight md:text-2xl">{examTitle}</h1>
                <p className="mt-2 text-[11px] font-bold text-white/65 md:text-xs">مرتبة حسب أعلى نسبة نجاح.</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl md:h-14 md:w-14 md:text-2xl">📊</span>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-2.5" aria-label="ملخص الإحصائيات">
            <MetricButton label={stats.isConcours ? text.participants : "المترشحون"} value={formatNumber(safeTotal)} icon="👥" onClick={scrollToDetails} />
            <MetricButton label={stats.isConcours ? text.averageScore : text.passedCount} value={stats.isConcours ? formatNumber(safeAverage, 2) : formatNumber(safePassed)} icon="✓" featured onClick={scrollToDetails} />
            <MetricButton label={stats.isConcours ? text.highestScore : text.highestAverage} value={formatNumber(safeHighest, 2)} icon="🏆" onClick={scrollToDetails} />
            <MetricButton label={stats.isConcours ? "مؤشر المتوسط" : "نسبة النجاح"} value={`${successPercent.toFixed(1)}%`} icon="↗" onClick={scrollToDetails} />
          </section>

          <ModeButtons modes={analyticsOptions} selectedMode={analyticsMode} onSelect={onSelectAnalyticsMode} />

          <section className="grid gap-3 lg:grid-cols-[.72fr_1.28fr]">
            <PieChartCard title={stats.isConcours ? text.averageScore : "نسبة النجاح"} value={successPercent} label={stats.isConcours ? text.averageScore : "نسبة النجاح"} onClick={scrollToDetails} actionLabel="فتح" />
            <BarChartCard title={tableTitle} rows={analyticsDashboardRows} onClick={scrollToDetails} onRowClick={(row) => openTopCandidates(row.raw)} actionLabel="كل البيانات" />
          </section>

          <section id="analytics-details" className="scroll-mt-24 grid gap-3 rounded-[24px] border border-slate-200/90 bg-slate-50/70 p-3 shadow-soft dark:border-white/10 dark:bg-[#0b1b12] md:rounded-[28px] md:p-5">
            <header className="flex items-center justify-between gap-3 px-1 py-1">
              <div>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">{examTitle}</span>
                <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">{tableTitle}</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">{sortedRows.length.toLocaleString("ar-MR")}</span>
            </header>

            <RankingButtons rows={sortedRows} isConcours={stats.isConcours} onSelect={openTopCandidates} canOpen={canOpenTopCandidates} />

            {StatsTable && (
              <details className="rounded-[18px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.04]">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-emerald-700 dark:text-emerald-300">عرض الجدول التفصيلي</summary>
                <div className="border-t border-slate-200 p-2 dark:border-white/10">
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
