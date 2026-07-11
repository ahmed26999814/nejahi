import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function safeTableName(value: unknown) {
  const table = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(table) ? table : "";
}

export async function POST(request: Request) {
  if (!ADMIN_SECRET || request.headers.get("x-admin-secret") !== ADMIN_SECRET) {
    return json(401, { ok: false, error: "Unauthorized admin reset" });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json(500, { ok: false, error: "Missing Supabase service role environment variables" });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" });
  }

  const tableName = safeTableName(body.tableName || body.table);
  if (!tableName) return json(400, { ok: false, error: "Invalid table name" });

  // Only uploaded/custom tables may be reset. Protect the built-in official tables.
  const protectedTables = new Set([
    "bac_results",
    "brevet_results",
    "concours_results",
    "bac_session2_results",
    "excellence_1as_results",
  ]);
  if (protectedTables.has(tableName)) {
    return json(403, { ok: false, error: "Built-in result tables cannot be reset from this endpoint" });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reset_results_upload_table`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_table_name: tableName }),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    return json(response.status, {
      ok: false,
      error: text.replace(/\s+/g, " ").slice(0, 900),
      hint: "Run the reset_results_upload_table SQL migration in Supabase.",
    });
  }

  let result: unknown = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  return json(200, { ok: true, result });
}
