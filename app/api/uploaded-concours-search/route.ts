import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function clean(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ rows: [], error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const source = clean(searchParams.get("source"));
  const wilaya = clean(searchParams.get("wilaya"));
  const moughataa = clean(searchParams.get("moughataa"));
  const centre = clean(searchParams.get("centre"));
  const number = clean(searchParams.get("number"));

  if (!source.startsWith("upload:")) {
    return NextResponse.json({ rows: [], error: "Invalid source" }, { status: 400 });
  }
  if (![wilaya, moughataa, centre, number].every(Boolean)) {
    return NextResponse.json({ rows: [], error: "All location fields and candidate number are required" }, { status: 400 });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_uploaded_exam_rows`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      p_source_key: source,
      p_query: number,
      p_wilaya: wilaya,
      p_moughataa: moughataa,
      p_centre: centre,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return NextResponse.json({ rows: [], error: text.slice(0, 900) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { rows: text ? JSON.parse(text) : [] },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } }
  );
}
