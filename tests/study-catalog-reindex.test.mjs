import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  studyFileBranches, studyFileCategory, studyFileSubject,
  studyFileCompetition, examYearGroup, decorateStudyFile
} from "../data/study-catalog.mjs";

const fileIndex = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8")).files;
const catalog = fileIndex.map(decorateStudyFile);
const examFiles = catalog.filter(file => file.category === "exams" && file.competition);
const library = catalog.filter(file => file.category !== "exams");

test("official exam subjects and mock Bac papers appear in exams, not study references", () => {
  const samples = [
    ["BAC D MA 2024 sn corrigé.pdf", "exams"],
    ["BacD2025SN.pdf", "exams"],
    ["BacC2025SN.pdf", "exams"],
    ["BAC_2025_C.D__SN.pdf", "exams"],
    ["sujets bac français 2005-2024.pdf", "exams"],
    ["مواضيع الباكلوريا التمهيدية لمختلف الشعب 2022.pdf", "exams"],
    ["Bac Blanc 7C 2026.pdf", "exams"],
    ["7D EX1 MEDI 2526 FINI.pdf", "tests"],
    ["Devoir 2 7D.pdf", "tests"],
    ["Joussour PC 7D&C.pdf", "books"],
    ["سلسلة-السبيل-كتاب-الفلسفة.pdf", "series"],
    ["الفلسفة منهجية بكالوريا 2023.pdf", "lessons"],
  ];
  for (const [title, category] of samples) assert.equal(studyFileCategory({ title }), category, title);
  assert.ok(examFiles.length > 100, "No examination papers migrated into exam collection");
  assert.ok(library.every(file => file.category !== "exams"));
  assert.equal(catalog.length, 574, "Every indexed file remains accounted for");
});

test("C, D, LM and LO are split explicitly and unknown branches are never invented", () => {
  assert.deepEqual(studyFileBranches({ title: "Bac C MA 2025 SN.pdf" }), ["C"]);
  assert.deepEqual(studyFileBranches({ title: "Bac D SN 2025.pdf" }), ["D"]);
  assert.deepEqual(studyFileBranches({ title: "Joussour PC 7D&C.pdf" }), ["C", "D"]);
  assert.deepEqual(studyFileBranches({ title: "5CD PC.pdf" }), ["C", "D"]);
  assert.deepEqual(studyFileBranches({ title: "BAC_2025_C.D__SN.pdf" }), ["C", "D"]);
  assert.deepEqual(studyFileBranches({ title: "7AS LM philosophy.pdf" }), ["LM"]);
  assert.deepEqual(studyFileBranches({ title: "الآداب الأصلية.pdf" }), ["LO"]);
  assert.deepEqual(studyFileBranches({ title: "مواضيع الشعب الأدبية.pdf" }), ["LM", "LO"]);
  assert.deepEqual(studyFileBranches({ title: "La Géométrie dans l'espace.pdf", branch: "LA" }), ["common"]);
  assert.deepEqual(studyFileBranches({ title: "الفيزياء للسابعة.pdf" }), ["common"]);
});

test("session normale SN is not automatically classified as natural sciences", () => {
  assert.equal(studyFileSubject({ title: "Bac D SN 2025.pdf", subject: "العلوم الطبيعية" }), "مواد متنوعة");
  assert.equal(studyFileSubject({ title: "BAC_C_2024_P.C_SN.pdf", subject: "العلوم الطبيعية" }), "الفيزياء والكيمياء");
  assert.equal(studyFileSubject({ title: "Bac D MA 2024 SN.pdf", subject: "مواد متنوعة" }), "الرياضيات");
});

test("exam year ranges and school years remain separate from single exam years", () => {
  assert.equal(examYearGroup({ yearKind: "single", year: 2025 }), "2025");
  assert.equal(examYearGroup({ yearKind: "range", year: 2024, yearLabel: "2005–2024" }), "archives");
  assert.equal(examYearGroup({ yearKind: "academic", year: 2026, yearLabel: "2025–2026" }), "school:2025–2026");
  assert.equal(examYearGroup({ yearKind: "unspecified", year: null }), "undated");
});

test("exam routing retains stage and competition without misattributing levels", () => {
  for (const file of examFiles) {
    assert.ok(["باكالوريا", "ابريفه", "كونكور", "الأولمبياد"].includes(file.competition), file.title);
    assert.ok(file.branches.length >= 1);
    assert.ok(file.subject);
  }
  assert.equal(studyFileCompetition({ title: "Sujet olympiades mathématiques 7C.pdf", level: "7AS" }), "الأولمبياد");
  assert.equal(studyFileCompetition({ title: "Bac C 2025.pdf", level: "7AS" }), "باكالوريا");
});
