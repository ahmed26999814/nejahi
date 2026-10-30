import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Isolated Neon cutover preflight endpoint. This is intentionally read-only,
 * never exposes credentials or row data, and never alters the live provider.
 */
export async function GET() {
  const connectionString = process.env.NEON_STAGING_DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { ok: false, status: "not_configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const sql = neon(connectionString);
    const [summary] = await sql`
      SELECT
        current_database() = 'neondb' AS correct_database,
        to_regclass('migration_stage.copy_progress') IS NOT NULL AS staging_sentinel,
        (SELECT COUNT(*)::int FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tables,
        (SELECT COUNT(*)::int FROM information_schema.views
         WHERE table_schema = 'public') AS views,
        (SELECT COUNT(*)::int FROM pg_proc p JOIN pg_namespace n
         ON n.oid = p.pronamespace WHERE n.nspname = 'public'
           AND NOT EXISTS (
             SELECT 1 FROM pg_depend d
             JOIN pg_extension e ON e.oid = d.refobjid
             WHERE d.objid = p.oid AND d.deptype = 'e'
           )) AS functions,
        (SELECT COUNT(*)::int FROM pg_policies
         WHERE schemaname = 'public') AS policies
    `;
    const ok = summary.correct_database === true
      && summary.staging_sentinel === true
      && summary.tables === 28
      && summary.views === 31
      && summary.functions === 34
      && summary.policies === 0;

    return NextResponse.json(
      { ok, status: ok ? "staging_verified" : "staging_mismatch" },
      {
        status: ok ? 200 : 503,
        headers: { "Cache-Control": "no-store", "X-Mauri-Database": "neon-staging-preflight" },
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: "connection_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
