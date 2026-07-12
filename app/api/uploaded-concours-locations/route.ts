import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function clean(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

function isSafeIdentifier(value: unknown) {
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(clean(value));
}

function quoteColumn(value: unknown) {
  const column = clean(value);
  return `"${column.replaceAll('"', '""')}"`;
}

function escapeValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)");
}

async function fetchMetadata(source: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "table_name,source_key,search_mode,wilaya_column,moughataa_column,centre_column");
  url.searchParams.set("source_key", `eq.${escapeValue(source)}`);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("search_mode", "eq.concours");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
  });
  if (!response.ok) return null;
  return (await response.json())?.[0] || null;
}

function uniqueSorted(rows: Record<string, unknown>[], column: string) {
  return [...new Set(rows.map((row) => clean(row[column])).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ar"));
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ options: [], error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const source = clean(searchParams.get("source"));
  const level = clean(searchParams.get("level"));
  const wilaya = clean(searchParams.get("wilaya"));
  const moughataa = clean(searchParams.get("moughataa"));

  if (!source.startsWith("upload:")) {
    return NextResponse.json({ options: [], error: "Invalid source" }, { status: 400 });
  }
  if (!["wilaya", "moughataa", "centre"].includes(level)) {
    return NextResponse.json({ options: [], error: "Invalid level" }, { status: 400 });
  }

  const exam = await fetchMetadata(source);
  if (!exam || !isSafeIdentifier(exam.table_name)) {
    return NextResponse.json({ options: [], error: "Active uploaded concours not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const wilayaColumn = clean(exam.wilaya_column);
  const moughataaColumn = clean(exam.moughataa_column);
  const centreColumn = clean(exam.centre_column);
  if (!wilayaColumn || !moughataaColumn || !centreColumn) {
    return NextResponse.json({ options: [], error: "Uploaded concours location mapping is incomplete" }, { status: 422, headers: { "Cache-Control": "no-store" } });
  }

  const targetColumn = level === "wilaya" ? wilayaColumn : level === "moughataa" ? moughataaColumn : centreColumn;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${exam.table_name}`);
  url.searchParams.set("select", quoteColumn(targetColumn));
  if (level !== "wilaya") url.searchParams.set(wilayaColumn, `eq.${escapeValue(wilaya)}`);
  if (level === "centre") url.searchParams.set(moughataaColumn, `eq.${escapeValue(moughataa)}`);
  url.searchParams.set("limit", "5000");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json", Prefer: "count=none" },
  });
  const text = await response.text();
  if (!response.ok) {
    return NextResponse.json({ options: [], error: text.slice(0, 600) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
  }

  const rows = text ? JSON.parse(text) : [];
  return NextResponse.json({ options: uniqueSorted(rows, targetColumn) }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
}
