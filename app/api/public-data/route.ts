import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 8_000;
const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=86400";

const RESOURCE_LIMITS: Record<string, number> = {
  site_content: 1000,
  bac_stats: 1,
  bac_region_stats: 100,
  bac_school_stats: 100,
  bac_track_stats: 100,
  bac_top_students: 100,
  brevet_stats: 1,
  brevet_region_stats: 100,
  brevet_school_stats: 100,
  brevet_top_students: 100,
  concours_stats: 1,
  concours_region_stats: 100,
  concours_moughataa_stats: 100,
  concours_school_stats: 100,
  concours_top_students: 100,
  excellence_1as_stats: 1,
  excellence_1as_region_stats: 100,
  excellence_1as_top_students: 100,
  bac_session2_stats: 1,
  bac_session2_region_stats: 100,
  bac_session2_track_stats: 100,
  bac_session2_top_students: 100,
};

function selectFor(resource: string) {
  return resource === "site_content"
    ? "content_key,title,value,type,storage_path,updated_at"
    : "*";
}

async function fetchResource(resource: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  const limit = RESOURCE_LIMITS[resource];
  if (!limit) throw new Error("Unsupported public resource");

  const url = new URL(`${SUPABASE_URL}/rest/v1/${resource}`);
  url.searchParams.set("select", selectFor(resource));
  url.searchParams.set("limit", String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
      },
    });

    const text = await response.text();
    if (!response.ok) throw new Error(text || `Supabase returned ${response.status}`);
    return text ? JSON.parse(text) : [];
  } finally {
    clearTimeout(timeout);
  }
}

const cachedResource = unstable_cache(
  async (resource: string) => fetchResource(resource),
  ["mauriresults-public-data-v1"],
  { revalidate: 300 }
);

export async function GET(request: Request) {
  const resource = String(new URL(request.url).searchParams.get("resource") || "").trim();
  if (!RESOURCE_LIMITS[resource]) {
    return NextResponse.json({ error: "Unsupported public resource" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const rows = await cachedResource(resource);
    return NextResponse.json(rows, {
      headers: {
        "Cache-Control": PUBLIC_CACHE,
        "CDN-Cache-Control": PUBLIC_CACHE,
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: timeout ? "Public data timeout" : "Public data unavailable" },
      { status: timeout ? 504 : 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
