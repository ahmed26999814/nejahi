import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Keep uploaded-card descriptions visually empty without triggering the old
// frontend fallback sentence.
const EMPTY_PUBLIC_DESCRIPTION = "\u200B";
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=3600";

function isAdminPlaceholder(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  return (
    (text.includes("منشورة") && (text.includes("الأدمن") || text.includes("الادمن") || text.includes("admin"))) ||
    (text.includes("publi") && text.includes("administr"))
  );
}

function yearNumber(value: unknown) {
  const matched = String(value || "").match(/20\d{2}/)?.[0];
  return matched ? Number(matched) : 0;
}

function cleanExam(exam: Record<string, unknown>) {
  const descriptionAr = String(exam.description_ar || "").trim();
  const descriptionFr = String(exam.description_fr || "").trim();
  const uploaded = String(exam.source_key || "").startsWith("upload:");

  return {
    ...exam,
    description_ar: uploaded || isAdminPlaceholder(descriptionAr) ? EMPTY_PUBLIC_DESCRIPTION : descriptionAr,
    description_fr: uploaded || isAdminPlaceholder(descriptionFr) ? EMPTY_PUBLIC_DESCRIPTION : descriptionFr,
  };
}

async function fetchPublishedExams() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { rows: [], error: "Missing Supabase environment variables", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "source_key,table_name,title_ar,title_fr,description_ar,description_fr,year,tone,search_mode,number_column,name_column,score_column,decision_column,track_column,wilaya_column,moughataa_column,school_column,centre_column,birth_place_column,birth_date_column,ranked_view,total_rows,created_at");
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("limit", "100");

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      Prefer: "count=none",
    },
    next: { revalidate: 60 },
  });

  const text = await response.text();
  if (!response.ok) return { rows: [], error: text, status: response.status } as const;

  const rows = (text ? JSON.parse(text) : [])
    .filter((exam: Record<string, unknown>) => /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(String(exam.table_name || "").trim()))
    .map(cleanExam)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const byYear = yearNumber(b.year) - yearNumber(a.year);
      if (byYear) return byYear;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });

  return { rows, status: 200 } as const;
}

export async function GET() {
  const result = await fetchPublishedExams();
  if ("error" in result && result.error) {
    return NextResponse.json(
      { exams: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { exams: result.rows },
    { headers: { "Cache-Control": PUBLIC_CACHE } }
  );
}
