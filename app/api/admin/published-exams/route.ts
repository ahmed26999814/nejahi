import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const REQUEST_TIMEOUT_MS = 10_000;

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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

async function syncDashboardCache(sourceKey: string, isActive: boolean) {
  if (!sourceKey) return;
  if (isActive) {
    await requestSupabase("/rest/v1/rpc/refresh_published_exam_dashboard_cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_source_key: sourceKey }),
    });
    return;
  }
  const params = new URLSearchParams({ source_key: `eq.${sourceKey}` });
  await requestSupabase(`/rest/v1/published_exam_dashboard_cache?${params}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
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
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return json(timedOut ? 504 : 500, { ok: false, error: timedOut ? "Request timed out safely" : String(error) });
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
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ is_active: isActive, description_ar: "", description_fr: "" }),
    });

    const exam = rows?.[0] || null;
    if (exam?.source_key) await syncDashboardCache(String(exam.source_key), isActive);

    return json(200, {
      ok: true,
      exam,
      message: isActive ? "تمت إعادة النتيجة إلى الموقع" : "تمت إزالة النتيجة من الموقع",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return json(timedOut ? 504 : 500, { ok: false, error: timedOut ? "Update timed out safely" : String(error) });
  }
}
