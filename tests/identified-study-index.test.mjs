import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  decorateStudyFile, studyDocumentKind, examBrowseGroup, examBrowseLabel
} from "../data/study-catalog.mjs";

const rows = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8")).files;
const files = rows.map(decorateStudyFile);
const byId = Object.fromEntries(files.map(f => [f.id, f]));

test("all 574 Drive documents remain indexed, including four newly listed lessons", () => {
  assert.equal(files.length, 574);
  const ids = new Set(files.map(file => file.id));
  assert.equal(ids.size, files.length);
  for (const id of [
    "1U-jTrJxfHKhN1ChATvzm2YTwiYKY44MK",
    "1-FdD_MJ7QnxQUHmmBmhEOVLhF1bXd_Lj",
    "1oWFKl_Cg0VsXdojCDViE20KKLuwh_Dq-",
    "1jeR3xJ7MMYXap0XL8r-ODI2eFtvOND4s",
  ]) {
    assert.ok(ids.has(id));
    assert.equal(byId[id].category, "lessons");
  }
});

test("actual PDF reading identifies missing Bac subjects and branches", () => {
  const scienceMath = byId["1pSSw1tzCm3qM-kxxuB65RL8Ws5vmiqbG"];
  assert.equal(scienceMath.category, "exams");
  assert.equal(scienceMath.subject, "الرياضيات");
  assert.deepEqual(scienceMath.branches, ["D", "TSGE"]);
  assert.match(scienceMath.displayTitle, /الرياضيات/);
  const mathSeries = byId["1FXKgOQwo8ZTQN82k3Lrg0dmsK3xxu0SC"];
  assert.deepEqual(mathSeries.branches, ["C", "TMGM"]);
  assert.equal(mathSeries.subject, "الرياضيات");
  assert.equal(byId["1zU7SKHMDfETR8nM-wvGOyY5gEhEmK6Tw"].subject, "الرياضيات");
});

test("actual official textbooks are shown as books, not unspecified lessons", () => {
  for (const id of [
    "1WPVaDDawEW9lRHrK0oMZlb3bL4K329kj",
    "1Dn_xIrLhIsC1QK_NEBFSdYmdVdkPAEqz",
    "1wFFuxYdsqAYAK08EEiAxOTq_hq_Tl4HZ",
    "1VOF7xNk9pTfuuc46Z9B2d8O-l5Eqwz4D",
    "1NIjHT5k6oi4rTw3XJM1Ry6QQjRJXcaCa",
    "1UVKFUxMWIjDxFZZiMESaxm1TH_VPSOL6",
    "1soM9kJ8AujQhFDRUymZVmbrvDDq1GKyX",
  ]) {
    assert.equal(byId[id].category, "books");
    assert.ok(byId[id].displayTitle.startsWith("كتاب "));
  }
});

test("exam browse labels state the document kind, not generic archive", () => {
  const items = [
    { title: "Sujets Bac Math 2005-2024.pdf", yearKind: "range", yearLabel: "2005–2024", year: 2024 },
    { title: "Sujets Bac corrigés 2010-2024.pdf", yearKind: "range", yearLabel: "2010–2024", year: 2024 },
    { title: "Bac D correction.pdf", yearKind: "unspecified", year: null },
    { title: "Bac Blanc 7D.pdf", yearKind: "unspecified", year: null },
  ];
  for (const item of items) {
    const group = examBrowseGroup(item);
    const label = examBrowseLabel(group);
    assert.ok(group.includes(":"));
    assert.ok(!label.includes("أرشيف"), label);
  }
  assert.equal(studyDocumentKind({ verifiedDocumentType: "موضوع" }), "موضوع");
  assert.equal(examBrowseLabel("school:2025–2026"), "السنة الدراسية 2025–2026");
});

test("resource and exam cards still use same-origin download and display file type", () => {
  const exams = readFileSync(new URL("../components/documents/ExamLibrary.jsx", import.meta.url), "utf8");
  const resources = readFileSync(new URL("../components/documents/IndexedStudyFiles.jsx", import.meta.url), "utf8");
  assert.ok(exams.includes("/api/study-files/download"));
  assert.ok(resources.includes("/api/study-files/download"));
  assert.ok(exams.includes("studyDocumentKind(card.file)"));
  assert.ok(resources.includes("t.types[file.category]"));
  assert.ok(resources.includes("file.displayTitle || file.title"));
  assert.ok(!exams.includes("أرشيف سنوات متعددة"));
});
