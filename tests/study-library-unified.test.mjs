import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { findStudyFile, ownedDriveCopyId } from "../lib/study-download.mjs";

const indexed = JSON.parse(readFileSync(new URL("../data/indexed-drive-study-files.json", import.meta.url), "utf8")).files;
const literary = JSON.parse(readFileSync(new URL("../data/ushare-literary-files.json", import.meta.url), "utf8")).files;
const all = new Set([...indexed, ...literary].map(x => x.id));

test("combined library indexes each verified document once", () => {
  assert.equal(all.size, indexed.length + literary.filter(x => !indexed.some(y => y.id === x.id)).length);
  assert.ok(all.size >= 696);
});

test("all source Google Drive documents are mapped to copies in the MauriResults Drive", () => {
  for (const file of indexed) assert.ok(ownedDriveCopyId(file.id), file.title);
});

test("only indexed, validated IDs can be read", () => {
  assert.equal(findStudyFile("not-a-file"), null);
  assert.equal(findStudyFile("../bad"), null);
  assert.ok(findStudyFile(indexed[0].id));
});

test("public library UI uses first-party reader and download routes", () => {
  const component = readFileSync(new URL("../components/documents/StudyResourceLibrary.jsx", import.meta.url), "utf8");
  const wrapper = readFileSync(new URL("../components/documents/ExternalResourceCollections.jsx", import.meta.url), "utf8");
  assert.match(component, /\/study\/reader\?id=/);
  assert.match(component, /\/api\/study-files\/download\?id=/);
  assert.doesNotMatch(component, /drive\.google\.com|mediafire\.com|ushare/i);
  assert.doesNotMatch(wrapper, /drive\.google\.com|mediafire\.com|ushare/i);
});
