import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { fetchCentreShard, tokenToSource } from "../../../../../../../lib/resultNumberLookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800";
const SEARCH_CACHE_TAG = "mauriresults-number-search-v1";

function clean(value: string) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, 160);
}

const cachedCentreShard = unstable_cache(
  async (source: string, wilaya: string, moughataa: string, centre: string) =>
    fetchCentreShard(source, wilaya, moughataa, centre),
  ["mauriresults-centre-shard-v1"],
  { revalidate: 86_400, tags: [SEARCH_CACHE_TAG] },
);

function publicHeaders() {
  return {
    "Cache-Control": CACHE_CONTROL,
    "CDN-Cache-Control": CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": CACHE_CONTROL,
    "Netlify-CDN-Cache-Control": CACHE_CONTROL,
    "X-Mauri-Search": "CDN-CENTRE-SHARD",
    Vary: "Accept-Encoding",
  };
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      sourceToken: string;
      wilaya: string;
      moughataa: string;
      centre: string;
    }>;
  },
) {
  const params = await context.params;
  const source = tokenToSource(params.sourceToken);
  const wilaya = clean(params.wilaya);
  const moughataa = clean(params.moughataa);
  const centre = clean(params.centre);

  if (!source.startsWith("upload:") || !wilaya || !moughataa || !centre) {
    return NextResponse.json(
      { candidates: {}, error: "Invalid centre shard" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await cachedCentreShard(source, wilaya, moughataa, centre);
  if ("error" in result) {
    return NextResponse.json(
      { candidates: {}, error: result.error },
      {
        status: result.status,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": result.status >= 500 ? "2" : "1",
        },
      },
    );
  }

  return NextResponse.json(
    { candidates: result.candidates },
    { headers: publicHeaders() },
  );
}
