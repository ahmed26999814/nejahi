import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  findStudyFile,
  ownedDriveCopyId,
  ownedDriveMappingStats,
  driveDownloadCandidates,
} from "../lib/study-download.mjs";

const index = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8")).files;
const partA = JSON.parse(readFileSync(new URL("../data/study-owned-drive-part-a.json", import.meta.url), "utf8")).originalToCopy;
const partB = JSON.parse(readFileSync(new URL("../data/study-owned-drive-part-b.json", import.meta.url), "utf8")).originalToCopy;
const map = { ...partA, ...partB };

test("every indexed document matches exactly one owned copy", () => {
  const stats = ownedDriveMappingStats();
  assert.deepEqual(stats, { original: 552, copied: 552 });
  assert.equal(Object.keys(map).length, index.length);
  assert.equal(new Set(Object.values(map)).size, 552);
  for (const file of index) {
    assert.equal(ownedDriveCopyId(file.id), map[file.id]);
    assert.match(map[file.id], /^[A-Za-z0-9_-]+$/);
  }
});

test("downloads use a known copied file first and original as a reliable fallback", () => {
  for (const file of index) {
    const candidates = driveDownloadCandidates(file.id, true);
    assert.equal(candidates.length, 4);
    const ids = candidates.map(link => new URL(link).searchParams.get("id"));
    assert.deepEqual(ids, [map[file.id], map[file.id], file.id, file.id]);
    const originalFirst = driveDownloadCandidates(file.id, false);
    assert.equal(new URL(originalFirst[0]).searchParams.get("id"), file.id);
  }
});

test("anonymous IDs, relative paths and malformed values cannot access arbitrary Drive files", () => {
  for (const id of ["", "missing-id", "../secrets", "id?x=1"]) {
    assert.equal(findStudyFile(id), null);
    assert.equal(ownedDriveCopyId(id), null);
    assert.deepEqual(driveDownloadCandidates(id, true), []);
  }
});

test("the copied Drive files remain marked private until general access is changed by their owner", () => {
  const a = JSON.parse(readFileSync(new URL("../data/study-owned-drive-part-a.json", import.meta.url), "utf8"));
  const b = JSON.parse(readFileSync(new URL("../data/study-owned-drive-part-b.json", import.meta.url), "utf8"));
  assert.equal(a.permissionStatus, "private");
  assert.equal(b.permissionStatus, "private");
});
