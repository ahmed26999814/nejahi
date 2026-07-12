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

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_uploaded_exam_location_options`, {
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
      p_level: level,
      p_wilaya: wilaya || null,
      p_moughataa: moughataa || null,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return NextResponse.json({ options: [], error: text.slice(0, 900) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
  }

  const rows = text ? JSON.parse(text) : [];
  const options = rows.map((row: { value?: unknown }) => clean(row.value)).filter(Boolean);

  return NextResponse.json(
    { options },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
