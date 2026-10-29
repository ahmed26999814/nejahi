import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

const resources = readFileSync(new URL("../components/documents/IndexedStudyFiles.jsx", import.meta.url), "utf8");
const exams = readFileSync(new URL("../components/documents/ExamLibrary.jsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../app/lessons/LessonsAndExams.jsx", import.meta.url), "utf8");

test("resources present one card selection stage at a time", () => {
  assert.match(resources, /!grade \? "grade" : splitBranches && !branch \? "branch" : !subject \? "subject" : !type \? "type" : "files"/);
  for (const stage of ["grade", "branch", "subject", "type", "files"]) {
    assert.ok(resources.includes(`step === "${stage}"`));
  }
  assert.match(resources, /function ChoiceCard/);
  assert.doesNotMatch(resources, /<input|<select|placeholder=/);
});

test("exams present competition cards, then year cards, then subject download cards", () => {
  assert.match(exams, /!competition \?/);
  assert.match(exams, /!year \?/);
  assert.match(exams, /function ChoiceCard/);
  assert.match(exams, /function SubjectCard/);
  assert.doesNotMatch(exams, /<input|<select|overflow-x-auto|كل الشعب والمستويات/);
  assert.match(exams, /سنوات أقدم/);
});

test("both screens retain native downloads and compact labels", () => {
  assert.ok(resources.includes("/api/study-files/download"));
  assert.ok(exams.includes("/api/exam-documents/download"));
  assert.ok(shell.includes('lessons: "الكتب"'));
  assert.ok(shell.includes('exams: "الامتحانات"'));
  assert.ok(shell.includes('resources: "المراجع"'));
  assert.ok(!resources.includes("كل المواد"));
});
