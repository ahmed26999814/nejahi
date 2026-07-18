import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 5_000;
const OPTIONS_CACHE = "public, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400";

function clean(value: unknown, maxLength = 160) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

async function rpc(name: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase variables");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      apikey: SUPABASE_KEY,
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

function isAllowedSource(source: string) {
  return ["bac", "brevet", "bac_session", "excellence_1as"].includes(source)
    || /^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(source);
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing Supabase variables" }, { status: 500 });
  }

  const params = new URL(request.url).searchParams;
  const source = clean(params.get("source"), 80);
  const mode = clean(params.get("mode"), 20);
  const level = clean(params.get("level"), 20);
  const track = clean(params.get("track"));
  const wilaya = clean(params.get("wilaya"));
  const centre = clean(params.get("centre"));
  const school = clean(params.get("school"));

  if (!isAllowedSource(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    if (mode === "options") {
      if (!["track", "wilaya", "centre", "school"].includes(level)) {
        return NextResponse.json({ error: "Invalid level" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      }

      const rows = await rpc("get_exam_filter_options", {
        p_source_key: source,
        p_level: level,
        p_track: track || null,
        p_wilaya: wilaya || null,
        p_centre: centre || null,
      });

      return NextResponse.json(
        { options: Array.isArray(rows) ? rows : [] },
        { headers: { "Cache-Control": OPTIONS_CACHE, "CDN-Cache-Control": OPTIONS_CACHE, "Vercel-CDN-Cache-Control": OPTIONS_CACHE } },
      );
    }

    if (!centre && !school) {
      return NextResponse.json(
        { candidates: [], error: "Choose a centre or school before loading candidates" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rows = await rpc("find_exam_candidates_by_filters", {
      p_source_key: source,
      p_track: track || null,
      p_wilaya: wilaya || null,
      p_centre: centre || null,
      p_school: school || null,
      p_name: null,
    });

    return NextResponse.json(
      { candidates: Array.isArray(rows) ? rows.slice(0, 250) : [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { error: timedOut ? "Candidate lookup timeout" : "Candidate lookup unavailable" },
      { status: timedOut ? 504 : 503, headers: { "Cache-Control": "no-store", "Retry-After": "3" } },
    );
  }
}
