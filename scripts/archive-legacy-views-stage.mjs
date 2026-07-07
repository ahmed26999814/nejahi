import fs from "node:fs";

const file = "app/page.jsx";
let text = fs.readFileSync(file, "utf8");
const startText = text;

const ready = text.includes("<SearchPanel") && text.includes("<AnalyticsPage") && text.includes('import Header from "../components/layout/PremiumHeader";');

function cut(from, to, label) {
  const a = text.indexOf(from);
  const b = a >= 0 ? text.indexOf(to, a) : -1;
  if (a < 0 || b < 0) return;
  text = text.slice(0, a) + text.slice(b);
  console.log(`archived ${label}`);
}

if (ready) {
  if (text.includes("function LegacySearchPanel(") && !text.includes("<LegacySearchPanel")) cut("function LegacySearchPanel(", "function StatsStrip(", "search view");
  if (text.includes("function LegacyAnalyticsPage(") && !text.includes("<LegacyAnalyticsPage")) cut("function LegacyAnalyticsPage(", "function AnalyticsModeSelector(", "analytics view");
  if (text.includes("function LegacyHeader(") && !text.includes("<LegacyHeader")) cut("function LegacyHeader(", "function Hero(", "header view");
} else {
  console.log("not ready");
}

if (text !== startText) {
  fs.writeFileSync(file, text, "utf8");
  console.log("legacy views archived");
} else {
  console.log("nothing changed");
}
