import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const REQUEST_TIMEOUT_MS = 15_000;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isAdmin(request: Request) {
  const supplied = request.headers.get("x-admin-secret") || "";
  return Boolean(ADMIN_SECRET) && supplied === ADMIN_SECRET;
}

function safeIdentifier(value: unknown) {
  const text = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(text) ? text : "";
}

function safeColumn(value: unknown) {
  const text = String(value || "").replace(/\u0000/g, "").trim();
  return text && text.length <= 120 ? text : "";
}

function safeText(value: unknown, fallback = "") {
  const text = String(value || "").replace(/\u0000/g, "").trim();
  return text || fallback;
}

function safeSearchMode(value: unknown) {
  const mode = String(value || "simple").trim();
  return ["simple", "concours"].includes(mode) ? mode : "simple";
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function supabaseFetch(url: URL, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
}

async function validateRankedTable(row: Record<string, unknown>) {
  const tableName = String(row.table_name);
  const rankUrl = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
  rankUrl.searchParams.set("select", `rank,"${String(row.score_column).replaceAll('"', '""')}"`);
  rankUrl.searchParams.set("order", "rank.asc");
  rankUrl.searchParams.set("limit", "1");

  let lastError = "";
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const rankResponse = await supabaseFetch(rankUrl, { headers: { Prefer: "count=none" } });
    if (rankResponse.ok) {
      const rankedRows = await rankResponse.json();
      return { ok: true, rankedRows } as const;
    }

    lastError = (await rankResponse.text()).slice(0, 600);
    const schemaCacheDelay = rankResponse.status === 404 && /PGRST204|PGRST205|schema cache/i.test(lastError);
    if (!schemaCacheDelay || attempt === 5) break;
    await wait(attempt * 400);
  }

  return { ok: false, error: lastError } as const;
}

async function validatePreparedExam(row: Record<string, unknown>, expectedRows: number) {
  const tableName = String(row.table_name);
  const mappedColumns = [
    row.number_column,
    row.name_column,
    row.score_column,
    row.decision_column,
    row.track_column,
    row.wilaya_column,
    row.moughataa_column,
    row.school_column,
    row.centre_column,
    row.birth_place_column,
    row.birth_date_column,
  ].map((value) => String(value || "").trim()).filter(Boolean);
  const select = [...new Set(mappedColumns)].map((column) => `"${column.replaceAll('"', '""')}"`).join(",");

  const tableUrl = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
  tableUrl.searchParams.set("select", select);
  tableUrl.searchParams.set("limit", "1");
  const tableResponse = await supabaseFetch(tableUrl, { headers: { Prefer: "count=exact", Range: "0-0" } });
  if (!tableResponse.ok) return { ok: false, error: `Mapped-column validation failed: ${(await tableResponse.text()).slice(0, 600)}` } as const;
  const actualRows = Number(tableResponse.headers.get("content-range")?.split("/")[1]);
  if (!Number.isFinite(actualRows) || actualRows !== expectedRows) {
    return { ok: false, error: `Row-count validation failed. Expected ${expectedRows}, found ${Number.isFinite(actualRows) ? actualRows : "unknown"}.` } as const;
  }

  const ranked = await validateRankedTable(row);
  if (!ranked.ok) return { ok: false, error: `Ranked-table validation failed: ${ranked.error}` } as const;
  if (expectedRows > 0 && (!ranked.rankedRows?.length || Number(ranked.rankedRows[0]?.rank) !== 1)) {
    return { ok: false, error: "Ranked-table validation failed: the first row must have rank 1." } as const;
  }
  return { ok: true, actualRows } as const;
}

async function refreshDashboard(sourceKey: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/refresh_published_exam_dashboard_cache`);
  const response = await supabaseFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_source_key: sourceKey }),
  });
  if (!response.ok) return { ok: false, error: `Analytics cache failed: ${(await response.text()).slice(0, 600)}` } as const;
  const dashboard = await response.json();
  if (!dashboard?.stats || !Array.isArray(dashboard?.topStudents)) {
    return { ok: false, error: "Analytics cache failed: incomplete dashboard payload." } as const;
  }
  return { ok: true, dashboard } as const;
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return json(401, { ok: false, error: "Unauthorized admin publish" });
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { ok: false, error: "Missing Supabase service role environment variables" });

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
  const searchMode = safeSearchMode(body.searchMode);

  if (!tableName) return json(400, { ok: false, error: "Invalid table name" });
  if (!numberColumn || !nameColumn || !scoreColumn) {
    return json(400, { ok: false, error: "numberColumn, nameColumn and scoreColumn are required" });
  }

  const titleAr = safeText(body.titleAr, `نتائج ${tableName}`);
  const year = safeText(body.year, "2026");
  const row = {
    table_name: tableName,
    source_key: `upload:${tableName}`,
    title_ar: titleAr,
    title_fr: safeText(body.titleFr, titleAr),
    description_ar: safeText(body.descriptionAr, ""),
    description_fr: safeText(body.descriptionFr, ""),
    year,
    tone: safeText(body.tone, searchMode === "concours" ? "amber" : "green"),
    search_mode: searchMode,
    number_column: numberColumn,
    name_column: nameColumn,
    score_column: scoreColumn,
    decision_column: safeColumn(body.decisionColumn),
    track_column: safeColumn(body.trackColumn),
    wilaya_column: safeColumn(body.wilayaColumn),
    moughataa_column: safeColumn(body.moughataaColumn),
    school_column: safeColumn(body.schoolColumn),
    centre_column: safeColumn(body.centreColumn),
    birth_place_column: safeColumn(body.birthPlaceColumn),
    birth_date_column: safeColumn(body.birthDateColumn),
    ranked_view: tableName,
    total_rows: Number(body.totalRows || 0) || 0,
    is_active: false,
  };

  const expectedRows = Number(body.totalRows || 0);
  if (!Number.isInteger(expectedRows) || expectedRows <= 0) return json(400, { ok: false, error: "A positive totalRows value is required" });
  const prepared = await validatePreparedExam(row, expectedRows);
  if (!prepared.ok) return json(422, { ok: false, error: prepared.error, published: false });

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
    url.searchParams.set("on_conflict", "table_name");
    const response = await supabaseFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    });

    const text = await response.text();
    if (!response.ok) return json(response.status, { ok: false, error: text.replace(/\s+/g, " ").slice(0, 700) });

    const analytics = await refreshDashboard(String(row.source_key));
    if (!analytics.ok) {
      return json(422, {
        ok: false,
        error: analytics.error,
        published: false,
        hint: "The exam remains inactive. Rebuild its analytics cache before activation.",
      });
    }

    const activateUrl = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
    activateUrl.searchParams.set("table_name", `eq.${tableName}`);
    const activateResponse = await supabaseFetch(activateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ is_active: true }),
    });
    const activateText = await activateResponse.text();
    if (!activateResponse.ok) return json(activateResponse.status, { ok: false, error: `Activation failed: ${activateText.slice(0, 600)}`, published: false });

    return json(200, {
      ok: true,
      exam: activateText ? JSON.parse(activateText)?.[0] : { ...row, is_active: true },
      validation: { rows: prepared.actualRows, analytics: true, rankedView: tableName },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return json(timedOut ? 504 : 500, { ok: false, error: timedOut ? "Publishing timed out safely" : String(error), published: false });
  }
}
