import { BarChartCard, PieChartCard } from "../dashboard/DashboardDesignKit";

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
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
      hint: rowTotal ? rowTotal.toLocaleString("ar-MR") : undefined,
    };
  });
}

function scrollToDetails() {
  document.getElementById("analytics-details")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function AnalyticsPage(props) {
  const analyticsMode = props.analyticsMode;
  const analyticsOptions = props.analyticsOptions;
  const components = props.components || {};
  const examCards = props.examCards;
  const lang = props.lang;
  const loading = props.loading;
  const onSelectAnalyticsMode = props.onSelectAnalyticsMode;
  const onSelectExam = props.onSelectExam;
  const rows = props.rows || [];
  const selectedExam = props.selectedExam;
  const selectedExamId = props.selectedExamId;
  const stats = props.stats || {};
  const tableIcon = props.tableIcon;
  const tableTitle = props.tableTitle;
  const text = props.text;
  const PageHero = components.PageHero;
  const ExamSelector = components.ExamSelector;
  const StatsStrip = components.StatsStrip;
  const AnalyticsModeSelector = components.AnalyticsModeSelector;
  const StatsTable = components.StatsTable;
  const EmptyChoice = components.EmptyChoice;
  const ChartIcon = components.ChartIcon;

  const safeTotal = safeNumber(stats.total);
  const safePassed = safeNumber(stats.passed);
  const safeAverage = safeNumber(stats.average);
  const successPercent = stats.isConcours
    ? Math.min(100, Math.max(0, (safeAverage / 200) * 100))
    : safeTotal
      ? Math.min(100, Math.max(0, (safePassed / safeTotal) * 100))
      : 0;

  const analyticsDashboardRows = buildRows(rows, stats, text);
  const chartIcon = ChartIcon ? <ChartIcon /> : null;

  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      {PageHero && <PageHero eyebrow={text.analytics} title={text.analyticsTitle} icon={chartIcon} />}
      {ExamSelector && <ExamSelector examCards={examCards} lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />}

      {selectedExam ? (
        <>
          {StatsStrip && <StatsStrip loading={loading} stats={stats} text={text} />}

          <section className="grid gap-3 lg:grid-cols-[.8fr_1.2fr]" aria-label="ملخص الإحصائيات">
            <PieChartCard
              title={stats.isConcours ? text.averageScore : text.passedCount}
              value={successPercent}
              label={stats.isConcours ? text.averageScore : text.passedCount}
              onClick={scrollToDetails}
              actionLabel="التفاصيل"
            />
            <BarChartCard
              title={tableTitle}
              rows={analyticsDashboardRows}
              onClick={scrollToDetails}
              onRowClick={scrollToDetails}
              actionLabel="عرض الكل"
            />
          </section>

          <section
            id="analytics-details"
            className="scroll-mt-24 grid gap-3 rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-[#10231a] md:rounded-[30px] md:p-5"
          >
            <header className="flex items-center justify-between gap-3 px-1">
              <div>
                <span className="text-[10px] font-black text-mauri-green dark:text-mauri-gold">تفاصيل النتائج</span>
                <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white md:text-lg">{tableTitle}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">
                {rows.length.toLocaleString("ar-MR")} صف
              </span>
            </header>

            {AnalyticsModeSelector && (
              <AnalyticsModeSelector
                modes={analyticsOptions}
                selectedMode={analyticsMode}
                onSelect={onSelectAnalyticsMode}
              />
            )}
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
