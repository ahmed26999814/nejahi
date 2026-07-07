import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let page = readFileSync(file, "utf8");
const oldText = '<Footer content={siteContent} text={text} />';
const newText = '<Footer content={siteContent} onNavigate={openView} text={text} />';

if (page.includes(oldText)) {
  page = page.replace(oldText, newText);
  writeFileSync(file, page, "utf8");
  console.log("Footer navigation wired.");
} else {
  console.log("Footer navigation already wired or footer call changed.");
}
