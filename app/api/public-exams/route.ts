import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  });

  const text = await response.text();
  if (!response.ok) return { rows: [], error: text, status: response.status } as const;
  return { rows: text ? JSON.parse(text) : [], status: 200 } as const;
}

export async function GET() {
  const result = await fetchPublishedExams();
  if ("error" in result && result.error) {
    return NextResponse.json({ exams: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { exams: result.rows },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } }
  );
}
