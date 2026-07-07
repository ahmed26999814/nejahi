import { readFileSync } from "node:fs";

const source = readFileSync("app/page.jsx", "utf8");
const checks = [
  ["PremiumHeader", 'import Header from "../components/layout/PremiumHeader";'],
  ["ResultOfficialSummary", "<ResultOfficialSummary"],
  ["ResultDetailsGrid", "<ResultDetailsGrid"],
  ["ResultShareActions primary", "actions={primaryActions}"],
  ["ResultShareActions social", "actions={socialActions}"],
  ["Rich footer navigation", "onNavigate={openView} text={text}"],
];

console.log("MauriResults design stage check");
for (const [name, pattern] of checks) {
  console.log(`${source.includes(pattern) ? "OK" : "MISSING"} - ${name}`);
}
