import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

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

test("migration script is valid Bash and handles literal reserved URI password characters", () => {
  assert.doesNotThrow(() =>
    execFileSync("bash", ["-n", new URL("../scripts/neon-staging-migrate.sh", import.meta.url).pathname]),
  );
  assert.match(script, /source_auth="\$\{source_rest%@\*\}"/);
  assert.match(script, /source_endpoint="\$\{source_rest##\*@\}"/);
  assert.match(script, /PGPASSWORD="\$\{source_password\}" PGSSLMODE=require pg_dump/);
  assert.match(script, /source_psql\(\)/);
  assert.doesNotMatch(script, /psql "\$\{SUPABASE_DATABASE_URL\}"/);
});

test("staging pg_restore excludes only Supabase-specific policy entries, not row security", () => {
  const awkProgram = script.match(/awk '([\\s\\S]*?)' "\\$\\{toc\\}" > "\\$\\{filtered\\}"/)?.[1];
  assert.ok(awkProgram, "Expected a constrained custom-format restore TOC filter");
  const toc = [
    "10; 100 200 TABLE public bac_results source_admin",
    "11; 100 201 POLICY public bac_results Allow anon read source_admin",
    "12; 100 202 ROW SECURITY public bac_results source_admin",
    "13; 100 203 INDEX public bac_results_idx source_admin",
    "14; 100 204 COMMENT - SCHEMA public source_admin",
    "15; 100 205 SCHEMA - public source_admin",
    "16; 100 206 TABLE DATA public bac_results source_admin",
    "",
  ].join("\\n");
  const filtered = execFileSync("awk", [awkProgram], { input: toc, encoding: "utf8" });
  assert.match(filtered, /TABLE public bac_results/);
  assert.match(filtered, /ROW SECURITY public bac_results/);
  assert.match(filtered, /INDEX public bac_results_idx/);
  assert.match(filtered, /TABLE DATA public bac_results/);
  assert.doesNotMatch(filtered, /POLICY public bac_results/);
  assert.doesNotMatch(filtered, /COMMENT - SCHEMA public/);
  assert.doesNotMatch(filtered, /SCHEMA - public/);
  assert.match(script, /--no-acl/);
  assert.match(script, /--single-transaction/);
});
