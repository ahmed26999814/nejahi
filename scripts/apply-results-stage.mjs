import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "app", "page.jsx");
let source = readFileSync(pagePath, "utf8");
const original = source;

function addImport(importLine) {
  if (source.includes(importLine)) return;

  const anchors = [
    'import { BarChartCard, DashboardMetricCard, LeaderboardCard, PieChartCard } from "../components/dashboard/DashboardDesignKit";',
    'import FloatingActionButton from "../components/ui/FloatingActionButton";',
    'import PremiumHomeView from "../components/home/PremiumHomeView";',
    'import { Toaster, toast } from "sonner";',
  ];

  const anchor = anchors.find((item) => source.includes(item));
  if (!anchor) throw new Error(`لم أجد مكانًا آمنًا لإضافة import: ${importLine}`);
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

addImport('import { CandidateProfileCard, StatusBadge } from "../components/results/ResultDesignKit";');

const oldStatus = '<span className={`official-status-stamp ${status.className}`}>{status.label}</span>';
const newStatus = '<StatusBadge status={status.className} label={status.label} />';
if (source.includes(oldStatus)) {
  source = source.replace(oldStatus, newStatus);
}

const resultCardLine = '<ResultCard onOpenRanking={onOpenRanking} resultBanner={resultBanner} student={student} onShare={onShare} text={text} verificationCode={verificationCode} />';
const profileBlock = `<CandidateProfileCard
          name={student.name}
          id={student.id}
          school={student.ms || student.centre || text.unavailable}
          status={status.className}
          statusLabel={status.label}
          score={getAverage(student).toFixed(2)}
          maxScore={isConcours ? 200 : undefined}
        />`;

if (source.includes(resultCardLine) && !source.includes("<CandidateProfileCard\n          name={student.name}")) {
  source = source.replace(resultCardLine, `${profileBlock}\n        ${resultCardLine}`);
}

if (source === original) {
  console.log("لا توجد تغييرات جديدة؛ مرحلة النتائج مطبقة بالفعل.");
} else {
  writeFileSync(pagePath, source, "utf8");
  console.log("تم ربط ResultDesignKit داخل صفحة النتيجة بدون حذف محتوى page.jsx.");
}
