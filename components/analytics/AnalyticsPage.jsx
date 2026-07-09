import { BarChartCard, LeaderboardCard, PieChartCard } from "../dashboard/DashboardDesignKit";

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
      label: row.label || text.unavailable,
      value: stats?.isConcours ? rowAverage.toFixed(2) : rowPassRate.toFixed(1) + "%",
      percent: stats?.isConcours ? Math.min(100, Math.max(0, (rowAverage / 200) * 100)) : rowPassRate,
      hint: rowTotal ? rowTotal.toLocaleString("ar-MR") : undefined,
    };
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
          <section className="grid gap-3 lg:grid-cols-[.75fr_1.25fr]">
            <PieChartCard title={stats.isConcours ? text.averageScore : text.passedCount} value={successPercent} label={stats.isConcours ? text.averageScore : text.passedCount} />
            <BarChartCard title={tableTitle} rows={analyticsDashboardRows} />
          </section>
          <LeaderboardCard title={tableTitle} rows={analyticsDashboardRows} />
          {AnalyticsModeSelector && <AnalyticsModeSelector modes={analyticsOptions} selectedMode={analyticsMode} onSelect={onSelectAnalyticsMode} />}
          {StatsTable && <StatsTable icon={tableIcon} isConcours={stats.isConcours} loading={loading} rows={rows} text={text} title={tableTitle} />}
        </>
      ) : EmptyChoice ? <EmptyChoice text={text} /> : null}
    </section>
  );
}
