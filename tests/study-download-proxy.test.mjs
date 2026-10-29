import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  findStudyFile,
  driveSourceUrls,
  safeStudyFilename,
  allowedStudyFileLength,
  isTrustedDriveDownloadUrl
} from "../lib/study-download.mjs";

const docs = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8")).files;

test("same-site downloads are limited to indexed educational document IDs", () => {
  for (const doc of docs) {
    assert.equal(findStudyFile(doc.id)?.title, doc.title);
    assert.equal(driveSourceUrls(doc.id).length, 2);
  }
  for (const invalid of ["", "unknown", "../api/secret", "id?x=2", "http://example.com"]) {
    assert.equal(findStudyFile(invalid), null);
    assert.deepEqual(driveSourceUrls(invalid), []);
  }
});

test("Drive redirects accept only HTTPS Google hosts", () => {
  for (const url of [
    "https://drive.google.com/uc?export=download",
    "https://drive.usercontent.google.com/download?id=test",
    "https://doc-1s.googleusercontent.com/random",
  ]) assert.ok(isTrustedDriveDownloadUrl(url));
  for (const url of [
    "https://drive.google.com.evil.test/download",
    "http://drive.google.com/download",
    "https://googleusercontent.com.evil.test/anything",
    "https://attacker.com/document",
    "file:///etc/passwd",
    "javascript:alert(1)"
  ]) assert.equal(isTrustedDriveDownloadUrl(url), false);
});

test("download filename sanitizes unsafe path characters and keeps extension", () => {
  assert.equal(safeStudyFilename({ title: '4AS:Maths/Final.pdf', fileType: "PDF" }), "4AS-Maths-Final.pdf");
  assert.equal(safeStudyFilename({ title: "كتاب العربية.docx", fileType: "DOCX" }), "كتاب العربية.docx");
  assert.equal(safeStudyFilename({ title: "notes.doc", fileType: "DOC" }), "notes.doc");
});

test("bounded download streaming rejects oversized declared lengths", () => {
  assert.ok(allowedStudyFileLength(null));
  assert.ok(allowedStudyFileLength("1024"));
  assert.equal(allowedStudyFileLength("999999999999"), false);
  assert.equal(allowedStudyFileLength("-10"), false);
  assert.equal(allowedStudyFileLength("not-number"), false);
});

test("exam UI no longer contains the branch/subject dropdown filter panel", () => {
  const code = readFileSync(new URL("../components/documents/ExamLibrary.jsx", import.meta.url), "utf8");
  assert.equal(code.includes("كل الشعب والمستويات"), false);
  assert.equal(code.includes("المواضيع والحلول والمراجع"), false);
  assert.equal(code.includes("ابحث بالمادة أو السنة"), false);
  assert.ok(code.includes("سنوات أقدم"));
  assert.ok(code.includes("SubjectCard"));
});
