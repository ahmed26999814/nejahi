import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 5_000;
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400";

function clean(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, 160);
}

async function rpcOptions(rpc: string, body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase environment variables");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
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
  if (!response.ok) throw new Error(text.slice(0, 900) || `HTTP ${response.status}`);
  const rows = text ? JSON.parse(text) : [];
  return rows.map((row: { value?: unknown }) => clean(row.value)).filter(Boolean);
}

const cachedOptions = unstable_cache(
  async (source: string, level: string, wilaya: string, moughataa: string) => {
    if (source === "concours_2026" || source === "concours") {
      return rpcOptions("get_concours_2026_location_options", {
        p_level: level,
        p_wilaya: wilaya || null,
        p_moughataa: moughataa || null,
      });
    }
    return rpcOptions("get_uploaded_exam_location_options", {
      p_source_key: source,
      p_level: level,
      p_wilaya: wilaya || null,
      p_moughataa: moughataa || null,
    });
  },
  ["mauriresults-concours-location-options-v2"],
  { revalidate: 3600 }
);

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ options: [], error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const source = clean(searchParams.get("source"));
  const level = clean(searchParams.get("level"));
  const wilaya = clean(searchParams.get("wilaya"));
  const moughataa = clean(searchParams.get("moughataa"));

  if (!["wilaya", "moughataa", "centre"].includes(level)) {
    return NextResponse.json({ options: [], error: "Invalid level" }, { status: 400 });
  }
  if (!(source === "concours_2026" || source === "concours" || source.startsWith("upload:"))) {
    return NextResponse.json({ options: [], error: "Invalid source" }, { status: 400 });
  }

  try {
    const options = await cachedOptions(source, level, wilaya, moughataa);
    return NextResponse.json(
      { options },
      { headers: { "Cache-Control": CACHE_CONTROL, "CDN-Cache-Control": CACHE_CONTROL, "Vercel-CDN-Cache-Control": CACHE_CONTROL } }
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { options: [], error: timedOut ? "Location options timeout" : "Location options unavailable" },
      { status: timedOut ? 504 : 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } }
    );
  }
}
