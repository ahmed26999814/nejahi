# MauriResults: controlled Supabase → Neon migration

## Current verified state (2026-10-30)

- Live site and Vercel production continue to use Supabase. Nothing in this branch changes runtime environment variables.
- Supabase has 28 `public` tables, 31 views, 34 routines, and about 258 MB of total PostgreSQL storage.
- Neon project `mauriresults` (`floral-sunset-63707907`), region London (`aws-eu-west-2`), default branch `production`.
- Dedicated Neon test branch: `supabase-migration-staging` (`br-snowy-shadow-zaqg3mrf`).
- In that branch, `migration_stage` currently contains 28 **data-only, simplified** tables for diagnostic sampling; these do not reproduce constraints, defaults, RLS, indexes, views, or functions.
- 3,037 records copied across 10 tables. Exact counts match; 9/10 content fingerprints match. The temporary `published_exam_dashboard_cache` content did not match (possibly refreshed in Supabase after copying), so treat it as unsynchronized.
- Existing preview data is **not** a substitute for a full database migration. No full dump/restore has been executed.

## Goals and hard safety controls

1. Never delete or modify Supabase production data as part of this workflow.
2. Never replace Vercel production credentials automatically.
3. Do not point the site at Neon until search, RPC, uploads, publishing, admin, analytics, and permissions pass tests.
4. Never commit passwords, database URLs, or `service_role` keys.
5. Always be prepared to switch back to Supabase if results differ.

## Manual GitHub Actions workflow

Workflow: `.github/workflows/neon-staging-migration.yml`. It is **manual only** and does not run on a push or PR. GitHub typically requires the workflow definition to exist on the default branch for it to appear as a manual action. Review and merge **this code-only PR** separately before initiating the migration. Merging the workflow is *not* switching the site to Neon.

Create the following GitHub repository **Actions secrets** (Settings → Secrets and variables → Actions):

- `SUPABASE_DATABASE_URL`: Postgres database connection URL for Supabase. Use a **direct** connection or a compatible **session-mode** pooler, not a transaction pooler. Consult Supabase's Connect dialog. The GitHub runner needs IPv4 connectivity, so use the appropriate supported connection option.
- `NEON_STAGING_DATABASE_URL`: an **unpooled PostgreSQL** connection URL for Neon branch `supabase-migration-staging` and database `neondb`. Obtain it from the Neon Connect dialog with the staging branch selected, not the default production branch.

Do not paste either URL in ChatGPT, GitHub issues, pull request comments, or logs. Quote or encode special characters in passwords as needed for URL syntax.

After reviewing the workflow and adding secrets, run it from GitHub Actions with confirmation input **`STAGING_ONLY`**. It checks that the destination is Neon and has the `migration_stage.copy_progress` sentinel *and* an empty public schema. The default Neon branch lacks this sentinel, so it refuses an accidental production target.

The workflow takes an ephemeral `pg_dump -Fc -n public`, then attempts a transaction-safe `pg_restore` into the staging branch. If a Supabase-only dependency fails, it rolls back the restore and the job fails. It does not silently ignore SQL errors. After restore, it compares exact row counts for every `public` table; it does not upload private dumps or raw candidate results as an artifact.

**Expected compatibility blockers to investigate rather than bypass:**

- PostgreSQL version is 17 on Supabase and 18 on Neon; using PostgreSQL 18 client tools is appropriate.
- Original schemas may reference Supabase `auth`, `storage`, `extensions`, `anon`, and `authenticated` roles; RLS policies and `SECURITY DEFINER` routines require deliberate redesign, not blanket public grants.
- Application API routes currently call `/rest/v1` and `/rest/v1/rpc` with Supabase credentials. Copying Postgres objects to Neon does **not** make these URLs available.
- Indexes, triggers, upload RPCs, number lookup/shards, cache invalidation, admin authorization, and analytics require integration tests before any cutover.

## Next stages after the first backup/restore

1. Review the first workflow run's restore errors and resolve missing dependencies on the staging branch only.
2. Compare source and target row counts, record hashes, and schema/index/function coverage. A successful row count check is necessary but not sufficient.
3. Introduce a Neon Postgres client **server-side only** in a separate application branch and adapt API routes to parameterized SQL. Do not expose a privileged Neon connection to the browser.
4. Test lookup by candidate number across bac, brevet, concours, uploaded tables, ranked results; also test search timeouts, cache and upload/admin flows.
5. Deploy a Vercel Preview that points **only** to staging; observe privacy rules, Postgres region, and compute/storage quotas.
6. With explicit user approval, schedule a final sync and production cutover with a documented rollback to Supabase. Keep source and backups until acceptance.

Official guide: https://neon.com/docs/import/migrate-from-supabase
