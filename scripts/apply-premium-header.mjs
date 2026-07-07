import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let page = readFileSync(file, "utf8");
const oldText = 'import Header from "../components/layout/Header";';
const newText = 'import Header from "../components/layout/PremiumHeader";';

if (page.includes(oldText)) {
  page = page.replace(oldText, newText);
  writeFileSync(file, page, "utf8");
  console.log("Premium header wired.");
} else if (page.includes(newText)) {
  console.log("Premium header already wired.");
} else {
  console.log("Header import was not found. Please inspect app/page.jsx imports.");
}
