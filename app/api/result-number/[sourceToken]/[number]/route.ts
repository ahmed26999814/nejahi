import { NextResponse } from "next/server";
import { isPublicResultSource } from "../../../../../lib/publishedSourceAccess";
import {
  candidateShardKey,
  normalizeCandidateNumber,
  tokenToSource,
} from "../../../../../lib/resultNumberLookup";
import {
  cachedLegacyConcoursResult,
  cachedNumberShard,
} from "../../../../../lib/resultShardCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400";

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

  if (!(await isPublicResultSource(source))) {
    return NextResponse.json(
      { rows: [], error: "Result source is not published" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
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
