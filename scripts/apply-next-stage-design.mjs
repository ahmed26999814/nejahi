import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "app", "page.jsx");
let source = readFileSync(pagePath, "utf8");
const original = source;

function addImport(importLine) {
  if (source.includes(importLine)) return;

  const anchors = [
    'import BottomNav from "../components/layout/BottomNav";',
    'import PremiumHomeView from "../components/home/PremiumHomeView";',
    'import { Toaster, toast } from "sonner";',
  ];

  const anchor = anchors.find((item) => source.includes(item));
  if (!anchor) throw new Error(`لم أجد مكانًا آمنًا لإضافة: ${importLine}`);
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

function renameLegacyFunction(name) {
  const legacyName = `Legacy${name}`;
  if (source.includes(`function ${legacyName}(`)) return;

  const target = `function ${name}(`;
  if (!source.includes(target)) return;
  source = source.replace(target, `function ${legacyName}(`);
}

addImport('import Header from "../components/layout/Header";');
addImport('import Footer from "../components/layout/Footer";');
addImport('import BottomNav from "../components/layout/BottomNav";');
addImport('import FloatingActionButton from "../components/ui/FloatingActionButton";');

renameLegacyFunction("Header");
renameLegacyFunction("Footer");
renameLegacyFunction("BottomNav");

const bottomNavLine = '<BottomNav activeView={activeView} onNavigate={openView} text={text} />';
const floatingLine = '<FloatingActionButton onNavigate={openView} text={text} />';

if (source.includes(bottomNavLine) && !source.includes(floatingLine)) {
  source = source.replace(bottomNavLine, `${floatingLine}\n      ${bottomNavLine}`);
}

if (source === original) {
  console.log("لا توجد تغييرات جديدة؛ مرحلة التصميم التالية مطبقة بالفعل أو لا تحتاج تعديلاً.");
} else {
  writeFileSync(pagePath, source, "utf8");
  console.log("تم ربط Header/Footer/BottomNav/FloatingActionButton من الملفات المستقلة بدون حذف محتوى page.jsx.");
}
