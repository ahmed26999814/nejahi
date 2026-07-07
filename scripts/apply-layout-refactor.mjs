import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "app", "page.jsx");
let source = readFileSync(pagePath, "utf8");
const original = source;

function addImport(importLine) {
  if (source.includes(importLine)) return;

  const premiumAnchor = 'import PremiumHomeView from "../components/home/PremiumHomeView";';
  const sonnerAnchor = 'import { Toaster, toast } from "sonner";';

  if (source.includes(premiumAnchor)) {
    source = source.replace(premiumAnchor, `${premiumAnchor}\n${importLine}`);
    return;
  }

  if (source.includes(sonnerAnchor)) {
    source = source.replace(sonnerAnchor, `${sonnerAnchor}\n${importLine}`);
    return;
  }

  throw new Error("لم أجد مكانًا آمنًا لإضافة imports داخل app/page.jsx");
}

function renameLegacyFunction(name) {
  const legacyName = `Legacy${name}`;
  if (source.includes(`function ${legacyName}(`)) return;
  const target = `function ${name}(`;
  if (!source.includes(target)) {
    console.warn(`لم أجد ${target} داخل app/page.jsx؛ تم التجاوز.`);
    return;
  }
  source = source.replace(target, `function ${legacyName}(`);
}

addImport('import Header from "../components/layout/Header";');
addImport('import Footer from "../components/layout/Footer";');
addImport('import BottomNav from "../components/layout/BottomNav";');

renameLegacyFunction("Header");
renameLegacyFunction("Footer");
renameLegacyFunction("BottomNav");

if (source === original) {
  console.log("لا توجد تغييرات جديدة؛ app/page.jsx منظم بالفعل لهذه المرحلة.");
} else {
  writeFileSync(pagePath, source, "utf8");
  console.log("تم ربط Header و Footer و BottomNav من ملفات مستقلة بدون حذف محتوى app/page.jsx.");
}
