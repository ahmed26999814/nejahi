import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  PUBLIC_EXAMS_CACHE_TAG,
  dashboardSourceTag,
  filterSourceTag,
  searchSourceTag,
} from "../../../../lib/cacheTags";
import { warmExamSearchCache } from "../../../../lib/examCacheWarmup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const REQUEST_TIMEOUT_MS = 15_000;
const LOOKUP_TIMEOUT_MS = 240_000;
const SAFE_FUNCTION_BUDGET_MS = 270_000;

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

function invalidateSourceCaches(sourceKey: string) {
  revalidateTag(PUBLIC_EXAMS_CACHE_TAG);
  revalidateTag(searchSourceTag(sourceKey));
  revalidateTag(filterSourceTag(sourceKey));
  revalidateTag(dashboardSourceTag(sourceKey));
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

async function getExistingPublication(tableName: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "*");
  url.searchParams.set("table_name", `eq.${tableName}`);
  url.searchParams.set("limit", "1");
  const response = await supabaseFetch(url, { headers: { Prefer: "count=none" } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Unable to inspect current publication: ${text.slice(0, 600)}`);
  const rows = text ? JSON.parse(text) : [];
  return Array.isArray(rows) && rows.length ? rows[0] as Record<string, unknown> : null;
}

async function deletePreparedSource(tableName: string, sourceKey: string) {
  const metadataUrl = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  metadataUrl.searchParams.set("table_name", `eq.${tableName}`);
  const metadataResponse = await supabaseFetch(metadataUrl, { method: "DELETE" });
  if (!metadataResponse.ok) throw new Error((await metadataResponse.text()).slice(0, 500));

  const lookupUrl = new URL(`${SUPABASE_URL}/rest/v1/result_number_lookup`);
  lookupUrl.searchParams.set("source_key", `eq.${sourceKey}`);
  const lookupResponse = await supabaseFetch(lookupUrl, { method: "DELETE" });
  if (!lookupResponse.ok) throw new Error((await lookupResponse.text()).slice(0, 500));

  const dashboardUrl = new URL(`${SUPABASE_URL}/rest/v1/published_exam_dashboard_cache`);
  dashboardUrl.searchParams.set("source_key", `eq.${sourceKey}`);
  const dashboardResponse = await supabaseFetch(dashboardUrl, { method: "DELETE" });
  if (!dashboardResponse.ok && dashboardResponse.status !== 404) {
    throw new Error((await dashboardResponse.text()).slice(0, 500));
  }
}

async function rollbackPublication(
  tableName: string,
  sourceKey: string,
  existing: Record<string, unknown> | null,
) {
  try {
    if (existing) {
      const restoreUrl = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
      restoreUrl.searchParams.set("on_conflict", "table_name");
      const response = await supabaseFetch(restoreUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(existing),
      });
      if (!response.ok) throw new Error((await response.text()).slice(0, 500));

      const analytics = await refreshDashboard(sourceKey);
      if (!analytics.ok) throw new Error(analytics.error);
      const lookup = await refreshNumberLookup(sourceKey);
      if (!lookup.ok) throw new Error(lookup.error);

      invalidateSourceCaches(sourceKey);
      if (existing.is_active) {
        const restoredWarmup = await warmExamSearchCache(
          sourceKey,
          safeSearchMode(existing.search_mode),
          60_000,
        );
        if (!restoredWarmup.ok) {
          return { ok: false, restored: true, error: "Previous publication was restored but its cache warmup was incomplete.", warmup: restoredWarmup };
        }
      }
    } else {
      await deletePreparedSource(tableName, sourceKey);
      invalidateSourceCaches(sourceKey);
    }

    revalidatePath("/");
    revalidatePath("/statistics");
    revalidatePath("/toppers");
    return { ok: true, restored: Boolean(existing) };
  } catch (error) {
    invalidateSourceCaches(sourceKey);
    return { ok: false, error: String(error).slice(0, 700) };
  }
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

async function refreshNumberLookup(sourceKey: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/refresh_result_number_lookup`);
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_source_key: sourceKey }),
  });

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, error: `Number lookup failed: ${text.slice(0, 700)}` } as const;
  }

  const lookup = text ? JSON.parse(text) : null;
  if (!lookup?.ok || Number(lookup?.lookup_rows || 0) <= 0) {
    return { ok: false, error: "Number lookup failed: no searchable candidate rows were prepared." } as const;
  }

  return { ok: true, lookup } as const;
}

export async function POST(request: Request) {
  const publishStarted = Date.now();
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
  const sourceKey = `upload:${tableName}`;
  const expectedRows = Number(body.totalRows || 0);
  if (!Number.isInteger(expectedRows) || expectedRows <= 0) return json(400, { ok: false, error: "A positive totalRows value is required" });

  let existingPublication: Record<string, unknown> | null = null;
  let staged = false;

  try {
    existingPublication = await getExistingPublication(tableName);
    const row = {
      table_name: tableName,
      source_key: sourceKey,
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
      total_rows: expectedRows,
      is_active: false,
    };

    const prepared = await validatePreparedExam(row, expectedRows);
    if (!prepared.ok) return json(422, { ok: false, error: prepared.error, published: false });

    const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
    url.searchParams.set("on_conflict", "table_name");
    const response = await supabaseFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    });

    const text = await response.text();
    if (!response.ok) return json(response.status, { ok: false, error: text.replace(/\s+/g, " ").slice(0, 700) });
    staged = true;
    invalidateSourceCaches(sourceKey);
    revalidatePath("/");

    const analytics = await refreshDashboard(sourceKey);
    if (!analytics.ok) {
      const rollback = await rollbackPublication(tableName, sourceKey, existingPublication);
      return json(422, {
        ok: false,
        error: analytics.error,
        published: false,
        rollback,
        hint: "The exam was not released. Rebuild its analytics cache and publish again.",
      });
    }

    const numberLookup = await refreshNumberLookup(sourceKey);
    if (!numberLookup.ok) {
      const rollback = await rollbackPublication(tableName, sourceKey, existingPublication);
      return json(422, {
        ok: false,
        error: numberLookup.error,
        published: false,
        rollback,
        hint: "The exam was not released. Build its candidate-number lookup and publish again.",
      });
    }

    revalidateTag(searchSourceTag(sourceKey));
    revalidateTag(dashboardSourceTag(sourceKey));
    const elapsedBeforeWarmup = Date.now() - publishStarted;
    const warmupBudget = SAFE_FUNCTION_BUDGET_MS - elapsedBeforeWarmup;
    if (warmupBudget < 15_000) {
      const rollback = await rollbackPublication(tableName, sourceKey, existingPublication);
      return json(503, {
        ok: false,
        error: "Publishing preparation completed, but there was not enough safe execution time to warm the result cache.",
        published: false,
        rollback,
        hint: "Publish again. The prepared lookup remains ready, so the retry should complete faster.",
      });
    }

    const warmup = await warmExamSearchCache(sourceKey, searchMode, Math.min(180_000, warmupBudget));
    if (!warmup.ok || warmup.total === 0) {
      const rollback = await rollbackPublication(tableName, sourceKey, existingPublication);
      return json(503, {
        ok: false,
        error: "Result cache warmup did not complete safely.",
        published: false,
        warmup,
        rollback,
        hint: "The exam was kept private. Publish again after checking Supabase health.",
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
    if (!activateResponse.ok) {
      const rollback = await rollbackPublication(tableName, sourceKey, existingPublication);
      return json(activateResponse.status, {
        ok: false,
        error: `Activation failed: ${activateText.slice(0, 600)}`,
        published: false,
        rollback,
      });
    }

    invalidateSourceCaches(sourceKey);
    revalidatePath("/");
    revalidatePath("/statistics");
    revalidatePath("/toppers");

    return json(200, {
      ok: true,
      published: true,
      exam: activateText ? JSON.parse(activateText)?.[0] : { ...row, is_active: true },
      validation: {
        rows: prepared.actualRows,
        analytics: true,
        numberLookup: true,
        lookupRows: numberLookup.lookup.lookup_rows,
        rankedView: tableName,
        cacheWarmed: true,
      },
      warmup,
      elapsedMs: Date.now() - publishStarted,
    });
  } catch (error) {
    const rollback = staged
      ? await rollbackPublication(tableName, sourceKey, existingPublication)
      : { ok: true, skipped: true };
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return json(timedOut ? 504 : 500, {
      ok: false,
      error: timedOut ? "Publishing timed out safely" : String(error),
      published: false,
      rollback,
    });
  }
}
