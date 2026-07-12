import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isAdmin(request: Request) {
  return Boolean(ADMIN_SECRET) && request.headers.get("x-admin-secret") === ADMIN_SECRET;
}

function safeTable(value: unknown) {
  const table = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(table) ? table : "";
}

async function requestSupabase(path: string, options: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? JSON.parse(text) : null;
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return json(401, { ok: false, error: "Unauthorized" });
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { ok: false, error: "Missing Supabase service credentials" });

  try {
    const params = new URLSearchParams({
      select: "table_name,source_key,title_ar,title_fr,year,total_rows,is_active,created_at,description_ar,description_fr",
      order: "created_at.desc",
      limit: "100",
    });
    const exams = await requestSupabase(`/rest/v1/published_exams?${params}`);
    return json(200, { ok: true, exams: exams || [] });
  } catch (error) {
    return json(500, { ok: false, error: String(error) });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return json(401, { ok: false, error: "Unauthorized" });
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { ok: false, error: "Missing Supabase service credentials" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" });
  }

  const tableName = safeTable(body.tableName || body.table_name);
  if (!tableName) return json(400, { ok: false, error: "Invalid table name" });

  const isActive = body.isActive === true;
  try {
    const params = new URLSearchParams({ table_name: `eq.${tableName}` });
    const rows = await requestSupabase(`/rest/v1/published_exams?${params}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        is_active: isActive,
        description_ar: "",
        description_fr: "",
      }),
    });

    return json(200, {
      ok: true,
      exam: rows?.[0] || null,
      message: isActive ? "تمت إعادة النتيجة إلى الموقع" : "تمت إزالة النتيجة من الموقع",
    });
  } catch (error) {
    return json(500, { ok: false, error: String(error) });
  }
}
