import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const workflow = readFileSync(new URL("../.github/workflows/neon-staging-migration.yml", import.meta.url), "utf8");
const script = readFileSync(new URL("../scripts/neon-staging-migrate.sh", import.meta.url), "utf8");

test("Neon migration workflow is manual, not automatically triggered by code changes", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s*(?:push|schedule|pull_request):/);
  assert.match(workflow, /confirm_staging/);
});

test("destination requires the isolated staging sentinel", () => {
  assert.match(script, /STAGING_ONLY/);
  assert.match(script, /migration_stage\.copy_progress/);
  assert.match(script, /current_database\(\) = 'neondb'/);
  assert.match(script, /table_schema = 'public' AND table_type = 'BASE TABLE'/);
});

test("script is designed to keep the current production environment untouched", () => {
  assert.match(script, /pg_dump --format=custom --schema=public/);
  assert.match(script, /pg_restore --exit-on-error --single-transaction/);
  assert.doesNotMatch(script, /vercel env|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE/);
  assert.doesNotMatch(script, /DROP DATABASE|DROP SCHEMA|TRUNCATE|--clean/);
});

test("workflow uses secret-managed URLs and no backups are uploaded", () => {
  assert.match(workflow, /secrets\.SUPABASE_DATABASE_URL/);
  assert.match(workflow, /secrets\.NEON_STAGING_DATABASE_URL/);
  assert.doesNotMatch(workflow, /upload-artifact|artifact\/upload|set-output/);
});
