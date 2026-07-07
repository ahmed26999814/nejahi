import { existsSync, readFileSync } from "node:fs";

const page = readFileSync("app/page.jsx", "utf8");
const report = [];

function add(name, ok, note) {
  report.push({ name, ok, note });
}

add("Home", existsSync("components/home/PremiumHomeView.jsx") && page.includes("<PremiumHomeView"), "Premium home view is used.");
add("Search", existsSync("components/search/SearchPanel.jsx") && page.includes("<SearchPanel"), "Search panel is extracted.");
add("Analytics", existsSync("components/analytics/AnalyticsPage.jsx") && page.includes("<AnalyticsPage"), "Analytics page is extracted.");
add("Header", existsSync("components/layout/PremiumHeader.jsx") && page.includes('import Header from "../components/layout/PremiumHeader";'), "Premium header is active.");
add("Footer", page.includes("onNavigate={openView} text={text}"), "Footer links can navigate.");
add("Result page", page.includes("<ResultOfficialSummary") && page.includes("<ResultDetailsGrid") && page.includes("<ResultShareActions"), "Result card polish is connected.");
add("Legacy views", !page.includes("function Hero(") && !page.includes("function LegacySearchPanel(") && !page.includes("function LegacyAnalyticsPage(") && !page.includes("function LegacyHeader("), "Old extracted views are removed.");

console.log("Final design report");
for (const item of report) {
  console.log(`${item.ok ? "OK" : "TODO"} - ${item.name}: ${item.note}`);
}

const todos = report.filter((item) => !item.ok);
if (todos.length) {
  console.log(`\nRemaining items: ${todos.length}`);
  process.exitCode = 1;
} else {
  console.log("\nReady for final build and deploy.");
}
