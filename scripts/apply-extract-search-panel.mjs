import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "app", "page.jsx");
let source = readFileSync(pagePath, "utf8");
const original = source;

const importLine = 'import SearchPanel from "../components/search/SearchPanel";';
if (!source.includes(importLine)) {
  const anchor = 'import PremiumHomeView from "../components/home/PremiumHomeView";';
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

if (!source.includes("function LegacySearchPanel(")) {
  source = source.replace("function SearchPanel(", "function LegacySearchPanel(");
}

if (source !== original) {
  writeFileSync(pagePath, source, "utf8");
  console.log("تم استخراج SearchPanel وحفظ النسخة القديمة باسم LegacySearchPanel.");
} else {
  console.log("SearchPanel مستخرج بالفعل.");
}
