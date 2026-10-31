import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = (process.env.NEXT_PUBLIC_NEON_MODE === "1" ? "neon-internal" : process.env.SUPABASE_SERVICE_ROLE_KEY) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const LEGACY = [
  ["bac", "bac_ranked_results"],
  ["brevet", "brevet_ranked_results"],
  ["concours", "concours_ranked_results"],
  ["bac_session", "bac_session2_ranked_results"],
  ["excellence_1as", "excellence_1as_ranked_results"],
] as const;
const UPLOADED = [
  "brevet_2026", "concour_2026", "results_bac_2026",
  "results_bac_ses_2026", "results_concours_exe_2026", "results_excellence_4as_2026",
] as const;

type Result = { key: string; year: string; ok: boolean; durationMs: number; status?: number };

async function check(key: string, relation: string, year: string): Promise<Result> {
  const started = Date.now();
  if (!SUPABASE_URL || !SUPABASE_KEY) return { key, year, ok: false, durationMs: 0 };
  // Allow only known SQL identifiers. Never accept identifiers from a public query.
  if (!/^[a-z][a-z0-9_]*$/.test(relation)) return { key, year, ok: false, durationMs: 0 };
  const url = new URL(`${SUPABASE_URL}/rest/v1/${relation}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");
  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
      },
      signal: AbortSignal.timeout(9_000),
      cache: "no-store",
    });
    if (!response.ok) return { key, year, ok: false, durationMs: Date.now() - started, status: response.status };
    // Row contents never leave the server; monitor only availability and non-empty samples.
    const rows = await response.json();
    return { key, year, ok: Array.isArray(rows) && rows.length > 0, durationMs: Date.now() - started, status: response.status };
  } catch {
    return { key, year, ok: false, durationMs: Date.now() - started };
  }
}

export async function GET() {
  const started = Date.now();
  const checks = await Promise.all([
    ...LEGACY.map(([key, relation]) => check(key, relation, "2025")),
    ...UPLOADED.map((table) => check(`upload:${table}`, table, "2026")),
  ]);
  const ok = checks.length === 11 && checks.every((entry) => entry.ok);
  return NextResponse.json({
    ok,
    checkedAt: new Date().toISOString(),
    totalSources: checks.length,
    healthySources: checks.filter((entry) => entry.ok).length,
    durationMs: Date.now() - started,
    checks,
  }, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
