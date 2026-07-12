import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function clean(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text.slice(0, 700));
  return text ? JSON.parse(text) : [];
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing Supabase variables" }, { status: 500 });
  }

  const params = new URL(request.url).searchParams;
  const source = clean(params.get("source"));
  const mode = clean(params.get("mode"));
  const level = clean(params.get("level"));
  const track = clean(params.get("track"));
  const wilaya = clean(params.get("wilaya"));
  const centre = clean(params.get("centre"));
  const school = clean(params.get("school"));
  const name = clean(params.get("name"));

  if (!source) return NextResponse.json({ error: "Missing source" }, { status: 400 });

  try {
    if (mode === "options") {
      if (!["track", "wilaya", "centre", "school"].includes(level)) {
        return NextResponse.json({ error: "Invalid level" }, { status: 400 });
      }
      const rows = await rpc("get_exam_filter_options", {
        p_source_key: source,
        p_level: level,
        p_track: track || null,
        p_wilaya: wilaya || null,
        p_centre: centre || null,
      });
      return NextResponse.json({ options: rows }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } });
    }

    const rows = await rpc("find_exam_candidates_by_filters", {
      p_source_key: source,
      p_track: track || null,
      p_wilaya: wilaya || null,
      p_centre: centre || null,
      p_school: school || null,
      p_name: name || null,
    });
    return NextResponse.json({ candidates: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
