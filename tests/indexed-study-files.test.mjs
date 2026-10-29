import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
const index = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8"));
const items = index.files;

test("a substantial number of individual PDF resources are indexed", () => {
  assert.ok(items.length >= 500);
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
  assert.equal(index.generatedAt, "2026-10-29");
  assert.ok(index.notice.includes("not verified"));
});
