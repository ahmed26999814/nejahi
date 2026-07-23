import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_KEY = "upload:results_bac_2026";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400";

async function fetchAverageFrequency() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase server environment variables");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_exam_average_frequency`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_source_key: SOURCE_KEY,
      p_include_inactive: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);

  const rows = text ? JSON.parse(text) : [];
  return Array.isArray(rows) ? rows : [];
}

const getCachedAverageFrequency = unstable_cache(
  fetchAverageFrequency,
  ["mauriresults-bac-2026-average-frequency-v1"],
  { revalidate: 300 },
);

export async function GET() {
  try {
    const rows = await getCachedAverageFrequency();
    return NextResponse.json(
      { source: SOURCE_KEY, rows },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
          "CDN-Cache-Control": CACHE_CONTROL,
          "Vercel-CDN-Cache-Control": CACHE_CONTROL,
          Vary: "Accept-Encoding",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "تعذر تحميل تكرار المعدلات مؤقتًا" },
      {
        status: 503,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-if-error=300",
          "Retry-After": "30",
        },
      },
    );
  }
}
