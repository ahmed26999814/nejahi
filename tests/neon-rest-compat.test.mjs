import assert from "node:assert/strict";
import test from "node:test";
import { safeLimit } from "../lib/neon/restCompat.mjs";

test("omitted PostgREST pagination uses nonzero safe defaults", () => {
  assert.equal(safeLimit(null, 1000, 10000), 1000);
  assert.equal(safeLimit(undefined, 1000, 10000), 1000);
  assert.equal(safeLimit("", 1000, 10000), 1000);
  assert.equal(safeLimit(null, 0, 10000000), 0);
});
test("explicit limit and offset remain bounded", () => {
  assert.equal(safeLimit("5", 1000, 10000), 5);
  assert.equal(safeLimit("0", 1000, 10000), 0);
  assert.equal(safeLimit("500000", 1000, 10000), 10000);
  assert.equal(safeLimit("-1", 1000, 10000), 1000);
  assert.equal(safeLimit("inf", 1000, 10000), 1000);
});
