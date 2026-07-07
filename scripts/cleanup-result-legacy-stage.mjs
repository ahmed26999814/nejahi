import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;

const required = [
  "<ResultOfficialSummary",
  "<ResultDetailsGrid",
  "actions={primaryActions}",
  "actions={socialActions}",
];

const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.log("Cleanup skipped. Run result polish bundle first. Missing:");
  missing.forEach((item) => console.log(`- ${item}`));
  process.exit(0);
}

function removeBetween(startText, endText, label) {
  const start = source.indexOf(startText);
  const end = start >= 0 ? source.indexOf(endText, start) : -1;
  if (start < 0 || end < 0) return false;
  source = source.slice(0, start) + source.slice(end);
  console.log(`Removed ${label}.`);
  return true;
}

if (!source.includes("<InfoTile ") && source.includes("function InfoTile(")) {
  removeBetween("function InfoTile(", "function MatchesList(", "legacy InfoTile");
  source = source.replace("function MatchesList(", "function MatchesList(");
}

if (!source.includes("<ActionButton ") && source.includes("function ActionButton(")) {
  removeBetween("function ActionButton(", "function ResultCard(", "legacy ActionButton");
  source = source.replace("function ResultCard(", "function ResultCard(");
}

if (!source.includes("actionButtonClass(") && source.includes("const actionButtonClass = cva(")) {
  removeBetween("const actionButtonClass = cva(", "const EXAM_CARDS = [", "legacy actionButtonClass");
  source = source.replace("const EXAM_CARDS = [", "const EXAM_CARDS = [");
}

if (!source.includes("cva(") && source.includes('import { cva } from "class-variance-authority";\n')) {
  source = source.replace('import { cva } from "class-variance-authority";\n', "");
}

if (!source.includes("<CandidateProfileCard") && source.includes("CandidateProfileCard, ")) {
  source = source.replace("CandidateProfileCard, ", "");
}

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Legacy result cleanup completed.");
} else {
  console.log("No legacy result cleanup needed.");
}
