import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  STUDY_LIBRARY, STUDY_BOOK_FILES, STUDY_EXAM_FILES, STUDY_REFERENCE_FILES,
  canonicalStudyLevel, studyLibraryPlacement,
} from "../data/study-library.mjs";

function read(relative) {
  return readFileSync(new URL("../" + relative, import.meta.url), "utf8");
}
test("every educational document has one and only one published destination", () => {
  const groups = [STUDY_BOOK_FILES, STUDY_EXAM_FILES, STUDY_REFERENCE_FILES];
  assert.equal(STUDY_LIBRARY.length, 712);
  assert.equal(groups.reduce((sum, group) => sum + group.length, 0), STUDY_LIBRARY.length);
  const ids = groups.flatMap(group => group.map(file => file.id));
  assert.equal(new Set(ids).size, STUDY_LIBRARY.length);
  assert.equal(STUDY_REFERENCE_FILES.filter(f => ["books","exams","tests"].includes(f.placement)).length, 0);
  assert.equal(STUDY_EXAM_FILES.filter(f => !["exams","tests"].includes(f.placement)).length, 0);
});

test("3AS is treated as 4AS/BEPC even when a nested filename says 3AST", () => {
  assert.equal(canonicalStudyLevel("3AS"), "4AS");
  assert.equal(canonicalStudyLevel("5AS", "Rallye3AST12018.pdf"), "4AS");
  assert.equal(STUDY_LIBRARY.filter(file => file.level === "3AS").length, 0);
  assert.ok(STUDY_LIBRARY.some(file => file.title === "dzexams-docs-3as-902015.pdf" && file.level === "4AS"));
});

test("real textbooks are placed under books, while exercises stay references", () => {
  const book = name => STUDY_BOOK_FILES.some(file => file.title === name);
  assert.ok(book("JoussourMaths7C.pdf"));
  assert.ok(book("Livre MAT 5AS.pdf"));
  assert.ok(book("كتاب اللغة العربية 4As.pdf"));
  assert.ok(STUDY_REFERENCE_FILES.some(file => /Série.*Chimie/i.test(file.title)));
  assert.equal(studyLibraryPlacement({ title: "Sujets Bac 2025 corrigés.pdf", category: "exams" }), "exams");
  assert.equal(studyLibraryPlacement({ title: "كتاب الرياضيات.pdf", category: "lessons" }), "books");
});

test("cards reveal only the selected step instead of four filter panels", () => {
  const resources = read("components/documents/StudyResourceLibrary.jsx");
  assert.match(resources, /!level \? "level"/);
  for (const s of ["level", "branch", "subject", "type", "files"]) assert.ok(resources.includes('step === "' + s + '"'), s);
  assert.match(resources, /function ChoiceCard/);
  assert.doesNotMatch(resources, /<select/);
  assert.match(resources, /\/study\/reader\?/);
});

test("books and exams use same-site readers and never link directly to Google Drive", () => {
  const books = read("app/lessons/LessonsExplorer.jsx");
  const exams = read("components/documents/ExamLibrary.jsx");
  const references = read("components/documents/StudyResourceLibrary.jsx");
  assert.match(books, /STUDY_BOOK_FILES/);
  assert.match(exams, /STUDY_EXAM_FILES/);
  assert.match(books, /\/study\/reader\?id=/);
  assert.match(exams, /\/study\/reader\?/);
  assert.match(references, /\/study\/reader\?/);
  assert.match(books, /\/study\/book-reader\?url=/);
  assert.doesNotMatch(exams, /href=\{card\.file\.link\}/);
  assert.doesNotMatch(references, /href=\{file\.link\}/);
  assert.doesNotMatch(books, /href=\{b\.url\}/);
  assert.match(books, /grades: \["1AS","2AS","4AS"\]/);
});
