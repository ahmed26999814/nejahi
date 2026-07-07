import { readFileSync } from "node:fs";

const source = readFileSync("app/page.jsx", "utf8");
const checks = [
  ["PremiumHomeView import", source.includes('import PremiumHomeView from "../components/home/PremiumHomeView";')],
  ["PremiumHomeView connected", source.includes("<PremiumHomeView")],
  ["Legacy Hero removed", !source.includes("function Hero(")],
];

console.log("Home legacy stage check");
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "MISSING"} - ${label}`);
}
