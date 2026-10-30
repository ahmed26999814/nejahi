#!/usr/bin/env bash
set -Eeuo pipefail
set +x
export PGCONNECT_TIMEOUT=20

if [[ "${CONFIRM_STAGING:-}" != "STAGING_ONLY" ]]; then
  echo "::error::You must explicitly enter STAGING_ONLY before running the migration."
  exit 1
fi
if [[ -z "${SUPABASE_DATABASE_URL:-}" || -z "${NEON_STAGING_DATABASE_URL:-}" ]]; then
  echo "::error::Set SUPABASE_DATABASE_URL and NEON_STAGING_DATABASE_URL repository secrets."
  exit 1
fi
if [[ "${NEON_STAGING_DATABASE_URL}" != *neon.tech* ]]; then
  echo "::error::Destination must be a Neon PostgreSQL URL."
  exit 1
fi
if [[ "${SUPABASE_DATABASE_URL}" != *supabase.* ]]; then
  echo "::error::Source must be a Supabase PostgreSQL URL."
  exit 1
fi

# Guardrail: ONLY the temporary Neon branch has the migration_stage sentinel.
# The production Neon branch and Supabase do NOT satisfy this check.
target_ok="$(psql "${NEON_STAGING_DATABASE_URL}" -XAt -v ON_ERROR_STOP=1 -c "
SELECT CASE WHEN
 current_database() = 'neondb'
 AND to_regclass('migration_stage.copy_progress') IS NOT NULL
 AND (SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE') = 0
THEN 'STAGING_OK' ELSE 'REFUSE' END;")"
if [[ "${target_ok}" != "STAGING_OK" ]]; then
  echo "::error::Target failed staging safety checks. No data was restored."
  exit 1
fi
source_version="$(psql "${SUPABASE_DATABASE_URL}" -XAt -v ON_ERROR_STOP=1 -c "show server_version_num;")"
target_version="$(psql "${NEON_STAGING_DATABASE_URL}" -XAt -v ON_ERROR_STOP=1 -c "show server_version_num;")"
echo "Source PostgreSQL version: ${source_version}; target: ${target_version}"

workdir="$(mktemp -d)"
trap 'rm -rf "${workdir}"' EXIT
dump="${workdir}/supabase-public.dump"
toc="${workdir}/restore.list"
filtered="${workdir}/restore-filtered.list"

echo "Exporting the public schema and table contents (no dump uploaded to GitHub)..."
pg_dump --format=custom --schema=public --no-owner --no-acl \
  --file="${dump}" "${SUPABASE_DATABASE_URL}"
pg_restore --list "${dump}" > "${toc}"

# Neon already provides the public schema. Prevent a duplicate CREATE SCHEMA.
awk '!(/^[0-9]+;.* SCHEMA - public / || /^[0-9]+;.* COMMENT - SCHEMA public /)' \
  "${toc}" > "${filtered}"

echo "Restoring on the isolated Neon staging branch in one transaction..."
# If Supabase-specific auth roles/functions/extensions cannot be restored,
# fail and roll back rather than falsely claiming the migration is complete.
pg_restore --exit-on-error --single-transaction --no-owner --no-acl \
  --no-comments --use-list="${filtered}" \
  --dbname="${NEON_STAGING_DATABASE_URL}" "${dump}"

count_tables() {
  local db_url="$1"
  psql "${db_url}" -XAt -v ON_ERROR_STOP=1 <<'SQL'
SELECT format('SELECT %L AS table_name, count(*)::bigint AS records FROM %I.%I;',
              table_name, table_schema, table_name)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name
\gexec
SQL
}

count_tables "${SUPABASE_DATABASE_URL}" | sort > "${workdir}/source-counts.txt"
count_tables "${NEON_STAGING_DATABASE_URL}" | sort > "${workdir}/target-counts.txt"
echo "Comparing exact per-table counts..."
if ! diff -u "${workdir}/source-counts.txt" "${workdir}/target-counts.txt"; then
  echo "::error::Table counts do not match. Do not deploy."
  exit 1
fi
echo "Success: public-table row counts match. This does NOT prove app/RPC compatibility."
echo "Keep production on Supabase. Perform API, permissions, ranking, upload, and load tests next."
