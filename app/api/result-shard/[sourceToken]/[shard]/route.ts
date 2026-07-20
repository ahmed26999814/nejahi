import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { fetchNumberShard, tokenToSource } from "../../../../../lib/resultNumberLookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400";
const SEARCH_CACHE_TAG = "mauriresults-number-search-v1";

const cachedNumberShard = unstable_cache(
  async (source: string, shard: string) => fetchNumberShard(source, shard),
  ["mauriresults-number-shard-v1"],
  { revalidate: 300, tags: [SEARCH_CACHE_TAG] },
);

function publicHeaders() {
  return {
    "Cache-Control": CACHE_CONTROL,
    "CDN-Cache-Control": CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": CACHE_CONTROL,
    "Netlify-CDN-Cache-Control": CACHE_CONTROL,
    "X-Mauri-Search": "CDN-NUMBER-SHARD",
    Vary: "Accept-Encoding",
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ sourceToken: string; shard: string }> },
) {
  const { sourceToken, shard } = await context.params;
  const source = tokenToSource(sourceToken);
  const shardKey = String(shard || "").trim();

  if (!source || source === "concours" || !/^\d{3}$/.test(shardKey)) {
    return NextResponse.json(
      { candidates: {}, error: "Invalid result shard" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await cachedNumberShard(source, shardKey);
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
