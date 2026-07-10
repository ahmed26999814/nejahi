require("./prebuild-user-fixes-v11.cjs");

const fs = require("fs");

const pagePath = "app/page.jsx";
let page = fs.readFileSync(pagePath, "utf8");

// Restore the decision tile for the normal Bac card and uploaded result cards.
const bacExamLine = `      [text.exam || "المسابقة", "باكالوريا 2025", <BookIcon key="exam" />],`;
const bacDecisionLine = `      [text.decision || "القرار", status.label, <InfoIcon key="decision" />],`;
if (page.includes(bacExamLine) && !page.includes(`${bacExamLine}\n${bacDecisionLine}`)) {
  page = page.replace(bacExamLine, `${bacExamLine}\n${bacDecisionLine}`);
}

fs.writeFileSync(pagePath, page, "utf8");

const uploadPath = "app/api/admin/results-upload/route.ts";
let upload = fs.readFileSync(uploadPath, "utf8");

// Match user-entered column labels against the exact Excel column names.
// This tolerates RTL punctuation, braces, spaces, underscores and letter case.
if (!upload.includes("function resolveColumnName(")) {
  upload = upload.replace(
    `function inferColumns(rows: Record<string, unknown>[], supplied: unknown[] = []) {
  const fromPayload = supplied.map(safeColumnName).filter(Boolean);
  const fromRows = rows.flatMap((row) => Object.keys(row || {}).map(safeColumnName)).filter(Boolean);
  return Array.from(new Set([...fromPayload, ...fromRows]));
}`,
    `function inferColumns(rows: Record<string, unknown>[], supplied: unknown[] = []) {
  const fromPayload = supplied.map(safeColumnName).filter(Boolean);
  const fromRows = rows.flatMap((row) => Object.keys(row || {}).map(safeColumnName)).filter(Boolean);
  return Array.from(new Set([...fromPayload, ...fromRows]));
}

function normalizeColumnKey(value: unknown) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[{}\\[\\]()<>«»"'ـ_\\-.,:;\\s]+/g, "")
    .replace(/[^a-z0-9\\u0600-\\u06ff]/g, "");
}

function resolveColumnName(value: unknown, columns: string[]) {
  const requested = safeColumnName(value);
  if (!requested) return "";
  if (columns.includes(requested)) return requested;
  const key = normalizeColumnKey(requested);
  if (!key) return "";
  return columns.find((column) => normalizeColumnKey(column) === key) || "";
}`
  );
}

upload = upload.replace(
  `  const numberColumn = safeColumnName(payload.numberColumn);
  const nameColumn = safeColumnName(payload.nameColumn);
  const scoreColumn = safeColumnName(payload.scoreColumn);
  const wilayaColumn = safeColumnName(payload.wilayaColumn);
  const moughataaColumn = safeColumnName(payload.moughataaColumn);
  const centreColumn = safeColumnName(payload.centreColumn);`,
  `  const numberColumn = resolveColumnName(payload.numberColumn, columns);
  const nameColumn = resolveColumnName(payload.nameColumn, columns);
  const scoreColumn = resolveColumnName(payload.scoreColumn, columns);
  const wilayaColumn = resolveColumnName(payload.wilayaColumn, columns);
  const moughataaColumn = resolveColumnName(payload.moughataaColumn, columns);
  const centreColumn = resolveColumnName(payload.centreColumn, columns);`
);

fs.writeFileSync(uploadPath, upload, "utf8");
console.log("Applied MauriResults speed column matching and decision restore v12");
