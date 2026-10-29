import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { classifyStudyFile, driveDownloadUrl, STUDY_TYPES, normalizeStudyTitle } from "../data/study-file-type.mjs";

const files = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8")).files;

test("study library separates series, examinations, classroom tests, books and lessons", () => {
  assert.deepEqual(STUDY_TYPES, ["series", "exams", "tests", "books", "lessons"]);
  const samples = [
    ["Série de chimie organique 7D.pdf", "series"],
    ["QCM Chimie.pdf", "series"],
    ["تمارين الرياضيات 7C.pdf", "series"],
    ["Bac C Maths 2025 SN.pdf", "exams"],
    ["Sujets Bac 2022-2025 Corrigés.pdf", "exams"],
    ["BEPC PC 2024.pdf", "exams"],
    ["Bac Blanc 7D 2026.pdf", "tests"],
    ["Devoir 2 4AS.pdf", "tests"],
    ["Composition 7D.pdf", "tests"],
    ["Livre MAT 5AS.pdf", "books"],
    ["كتاب الرياضيات للسابعة.pdf", "books"],
    ["Joussour PC 7D.pdf", "books"],
    ["Résumé sur la cinétique chimie.pdf", "lessons"],
    ["مذكرة البناني.pdf", "lessons"],
  ];
  for (const [name, expected] of samples) {
    assert.equal(classifyStudyFile(name), expected, name);
  }
});

test("all indexed documents have a recognized single group", () => {
  for (const file of files) {
    assert.ok(STUDY_TYPES.includes(classifyStudyFile(file.title)));
  }
  const present = new Set(files.map(file => classifyStudyFile(file.title)));
  for (const group of STUDY_TYPES) assert.ok(present.has(group), group);
});

test("download URL is a Drive download endpoint with only a validated file ID", () => {
  for (const file of files) {
    const url = new URL(driveDownloadUrl(file.id));
    assert.equal(url.origin, "https://drive.google.com");
    assert.equal(url.pathname, "/uc");
    assert.equal(url.searchParams.get("export"), "download");
    assert.equal(url.searchParams.get("id"), file.id);
  }
  assert.throws(() => driveDownloadUrl("bad/id"), TypeError);
  assert.throws(() => driveDownloadUrl("bad?id=1"), TypeError);
});

test("normalizeStudyTitle supports accented séries and Arabic filenames", () => {
  assert.ok(normalizeStudyTitle("SÉRIE").includes("serie"));
  assert.equal(classifyStudyFile("سَلْسَلَة التمارين.PDF"), "series");
});
