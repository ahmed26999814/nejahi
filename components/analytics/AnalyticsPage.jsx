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

function cleanExamTitle(exam, lang) {
  const raw = exam?.title?.[lang] || exam?.title?.ar || exam?.title || "المسابقة";
  return String(raw)
    .replace(/^نتائج\s+/i, "")
    .replace(/^Résultats(?:\s+de|\s+du|\s+des)?\s+/i, "")
    .trim();
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
      percent: stats?.isConcours ? Math.min(100, Math.max(0, (rowAverage / 200) * 100)) : rowPassRate,
      hint: rowTotal ? `${rowTotal.toLocaleString("ar-MR")} مشارك` : undefined,
    };
  });
}

function scrollToDetails() {
  document.getElementById("analytics-details")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function MetricButton({ label, value, note, icon, onClick, featured = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[118px] overflow-hidden rounded-[22px] border p-4 text-start shadow-soft transition-[transform,box-shadow,border-color] duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20 ${featured
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-700 to-emerald-950 text-white shadow-[0_16px_35px_rgba(5,80,45,.22)]"
        : "border-slate-200/90 bg-white text-slate-950 hover:border-emerald-400/50 hover:shadow-premium dark:border-white/10 dark:bg-[#10231a] dark:text-white"
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${featured ? "bg-white/15" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300"}`}>
        {icon}
      </span>
      <strong className="mt-3 block text-2xl font-black tabular-nums">{value}</strong>
      <span className={`mt-1 block text-xs font-black ${featured ? "text-emerald-100" : "text-slate-500 dark:text-slate-300"}`}>{label}</span>
      {note && <small className={`mt-1 block text-[10px] font-bold ${featured ? "text-white/65" : "text-slate-400 dark:text-slate-500"}`}>{note}</small>}
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

export default function AnalyticsPage(props) {
  const {
    analyticsMode,
    analyticsOptions = [],
    components = {},
    examCards,
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
  const safeTotal = safeNumber(stats.total);
  const safePassed = safeNumber(stats.passed);
  const safeAverage = safeNumber(stats.average);
  const safeHighest = safeNumber(stats.highest || stats.highestAverage || stats.max || stats.highestScore);
  const successPercent = stats.isConcours
    ? Math.min(100, Math.max(0, (safeAverage / 200) * 100))
    : safeTotal
      ? Math.min(100, Math.max(0, (safePassed / safeTotal) * 100))
      : 0;

  const analyticsDashboardRows = buildRows(rows, stats, text);
  const chartIcon = ChartIcon ? <ChartIcon /> : null;
  const examTitle = cleanExamTitle(selectedExam, lang);

  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      {PageHero && <PageHero eyebrow={text.analytics} title="الإحصائيات" icon={chartIcon} />}
      {ExamSelector && <ExamSelector examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />}

      {selectedExam ? (
        <>
          <header className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-l from-[#052f20] via-[#075b3b] to-[#0b7a4d] p-5 text-white shadow-[0_18px_45px_rgba(2,60,38,.22)]">
            <span className="absolute -left-12 -top-16 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black text-emerald-200">المسابقة المختارة</span>
                <h1 className="mt-1 text-2xl font-black leading-tight">{examTitle}</h1>
                <p className="mt-2 text-xs font-bold text-white/65">اضغط على أي بطاقة لفتح التفاصيل مباشرة.</p>
              </div>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl">📊</span>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="ملخص الإحصائيات">
            <MetricButton
              label={stats.isConcours ? text.participants : "المترشحون"}
              value={formatNumber(safeTotal)}
              icon="👥"
              onClick={scrollToDetails}
            />
            <MetricButton
              label={stats.isConcours ? text.averageScore : text.passedCount}
              value={stats.isConcours ? formatNumber(safeAverage, 2) : formatNumber(safePassed)}
              icon="✓"
              featured
              onClick={scrollToDetails}
            />
            <MetricButton
              label={stats.isConcours ? text.highestScore : text.highestAverage}
              value={formatNumber(safeHighest, 2)}
              icon="🏆"
              onClick={scrollToDetails}
            />
            <MetricButton
              label={stats.isConcours ? "مؤشر المتوسط" : "نسبة النجاح"}
              value={`${successPercent.toFixed(1)}%`}
              icon="↗"
              onClick={scrollToDetails}
            />
          </section>

          <ModeButtons
            modes={analyticsOptions}
            selectedMode={analyticsMode}
            onSelect={onSelectAnalyticsMode}
          />

          <section className="grid gap-3 lg:grid-cols-[.72fr_1.28fr]">
            <PieChartCard
              title={stats.isConcours ? text.averageScore : "نسبة النجاح"}
              value={successPercent}
              label={stats.isConcours ? text.averageScore : "نسبة النجاح"}
              onClick={scrollToDetails}
              actionLabel="فتح"
            />
            <BarChartCard
              title={tableTitle}
              rows={analyticsDashboardRows}
              onClick={scrollToDetails}
              onRowClick={scrollToDetails}
              actionLabel="كل البيانات"
            />
          </section>

          <section
            id="analytics-details"
            className="scroll-mt-24 grid gap-3 rounded-[26px] border border-slate-200/90 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-[#10231a] md:p-5"
          >
            <header className="flex items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-4 py-3 dark:bg-white/[.05]">
              <div>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">{examTitle}</span>
                <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white">{tableTitle}</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
                {rows.length.toLocaleString("ar-MR")}
              </span>
            </header>

            {StatsTable && (
              <StatsTable
                icon={tableIcon}
                isConcours={stats.isConcours}
                loading={loading}
                rows={rows}
                text={text}
                title={tableTitle}
              />
            )}
          </section>
        </>
      ) : EmptyChoice ? <EmptyChoice text={text} /> : null}
    </section>
  );
}
