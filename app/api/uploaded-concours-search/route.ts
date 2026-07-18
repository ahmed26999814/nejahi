import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 3_000;
const CACHE_CONTROL = "public, max-age=120, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800";

function clean(value: unknown, maxLength = 160) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function asciiDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)));
}

function candidateKey(value: string) {
  const digits = asciiDigits(clean(value, 20));
  if (!/^\d{1,20}$/.test(digits)) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function publicPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) => !key.startsWith("__")),
  );
}

async function lookupConcours(source: string, key: string, wilaya: string, moughataa: string, centre: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase service credentials", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/result_number_lookup`);
  url.searchParams.set("select", "payload,rank");
  url.searchParams.set("source_key", `eq.${source}`);
  url.searchParams.set("candidate_key", `eq.${key}`);
  url.searchParams.set("wilaya", `eq.${wilaya}`);
  url.searchParams.set("moughataa", `eq.${moughataa}`);
  url.searchParams.set("centre", `eq.${centre}`);
  url.searchParams.set("order", "rank.asc.nullslast");
  url.searchParams.set("limit", "20");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
      },
    });

    const text = await response.text();
    if (!response.ok) return { error: text.slice(0, 700), status: response.status } as const;

    const entries = text ? JSON.parse(text) : [];
    const rows = (Array.isArray(entries) ? entries : [])
      .map((entry) => {
        const payload = publicPayload(entry?.payload);
        if (!payload) return null;
        return payload.rank == null && entry?.rank != null
          ? { ...payload, rank: entry.rank }
          : payload;
      })
      .filter(Boolean);

    return { rows, status: 200 } as const;
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      error: timedOut ? "Search timeout" : "Search unavailable",
      status: timedOut ? 504 : 503,
    } as const;
  }
}

const cachedConcoursLookup = unstable_cache(
  async (source: string, key: string, wilaya: string, moughataa: string, centre: string) =>
    lookupConcours(source, key, wilaya, moughataa, centre),
  ["mauriresults-concours-number-search-v1"],
  { revalidate: 86_400, tags: ["mauriresults-number-search-v1"] },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = clean(searchParams.get("source"), 80);
  const wilaya = clean(searchParams.get("wilaya"));
  const moughataa = clean(searchParams.get("moughataa"));
  const centre = clean(searchParams.get("centre"));
  const key = candidateKey(clean(searchParams.get("number"), 20));

  if (!/^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(source)) {
    return NextResponse.json({ rows: [], error: "Invalid source" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (![wilaya, moughataa, centre, key].every(Boolean)) {
    return NextResponse.json(
      { rows: [], error: "All location fields and candidate number are required" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await cachedConcoursLookup(source, key, wilaya, moughataa, centre);
  if ("error" in result) {
    return NextResponse.json(
      { rows: [], error: result.error },
      {
        status: result.status,
        headers: { "Cache-Control": "no-store", "Retry-After": result.status >= 500 ? "2" : "1" },
      },
    );
  }

  return NextResponse.json(
    { rows: result.rows },
    {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CACHE_CONTROL,
        "X-Mauri-Search": "NUMBER-LOOKUP",
        Vary: "Accept-Encoding",
      },
    },
  );
}
