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


# Extract Supabase connection fields without letting libpq parse the password
# as a URI. A password containing an unescaped @, ?, #, or / can cause
# libpq to mistakenly interpret part of the password as the hostname.
# Split at the LAST @, then provide credentials through libpq environment
# variables. Do not print passwords or the full URI.
source_rest="${SUPABASE_DATABASE_URL#postgresql://}"
if [[ "${source_rest}" == "${SUPABASE_DATABASE_URL}" ]]; then
  echo "::error::Supabase connection must begin with postgresql://."
  exit 1
fi
source_auth="${source_rest%@*}"
source_endpoint="${source_rest##*@}"
if [[ "${source_auth}" == "${source_rest}" || "${source_endpoint}" != */* ]]; then
  echo "::error::Supabase connection string format is invalid."
  exit 1
fi
source_user="${source_auth%%:*}"
source_password="${source_auth#*:}"
source_host_port="${source_endpoint%%/*}"
source_host="${source_host_port%:*}"
source_port="${source_host_port##*:}"
source_db="${source_endpoint#*/}"
source_db="${source_db%%\?*}"

# Accept literal special characters and percent-encoded URI credentials.
decode_percent() {
  local remaining="$1" output="" char
  while [[ "${remaining}" =~ ^([^%]*)%([0-9A-Fa-f]{2})(.*)$ ]]; do
    output+="${BASH_REMATCH[1]}"
    printf -v char '%b' "\\x${BASH_REMATCH[2]}"
    output+="${char}"
    remaining="${BASH_REMATCH[3]}"
  done
  printf '%s%s' "${output}" "${remaining}"
}
source_password="$(decode_percent "${source_password}")"
if [[ -z "${source_password}" || "${source_password}" == "[YOUR-PASSWORD]" ]]; then
  echo "::error::Supabase URI has a missing password. Correct the GitHub secret."
  exit 1
fi

# Restrict the backup source to the known MauriResults Supabase project.
if [[ "${source_user}" != "postgres.whuddmevtiuejfwpstta" && "${source_user}" != "postgres" ]] ||
   [[ "${source_db}" != "postgres" || "${source_port}" != "5432" ]] ||
   [[ "${source_host}" != "aws-0-eu-west-1.pooler.supabase.com" &&
      "${source_host}" != "db.whuddmevtiuejfwpstta.supabase.co" ]]; then
  echo "::error::Supabase source host, project, port, or database mismatch."
  exit 1
fi

source_psql() {
  PGPASSWORD="${source_password}" PGSSLMODE=require psql \
    --host="${source_host}" --port="${source_port}" \
    --username="${source_user}" --dbname="${source_db}" "$@"
}

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
source_version="$(source_psql -XAt -v ON_ERROR_STOP=1 -c "show server_version_num;")"
target_version="$(psql "${NEON_STAGING_DATABASE_URL}" -XAt -v ON_ERROR_STOP=1 -c "show server_version_num;")"
echo "Source PostgreSQL version: ${source_version}; target: ${target_version}"

workdir="$(mktemp -d)"
trap 'rm -rf "${workdir}"' EXIT
dump="${workdir}/supabase-public.dump"
toc="${workdir}/restore.list"
filtered="${workdir}/restore-filtered.list"

echo "Exporting the public schema and table contents (no dump uploaded to GitHub)..."
PGPASSWORD="${source_password}" PGSSLMODE=require pg_dump --format=custom --schema=public --no-owner --no-acl \
  --host="${source_host}" --port="${source_port}" --username="${source_user}" --dbname="${source_db}" \
  --file="${dump}"
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
  local side="$1"
  if [[ "${side}" == "source" ]]; then
    source_psql -XAt -v ON_ERROR_STOP=1
  else
    psql "${NEON_STAGING_DATABASE_URL}" -XAt -v ON_ERROR_STOP=1
  fi <<'SQL'
SELECT format('SELECT %L AS table_name, count(*)::bigint AS records FROM %I.%I;',
              table_name, table_schema, table_name)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name
\gexec
SQL
}

count_tables source | sort > "${workdir}/source-counts.txt"
count_tables neon | sort > "${workdir}/target-counts.txt"
echo "Comparing exact per-table counts..."
if ! diff -u "${workdir}/source-counts.txt" "${workdir}/target-counts.txt"; then
  echo "::error::Table counts do not match. Do not deploy."
  exit 1
fi
echo "Success: public-table row counts match. This does NOT prove app/RPC compatibility."
echo "Keep production on Supabase. Perform API, permissions, ranking, upload, and load tests next."
