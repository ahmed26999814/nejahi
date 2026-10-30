import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
const index = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8"));
const items = index.files;

test("a substantial number of individual PDF resources are indexed", () => {
  assert.ok(items.length >= 548);
  assert.ok(items.some(file => file.level === "7AS"));
  assert.ok(items.some(file => file.level === "5AS"));
  assert.ok(items.some(file => file.level === "4AS"));
  assert.ok(items.some(file => file.level === "6AF"));
});
test("all indexed resources point to original Google Drive files", () => {
  const ids = new Set();
  for (const file of items) {
    assert.ok(file.title?.length > 4);
    assert.match(file.id, /^[a-zA-Z0-9_-]+$/);
    assert.equal(new URL(file.link).hostname, "drive.google.com");
    assert.ok(file.link.includes("/file/d/"));
    assert.ok(file.source);
    assert.ok(file.subject);
    assert.ok(file.kind);
    assert.ok(file.level);
    assert.ok(!ids.has(file.id), "duplicate file ID");
    ids.add(file.id);
  }
});
test("do not publish student result or candidate-list PDFs from shared folders", () => {
  for (const file of items) {
    assert.doesNotMatch(file.title.toLowerCase(), /resultats|résultats|pvresult|candidates|candidat|النتائج|نتائج|مترشح/);
  }
});
test("do not advertise external PDF files as 2027 editions without checking", () => {
  assert.equal(index.generatedAt, "2026-10-30");
  assert.ok(index.notice.includes("not verified"));
});

test("each educational file carries a document format and an honest year classification", () => {
  const allowed = new Set(["single", "academic", "range", "unspecified"]);
  for (const file of items) {
    assert.ok(["PDF", "DOC", "DOCX", "MP4"].includes(file.fileType));
    assert.ok(allowed.has(file.yearKind));
    if (file.yearKind === "unspecified") {
      assert.equal(file.year, null);
      assert.equal(file.yearLabel, null);
    } else {
      assert.ok(Number.isInteger(file.year));
      assert.ok(file.year >= 1990 && file.year <= 2028);
      assert.ok(file.title.includes(String(file.year)) || file.yearKind !== "single");
      assert.ok(file.yearLabel);
    }
    if (file.yearKind === "academic") {
      const years = file.yearLabel.split("–").map(Number);
      assert.equal(years.length, 2);
      assert.equal(years[1], years[0] + 1);
    }
  }
});
test("year ranges are separate from a particular exam year", () => {
  const subjectArchive = items.find(f => f.title.includes("BAC SN 7C SUJETS"));
  assert.equal(subjectArchive?.yearKind, "range");
  assert.equal(subjectArchive?.yearLabel, "2010–2024");
  const academicSeries = items.find(f => f.title.includes("probabilité 7D"));
  assert.equal(academicSeries?.yearKind, "academic");
  assert.equal(academicSeries?.yearLabel, "2025–2026");
});
test("the index includes books, exercises, corrected exams and multiple school levels", () => {
  for (const kind of ["كتب", "مواضيع امتحانات", "حل وتصحيح", "تمارين"]) {
    assert.ok(items.some(file => file.kind === kind), `Missing category ${kind}`);
  }
  assert.ok(items.some(file => file.fileType === "DOC"));
  assert.ok(items.some(file => file.fileType === "DOCX"));
});
