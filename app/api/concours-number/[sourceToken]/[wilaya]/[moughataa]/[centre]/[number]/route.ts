import { NextResponse } from "next/server";
import { isPublicResultSource } from "../../../../../../../../lib/publishedSourceAccess";
import {
  normalizeCandidateNumber,
  tokenToSource,
} from "../../../../../../../../lib/resultNumberLookup";
import { cachedCentreShard } from "../../../../../../../../lib/resultShardCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400";

function clean(value: string, maxLength = 160) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      sourceToken: string;
      wilaya: string;
      moughataa: string;
      centre: string;
      number: string;
    }>;
  },
) {
  const params = await context.params;
  const source = tokenToSource(params.sourceToken);
  const candidateKey = normalizeCandidateNumber(params.number);
  const wilaya = clean(params.wilaya);
  const moughataa = clean(params.moughataa);
  const centre = clean(params.centre);

  if (!source.startsWith("upload:")) {
    return NextResponse.json(
      { rows: [], error: "Invalid source" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (![candidateKey, wilaya, moughataa, centre].every(Boolean)) {
    return NextResponse.json(
      { rows: [], error: "All location fields and candidate number are required" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!(await isPublicResultSource(source))) {
    return NextResponse.json(
      { rows: [], error: "Result source is not published" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await cachedCentreShard(source, wilaya, moughataa, centre);
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

  return NextResponse.json(
    { rows: result.candidates[candidateKey] || [] },
    {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CACHE_CONTROL,
        "Netlify-CDN-Cache-Control": CACHE_CONTROL,
        "X-Mauri-Search": "CENTRE-SHARD-LOOKUP",
        Vary: "Accept-Encoding",
      },
    },
  );
}
