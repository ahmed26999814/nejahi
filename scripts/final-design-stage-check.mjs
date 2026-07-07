import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("app/page.jsx", "utf8");
const files = [
  "components/home/PremiumHomeView.jsx",
  "components/search/SearchPanel.jsx",
  "components/analytics/AnalyticsPage.jsx",
  "components/layout/PremiumHeader.jsx",
  "components/layout/Footer.jsx",
  "components/results/OfficialResultHeader.jsx",
  "components/results/ResultOfficialSummary.jsx",
  "components/results/ResultShareActions.jsx",
  "components/results/ResultDesignKit.jsx",
];

const checks = [
  ["PremiumHomeView file", existsSync("components/home/PremiumHomeView.jsx")],
  ["PremiumHomeView connected", page.includes("<PremiumHomeView")],
  ["SearchPanel file", existsSync("components/search/SearchPanel.jsx")],
  ["SearchPanel connected", page.includes("<SearchPanel")],
  ["AnalyticsPage file", existsSync("components/analytics/AnalyticsPage.jsx")],
  ["AnalyticsPage connected", page.includes("<AnalyticsPage")],
  ["PremiumHeader file", existsSync("components/layout/PremiumHeader.jsx")],
  ["PremiumHeader connected", page.includes('import Header from "../components/layout/PremiumHeader";')],
  ["Footer navigation connected", page.includes("onNavigate={openView} text={text}")],
  ["ResultOfficialSummary file", existsSync("components/results/ResultOfficialSummary.jsx")],
  ["ResultOfficialSummary connected", page.includes("<ResultOfficialSummary")],
  ["ResultDetailsGrid connected", page.includes("<ResultDetailsGrid")],
  ["ResultShareActions connected", page.includes("<ResultShareActions")],
  ["Legacy Hero removed", !page.includes("function Hero(")],
  ["LegacySearchPanel removed", !page.includes("function LegacySearchPanel(")],
  ["LegacyAnalyticsPage removed", !page.includes("function LegacyAnalyticsPage(")],
  ["LegacyHeader removed", !page.includes("function LegacyHeader(")],
];

let failed = 0;
console.log("MauriResults final design stage check");
for (const [label, ok] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? "OK" : "MISSING"} - ${label}`);
}

console.log("\nTracked files:");
for (const file of files) console.log(`${existsSync(file) ? "OK" : "MISSING"} - ${file}`);

if (failed) {
  console.log(`\n${failed} check(s) need attention before final cleanup.`);
  process.exitCode = 1;
} else {
  console.log("\nAll final design checks passed.");
}
