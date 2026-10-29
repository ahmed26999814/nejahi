import assert from "node:assert/strict";
import { test } from "node:test";
import { STUDY_COLLECTIONS, STUDY_COLLECTION_STAGES } from "../data/study-resource-collections.mjs";

const ALLOWED_HOSTS = new Set(["drive.google.com", "www.mediafire.com", "ushare.cloud"]);

test("study resources include all six submitted public folders exactly once", () => {
  assert.equal(STUDY_COLLECTIONS.length, 6);
  assert.equal(new Set(STUDY_COLLECTIONS.map(({ id }) => id)).size, 6);
  assert.equal(new Set(STUDY_COLLECTIONS.map(({ url }) => url)).size, 6);
});

test("all external resources use approved HTTPS hosts and explicit levels", () => {
  for (const item of STUDY_COLLECTIONS) {
    const parsed = new URL(item.url);
    assert.equal(parsed.protocol, "https:");
    assert.ok(ALLOWED_HOSTS.has(parsed.hostname), item.url);
    assert.ok(STUDY_COLLECTION_STAGES.includes(item.stage) && item.stage !== "all");
    assert.ok(item.levels.length > 0);
    assert.ok(item.title.ar && item.title.fr && item.note.ar && item.note.fr);
  }
});

test("folder years are not mislabeled as 2027", () => {
  assert.equal(STUDY_COLLECTIONS.find(({ id }) => id === "literary-ushare").sourceYear, "2024");
  assert.equal(STUDY_COLLECTIONS.find(({ id }) => id === "bac-drive").sourceYear, "2026");
  assert.equal(STUDY_COLLECTIONS.filter(({ sourceYear }) => sourceYear === "2027").length, 0);
});

test("education levels map to the intended student groups", () => {
  assert.deepEqual(STUDY_COLLECTIONS.find(({ id }) => id === "fourth-drive").levels, ["4AS"]);
  assert.deepEqual(STUDY_COLLECTIONS.find(({ id }) => id === "sixth-drive").levels, ["6AF"]);
  assert.deepEqual(STUDY_COLLECTIONS.find(({ id }) => id === "fifth-drive").branches, ["C", "D"]);
});
