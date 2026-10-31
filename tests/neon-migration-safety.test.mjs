import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const read = (name) => readFileSync(new URL(name, root), "utf8");
const absent = [
  ".github/workflows/neon-staging-migration.yml",
  ".github/workflows/deploy-after-vercel-reset.yml",
  ".github/workflows/fix-sensitive-env-prebuilt.yml",
  ".github/workflows/deploy-latest-prebuilt.yml",
  ".github/workflows/restore-known-good-production.yml",
];

test("old Supabase staging and competing production deployers cannot run again", () => {
  for (const file of absent) assert.equal(existsSync(new URL(file, root)), false, file);
});

test("Neon mode is explicit, production connection remains server-only", () => {
  const cfg = read("next.config.mjs");
  const compat = read("lib/neon/restCompat.mjs");
  assert.match(cfg, /NEXT_PUBLIC_NEON_MODE/);
  assert.match(compat, /NEON_DATABASE_URL/);
  assert.doesNotMatch(cfg, /NEXT_PUBLIC_NEON_DATABASE_URL/);
});

test("CI security audit does not reintroduce Supabase credentials", () => {
  const audit = read(".github/workflows/security-audit.yml");
  assert.match(audit, /NEXT_PUBLIC_NEON_MODE/);
  assert.doesNotMatch(audit, /secrets\.(?:SUPABASE_|NEXT_PUBLIC_SUPABASE)/);
});
