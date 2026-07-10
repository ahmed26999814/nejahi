import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 10_000;

function isSafeIdentifier(value: unknown) {
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(String(value || ""));
}

function clean(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

function quoteSelectColumn(value: unknown) {
  const column = clean(value);
  return column ? `"${column.replaceAll('"', '""')}"` : "";
}

function escapePostgrestValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)").trim();
}

function numberValues(value: string) {
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  return [...new Set([value, value.padStart(5, "0"), value.padStart(6, "0"), value.padStart(7, "0"), String(Number(value))])]
    .map(escapePostgrestValue);
}

async function fetchMetadata(source: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "table_name,ranked_view,search_mode,number_column,name_column,score_column,decision_column,track_column,wilaya_column,moughataa_column,school_column,centre_column,birth_place_column,birth_date_column");
  url.searchParams.set("source_key", `eq.${escapePostgrestValue(source)}`);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("search_mode", "eq.concours");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
  });
  if (!response.ok) return null;
  return (await response.json())?.[0] || null;
}

async function queryResults(exam: Record<string, unknown>, filters: Record<string, string>, useFallback = false) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { error: "Missing Supabase environment variables", status: 500 } as const;
  const tableName = clean(useFallback ? exam.table_name : exam.ranked_view);
  if (!isSafeIdentifier(tableName)) return { error: "Invalid results relation", status: 422 } as const;

  const mappedColumns = [exam.number_column, exam.name_column, exam.score_column, exam.decision_column, exam.track_column, exam.wilaya_column, exam.moughataa_column, exam.school_column, exam.centre_column, exam.birth_place_column, exam.birth_date_column]
    .map(clean)
    .filter(Boolean);
  const select = [...new Set(mappedColumns)].map(quoteSelectColumn).join(",") + (useFallback ? "" : ",rank");

  const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
  url.searchParams.set("select", select);
  url.searchParams.set(clean(exam.wilaya_column), `eq.${escapePostgrestValue(filters.wilaya)}`);
  url.searchParams.set(clean(exam.moughataa_column), `eq.${escapePostgrestValue(filters.moughataa)}`);
  url.searchParams.set(clean(exam.centre_column), `eq.${escapePostgrestValue(filters.centre)}`);
  const numberColumn = clean(exam.number_column);
  url.searchParams.set("or", `(${numberValues(filters.number).map((value) => `${numberColumn}.eq.${value}`).join(",")})`);
  if (!useFallback) url.searchParams.set("order", "rank.asc");
  url.searchParams.set("limit", "10");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json", Prefer: "count=none" },
    });
    const text = await response.text();
    if (!response.ok) return { error: text, status: response.status } as const;
    return { rows: text ? JSON.parse(text) : [], status: 200 } as const;
  } catch (error) {
    return { error: error instanceof Error && error.name === "AbortError" ? "Search timeout" : String(error), status: 504 } as const;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = clean(searchParams.get("source"));
  const filters = {
    wilaya: clean(searchParams.get("wilaya")),
    moughataa: clean(searchParams.get("moughataa")),
    centre: clean(searchParams.get("centre")),
    number: clean(searchParams.get("number")),
  };

  if (!source.startsWith("upload:")) return NextResponse.json({ rows: [], error: "Invalid source" }, { status: 400 });
  if (Object.values(filters).some((value) => !value)) return NextResponse.json({ rows: [], error: "All location fields and candidate number are required" }, { status: 400 });

  const exam = await fetchMetadata(source);
  if (!exam || !isSafeIdentifier(exam.table_name) || !isSafeIdentifier(exam.ranked_view)) {
    return NextResponse.json({ rows: [], error: "Active uploaded concours not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (!exam.wilaya_column || !exam.moughataa_column || !exam.centre_column || !exam.number_column) {
    return NextResponse.json({ rows: [], error: "Uploaded concours location mapping is incomplete" }, { status: 422, headers: { "Cache-Control": "no-store" } });
  }

  let result = await queryResults(exam, filters);
  if ("error" in result) result = await queryResults(exam, filters, true);
  if ("error" in result) return NextResponse.json({ rows: [], error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });

  return NextResponse.json({ rows: result.rows }, { headers: { "Cache-Control": "no-store" } });
}
