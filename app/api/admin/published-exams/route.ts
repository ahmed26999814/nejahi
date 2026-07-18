import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const REQUEST_TIMEOUT_MS = 10_000;
const LOOKUP_TIMEOUT_MS = 240_000;
const SEARCH_CACHE_TAG = "mauriresults-number-search-v1";

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

async function requestSupabase(path: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
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

async function getExam(tableName: string) {
  const params = new URLSearchParams({
    table_name: `eq.${tableName}`,
    select: "table_name,source_key,title_ar,title_fr,year,total_rows,is_active,created_at,description_ar,description_fr",
    limit: "1",
  });
  const rows = await requestSupabase(`/rest/v1/published_exams?${params}`);
  return rows?.[0] || null;
}

async function setExamActive(tableName: string, isActive: boolean) {
  const params = new URLSearchParams({ table_name: `eq.${tableName}` });
  const rows = await requestSupabase(`/rest/v1/published_exams?${params}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ is_active: isActive, description_ar: "", description_fr: "" }),
  });
  return rows?.[0] || null;
}

async function syncPublicCaches(sourceKey: string, isActive: boolean) {
  if (!sourceKey) return;

  if (isActive) {
    await requestSupabase("/rest/v1/rpc/refresh_published_exam_dashboard_cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_source_key: sourceKey }),
    });
    await requestSupabase("/rest/v1/rpc/refresh_result_number_lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_source_key: sourceKey }),
    }, LOOKUP_TIMEOUT_MS);
    revalidateTag(SEARCH_CACHE_TAG);
    return;
  }

  const dashboardParams = new URLSearchParams({ source_key: `eq.${sourceKey}` });
  await requestSupabase(`/rest/v1/published_exam_dashboard_cache?${dashboardParams}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  const lookupParams = new URLSearchParams({ source_key: `eq.${sourceKey}` });
  await requestSupabase(`/rest/v1/result_number_lookup?${lookupParams}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  }, LOOKUP_TIMEOUT_MS);
  revalidateTag(SEARCH_CACHE_TAG);
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
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
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
    const currentExam = await getExam(tableName);
    if (!currentExam) return json(404, { ok: false, error: "Published exam not found" });

    let exam;
    if (isActive) {
      // Prepare every public dependency before exposing the exam. A failed
      // refresh therefore leaves the exam safely inactive.
      await syncPublicCaches(String(currentExam.source_key), true);
      exam = await setExamActive(tableName, true);
    } else {
      exam = await setExamActive(tableName, false);
      await syncPublicCaches(String(currentExam.source_key), false);
    }

    return json(200, {
      ok: true,
      exam,
      numberLookupReady: isActive,
      message: isActive ? "تمت إعادة النتيجة إلى الموقع" : "تمت إزالة النتيجة من الموقع",
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return json(timedOut ? 504 : 500, { ok: false, error: timedOut ? "Update timed out safely" : String(error) });
  }
}
