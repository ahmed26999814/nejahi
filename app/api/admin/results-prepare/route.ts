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

function safeIdentifier(value: unknown) {
  const text = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(text) ? text : "";
}

function safeColumn(value: unknown) {
  const text = String(value || "").replace(/\u0000/g, "").trim();
  return text && text.length <= 120 ? text : "";
}

export async function POST(request: Request) {
  if (!ADMIN_SECRET || request.headers.get("x-admin-secret") !== ADMIN_SECRET) {
    return json(401, { ok: false, error: "Unauthorized admin request" });
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

  const tableName = safeIdentifier(body.tableName || body.table);
  const numberColumn = safeColumn(body.numberColumn);
  const nameColumn = safeColumn(body.nameColumn);
  const scoreColumn = safeColumn(body.scoreColumn);
  if (!tableName || !numberColumn || !nameColumn || !scoreColumn) {
    return json(400, { ok: false, error: "tableName, numberColumn, nameColumn and scoreColumn are required" });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/prepare_results_table_speed`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      p_table_name: tableName,
      p_number_column: numberColumn,
      p_name_column: nameColumn,
      p_score_column: scoreColumn,
      p_wilaya_column: safeColumn(body.wilayaColumn) || null,
      p_moughataa_column: safeColumn(body.moughataaColumn) || null,
      p_centre_column: safeColumn(body.centreColumn) || null,
    }),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    return json(response.status, {
      ok: false,
      error: text.replace(/\s+/g, " ").slice(0, 900),
      hint: "Run the fast_results_upload SQL migration in Supabase, then try again.",
    });
  }

  let result: unknown = null;
  try { result = text ? JSON.parse(text) : null; } catch { result = text; }
  return json(200, { ok: true, result });
}
