import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "app", "page.jsx");
let source = readFileSync(pagePath, "utf8");
const original = source;

const importLine = 'import AnalyticsPage from "../components/analytics/AnalyticsPage";';
if (!source.includes(importLine)) {
  const anchor = 'import PremiumHomeView from "../components/home/PremiumHomeView";';
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

if (!source.includes("function LegacyAnalyticsPage(")) {
  source = source.replace("function AnalyticsPage(", "function LegacyAnalyticsPage(");
}

if (source.includes("<AnalyticsPage analyticsMode={activeAnalyticsMode}") && !source.includes("components={{ PageHero")) {
  source = source.replace("analyticsOptions={analyticsOptions} lang={lang}", "analyticsOptions={analyticsOptions} components={{ PageHero, ExamSelector, StatsStrip, AnalyticsModeSelector, StatsTable, EmptyChoice, ChartIcon }} lang={lang}");
}

if (source !== original) {
  writeFileSync(pagePath, source, "utf8");
  console.log("تم استخراج AnalyticsPage وحفظ النسخة القديمة باسم LegacyAnalyticsPage.");
} else {
  console.log("AnalyticsPage مستخرجة بالفعل.");
}
