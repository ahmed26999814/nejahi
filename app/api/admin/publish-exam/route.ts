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

function rankedViewName(tableName: string) {
  return tableName.replace(/_results$/, "") + "_ranked_results";
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
    description_ar: safeText(body.descriptionAr, "نتائج منشورة من لوحة الأدمن."),
    description_fr: safeText(body.descriptionFr, "Résultats publiés depuis l'administration."),
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
    ranked_view: rankedViewName(tableName),
    total_rows: Number(body.totalRows || 0) || 0,
    is_active: true,
  };

  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("on_conflict", "table_name");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(row),
  });

  const text = await response.text();
  if (!response.ok) {
    return json(response.status, { ok: false, error: text.replace(/\s+/g, " ").slice(0, 700) });
  }

  return json(200, { ok: true, exam: text ? JSON.parse(text)?.[0] : row });
}
