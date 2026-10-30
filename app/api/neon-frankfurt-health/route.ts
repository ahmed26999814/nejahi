import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This endpoint intentionally reports no student records or credentials.
// A 200 response is NOT sufficient for a production cutover: authorization
// and end-to-end endpoint checks are separate release gates.
export async function GET() {
  const connectionString = process.env.NEON_FRANKFURT_DATABASE_URL;
  if (!connectionString) return NextResponse.json(
    { ok: false, status: "not_configured" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
  try {
    const sql = neon(connectionString);
    const [row] = await sql`
      SELECT
        current_database() = 'neondb' AS correct_database,
        (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') AS tables,
        (SELECT count(*)::int FROM information_schema.views WHERE table_schema='public') AS views,
        (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public') AS functions,
        (SELECT count(*)::int FROM pg_indexes WHERE schemaname='public') AS indexes,
        (SELECT count(*)::int FROM pg_policies WHERE schemaname='public') AS policies,
        (SELECT count(*)::int FROM public.concour_2026) AS concours_2026_rows,
        (SELECT stage FROM migration_stage.copy_progress WHERE id=1) AS copy_stage
    `;
    const complete =
      row.correct_database === true &&
      row.tables === 28 && row.views === 31 &&
      row.functions === 34 && row.indexes === 121 &&
      row.concours_2026_rows === 121140 &&
      row.copy_stage === "FULLY_VERIFIED";
    return NextResponse.json(
      { ok: complete, status: complete ? "frankfurt_data_complete" : "frankfurt_data_incomplete" },
      { status: complete ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: "verification_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
