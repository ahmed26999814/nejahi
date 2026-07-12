import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function isAdminPlaceholder(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  return (
    (text.includes("منشورة") && (text.includes("الأدمن") || text.includes("الادمن") || text.includes("admin"))) ||
    (text.includes("publi") && text.includes("administr"))
  );
}

function cleanExam(exam: Record<string, unknown>) {
  const descriptionAr = String(exam.description_ar || "").trim();
  const descriptionFr = String(exam.description_fr || "").trim();
  const uploaded = String(exam.source_key || "").startsWith("upload:");

  return {
    ...exam,
    description_ar: uploaded || isAdminPlaceholder(descriptionAr) ? "" : descriptionAr,
    description_fr: uploaded || isAdminPlaceholder(descriptionFr) ? "" : descriptionFr,
  };
}

async function fetchPublishedExams() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { rows: [], error: "Missing Supabase environment variables", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "source_key,table_name,title_ar,title_fr,description_ar,description_fr,year,tone,search_mode,number_column,name_column,score_column,decision_column,track_column,wilaya_column,moughataa_column,school_column,centre_column,birth_place_column,birth_date_column,ranked_view,total_rows,created_at");
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "30");

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      Prefer: "count=none",
    },
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) return { rows: [], error: text, status: response.status } as const;
  const rows = text ? JSON.parse(text) : [];
  const existingRows = await Promise.all(rows.map(async (exam: Record<string, unknown>) => {
    const tableName = String(exam.table_name || "").trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(tableName)) return null;
    const tableUrl = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
    tableUrl.searchParams.set("select", "*");
    tableUrl.searchParams.set("limit", "1");
    const tableResponse = await fetch(tableUrl, {
      cache: "no-store",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
      },
    });
    return tableResponse.ok ? cleanExam(exam) : null;
  }));

  return { rows: existingRows.filter(Boolean), status: 200 } as const;
}

export async function GET() {
  const result = await fetchPublishedExams();
  if ("error" in result && result.error) {
    return NextResponse.json({ exams: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { exams: result.rows },
    { headers: { "Cache-Control": "no-store" } }
  );
}
