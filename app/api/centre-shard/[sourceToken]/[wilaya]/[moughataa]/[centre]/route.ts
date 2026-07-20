import { NextResponse } from "next/server";
import { tokenToSource } from "../../../../../../../lib/resultNumberLookup";
import { cachedCentreShard } from "../../../../../../../lib/resultShardCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400";

function clean(value: string) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, 160);
}

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
