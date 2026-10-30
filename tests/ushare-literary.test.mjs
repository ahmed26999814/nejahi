import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { findStudyFile, driveDownloadCandidates, ownedDriveMappingStats } from "../lib/study-download.mjs";

const archive = JSON.parse(readFileSync(new URL("../data/ushare-literary-files.json", import.meta.url), "utf8"));
test("uShare copies are distinct, recognized, and downloadable", () => {
  assert.equal(archive.sourceFilesUploaded, 167);
  assert.equal(archive.internalDuplicatesDeleted, 25);
  assert.equal(archive.newDriveFiles, 138);
  assert.equal(archive.overlappingExistingFilesReused, 4);
  assert.equal(archive.files.length, 142);
  assert.equal(new Set(archive.files.map(file => file.id)).size, 142);
  for (const file of archive.files) {
    assert.equal(findStudyFile(file.id)?.title, file.title);
    assert.ok(driveDownloadCandidates(file.id).length);
    assert.ok(file.link.startsWith("https://drive.google.com/file/d/"));
    assert.ok(file.verifiedBranches.length);
    assert.ok(file.verifiedSubject);
  }
  assert.deepEqual(ownedDriveMappingStats(), { original: 552, copied: 552 });
});
test("literary references are shown inline rather than as external shortcuts", () => {
  const resources = readFileSync(new URL("../components/documents/ExternalResourceCollections.jsx", import.meta.url), "utf8");
  const literary = readFileSync(new URL("../components/documents/LiteraryStudyFiles.jsx", import.meta.url), "utf8");
  assert.ok(resources.includes("<LiteraryStudyFiles />"));
  assert.ok(resources.includes('item.id !== "literary-ushare"'));
  assert.ok(literary.includes("archive.folderUrl"));
  assert.ok(literary.includes("/api/study-files/download?id="));
});
