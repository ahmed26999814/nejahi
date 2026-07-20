import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import {
  candidateShardKey,
  fetchExactNumberResult,
  fetchNumberShard,
  normalizeCandidateNumber,
  tokenToSource,
} from "../../../../../lib/resultNumberLookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800";
const SEARCH_CACHE_TAG = "mauriresults-number-search-v1";

const cachedNumberShard = unstable_cache(
  async (source: string, shard: string) => fetchNumberShard(source, shard),
  ["mauriresults-number-shard-v1"],
  { revalidate: 86_400, tags: [SEARCH_CACHE_TAG] },
);

const cachedLegacyConcoursResult = unstable_cache(
  async (source: string, candidateKey: string) => fetchExactNumberResult(source, candidateKey),
  ["mauriresults-legacy-concours-number-v1"],
  { revalidate: 86_400, tags: [SEARCH_CACHE_TAG] },
);

function publicHeaders() {
  return {
    "Cache-Control": CACHE_CONTROL,
    "CDN-Cache-Control": CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": CACHE_CONTROL,
    "Netlify-CDN-Cache-Control": CACHE_CONTROL,
    "X-Mauri-Search": "NUMBER-LOOKUP-SHARED",
    Vary: "Accept-Encoding",
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ sourceToken: string; number: string }> },
) {
  const { sourceToken, number } = await context.params;
  const source = tokenToSource(sourceToken);
  const candidateKey = normalizeCandidateNumber(number);

  if (!source) {
    return NextResponse.json(
      { rows: [], error: "Unknown source" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!candidateKey) {
    return NextResponse.json(
      { rows: [], error: "Candidate number must contain digits only" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = source === "concours"
    ? await cachedLegacyConcoursResult(source, candidateKey)
    : await cachedNumberShard(source, candidateShardKey(candidateKey));

  if ("error" in result) {
    return NextResponse.json(
      { rows: [], error: result.error },
      {
        status: result.status,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": result.status >= 500 ? "2" : "1",
        },
      },
    );
  }

  const rows = "candidates" in result
    ? result.candidates[candidateKey] || []
    : result.rows;

  return NextResponse.json({ rows }, { headers: publicHeaders() });
}
