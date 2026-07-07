import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "app", "page.jsx");
let source = readFileSync(pagePath, "utf8");
const original = source;

function addImport(importLine) {
  if (source.includes(importLine)) return;

  const anchors = [
    'import FloatingActionButton from "../components/ui/FloatingActionButton";',
    'import PremiumHomeView from "../components/home/PremiumHomeView";',
    'import { Toaster, toast } from "sonner";',
  ];

  const anchor = anchors.find((item) => source.includes(item));
  if (!anchor) throw new Error(`لم أجد مكانًا آمنًا لإضافة import: ${importLine}`);
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

addImport('import { EmptySearchState, QuickSearchChips, SearchSkeleton } from "../components/search/SearchDesignKit";');
addImport('import { BarChartCard, DashboardMetricCard, LeaderboardCard, PieChartCard } from "../components/dashboard/DashboardDesignKit";');

if (!source.includes("const quickSearchChips = [") && source.includes("function SearchPanel(")) {
  source = source.replace(
    "  const visibleSuggestions = focused && suggestions.length > 0;\n",
    `  const visibleSuggestions = focused && suggestions.length > 0;\n  const quickSearchChips = [\n    text?.candidateNumber || "رقم المترشح",\n    text?.studentName || "اسم المترشح",\n    examTitle,\n  ].filter(Boolean);\n`
  );
}

if (!source.includes("<QuickSearchChips chips={quickSearchChips}")) {
  source = source.replace(
    `      <div className="col-span-full flex items-center justify-between gap-2 px-1">\n        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>\n        <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">{text?.open || "البحث مفتوح"}</span>\n      </div>\n      <div className="relative min-w-0 flex-1">`,
    `      <div className="col-span-full flex items-center justify-between gap-2 px-1">\n        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>\n        <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">{text?.open || "البحث مفتوح"}</span>\n      </div>\n      <div className="col-span-full">\n        <QuickSearchChips chips={quickSearchChips} onPick={() => { setQuery(""); setFocused(true); }} />\n      </div>\n      <div className="relative min-w-0 flex-1">`
  );
}

if (!source.includes("<SearchSkeleton rows={3} />")) {
  source = source.replace(
    `{loading && <ResultLoadingCard text={text} />}`,
    `{loading && (\n          <>\n            <SearchSkeleton rows={3} />\n            <ResultLoadingCard text={text} />\n          </>\n        )}`
  );
}

if (!source.includes("<EmptySearchState title={text.notFound}")) {
  source = source.replace(
    `{exam.source !== "concours" && !loading && matches.length > 0 && <MatchesList matches={matches} onSelect={onSelect} text={text} />}`,
    `{exam.source !== "concours" && !loading && matches.length > 0 && <MatchesList matches={matches} onSelect={onSelect} text={text} />}\n        {exam.source !== "concours" && !loading && query.trim().length > 2 && !matches.length && !error && !message && (\n          <EmptySearchState title={text.notFound} description={text.searchPlaceholder || "جرّب رقم المترشح أو الاسم الكامل."} />\n        )}`
  );
}

if (!source.includes("const analyticsDashboardRows = (rows || [])")) {
  source = source.replace(/function AnalyticsPage\(\{[\s\S]*?\n\}\n\nfunction AnalyticsModeSelector/, `function AnalyticsPage({ analyticsMode, analyticsOptions, lang, loading, onSelectAnalyticsMode, onSelectExam, rows, selectedExam, selectedExamId, stats, tableIcon, tableTitle, text }) {
  const safeTotal = Number(stats?.total || 0);
  const safePassed = Number(stats?.passed || 0);
  const safeHighest = Number(stats?.highest || 0);
  const safeAverage = Number(stats?.average || 0);
  const successPercent = stats?.isConcours ? Math.min(100, Math.max(0, (safeAverage / 200) * 100)) : (safeTotal ? Math.min(100, Math.max(0, (safePassed / safeTotal) * 100)) : 0);
  const analyticsCards = stats?.isConcours
    ? [
      { label: text.participants, value: safeTotal, hint: text.analytics },
      { label: text.highestScore, value: safeHighest, hint: text.highestScore },
      { label: text.averageScore, value: safeAverage, hint: text.averageScore },
    ]
    : [
      { label: text.studentCount, value: safeTotal, hint: text.analytics },
      { label: text.passedCount, value: safePassed, hint: \`${successPercent.toFixed(1)}%\` },
      { label: text.highestAverage, value: safeHighest, hint: text.highestAverage },
    ];
  const analyticsDashboardRows = (rows || []).slice(0, 6).map((row) => {
    const rowAverage = Number(row.average || 0);
    const rowPassRate = Number(row.passRate || 0);
    const rowTotal = Number(row.total || 0);
    return {
      label: row.label || text.unavailable,
      value: stats?.isConcours ? rowAverage.toFixed(2) : \`${rowPassRate.toFixed(1)}%\`,
      percent: stats?.isConcours ? Math.min(100, Math.max(0, (rowAverage / 200) * 100)) : rowPassRate,
      hint: rowTotal ? rowTotal.toLocaleString("ar-MR") : undefined,
    };
  });

  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.analytics} title={text.analyticsTitle} icon={<ChartIcon />} />
      <ExamSelector lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />
      {selectedExam ? (
        <>
          <StatsStrip loading={loading} stats={stats} text={text} />
          <section className="grid gap-3 md:grid-cols-3">
            {analyticsCards.map((card) => (
              <DashboardMetricCard label={card.label} value={card.value} hint={card.hint} key={card.label} />
            ))}
          </section>
          <section className="grid gap-3 lg:grid-cols-[.75fr_1.25fr]">
            <PieChartCard title={stats?.isConcours ? text.averageScore : text.passedCount} value={successPercent} label={stats?.isConcours ? text.averageScore : text.passedCount} />
            <BarChartCard title={tableTitle} rows={analyticsDashboardRows} />
          </section>
          <LeaderboardCard title={tableTitle} rows={analyticsDashboardRows} />
          <AnalyticsModeSelector modes={analyticsOptions} selectedMode={analyticsMode} onSelect={onSelectAnalyticsMode} />
          <StatsTable icon={tableIcon} isConcours={stats.isConcours} loading={loading} rows={rows} text={text} title={tableTitle} />
        </>
      ) : <EmptyChoice text={text} />}
    </section>
  );
}

function AnalyticsModeSelector`);
}

if (source === original) {
  console.log("لا توجد تغييرات جديدة؛ مرحلة البحث والإحصائيات مطبقة بالفعل.");
} else {
  writeFileSync(pagePath, source, "utf8");
  console.log("تم ربط SearchDesignKit و DashboardDesignKit داخل page.jsx بدون حذف المحتوى القديم.");
}
