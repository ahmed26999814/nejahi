import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;
export const preferredRegion = ["cdg1"];

const SITE_URL = "https://mauri-results.vercel.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 3_000;
const MAX_QUERY_LENGTH = 20;
const REQUIRED_APP_VERSION = "3.0.0";
const CACHE_CONTROL = "public, max-age=120, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800";
const SEARCH_CACHE_TAG = "mauriresults-number-search-v1";

const SOURCE_ALIASES: Record<string, string> = {
  bac_2026: "bac",
  brevet_2026: "brevet",
  concours_2026: "concours",
  bac_session_2026: "bac_session",
  excellence_1as_2026: "excellence_1as",
};

const BUILTIN_SOURCES = new Set([
  "bac",
  "brevet",
  "concours",
  "bac_session",
  "excellence_1as",
]);

function asciiDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)));
}

function normalizeCandidateNumber(value: string) {
  const digits = asciiDigits(String(value || "").trim()).slice(0, MAX_QUERY_LENGTH);
  if (!/^\d{1,20}$/.test(digits)) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function normalizeSource(value: string) {
  const source = String(value || "").trim();
  const canonical = SOURCE_ALIASES[source] || source;
  if (BUILTIN_SOURCES.has(canonical)) return canonical;
  return /^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(canonical) ? canonical : "";
}

function publicPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) => !key.startsWith("__")),
  );
}

async function fetchNumberResult(source: string, candidateKey: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase service credentials", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/result_number_lookup`);
  url.searchParams.set("select", "payload,rank");
  url.searchParams.set("source_key", `eq.${source}`);
  url.searchParams.set("candidate_key", `eq.${candidateKey}`);
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

const cachedNumberResult = unstable_cache(
  async (source: string, candidateKey: string) => fetchNumberResult(source, candidateKey),
  ["mauriresults-number-search-v1"],
  { revalidate: 86_400, tags: [SEARCH_CACHE_TAG] },
);

function responseHeaders() {
  return {
    "Cache-Control": CACHE_CONTROL,
    "CDN-Cache-Control": CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": CACHE_CONTROL,
    "X-Mauri-Search": "NUMBER-LOOKUP",
    Vary: "Accept-Encoding",
  };
}

function isLegacyNativeRequest(request: Request) {
  if (request.headers.get("x-mauriresults-client") === "flutter-native") return false;
  const userAgent = String(request.headers.get("user-agent") || "").toLowerCase();
  return userAgent.includes("okhttp")
    || userAgent.includes("expo")
    || userAgent.includes("reactnative")
    || userAgent.includes("react-native");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceInput = String(searchParams.get("source") || "").trim();

  if (sourceInput === "update_required_v3") {
    return NextResponse.json(
      {
        rows: [{
          Numero: "3.0.0",
          NOM: "هذا الإصدار متوقف — نزّل التحديث الجديد",
          MOD: "3.0.0",
          KR: `افتح ${SITE_URL.replace("https://", "")}/Apk ونزّل النسخة الجديدة`,
          WL: "تحديث إجباري",
          MS: "MauriResults",
          MD: "لا يمكن متابعة النسخة القديمة",
        }],
        updateRequired: true,
        minimumSupportedVersion: REQUIRED_APP_VERSION,
        downloadUrl: `${SITE_URL}/Apk/`,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (isLegacyNativeRequest(request)) {
    return NextResponse.json(
      {
        rows: [],
        error: "هذا الإصدار متوقف. نزّل تحديث MauriResults الجديد 3.0.0.",
        updateRequired: true,
        minimumSupportedVersion: REQUIRED_APP_VERSION,
        downloadUrl: `${SITE_URL}/Apk/`,
      },
      { status: 426, headers: { "Cache-Control": "no-store" } },
    );
  }

  const source = normalizeSource(sourceInput);
  if (!source) {
    return NextResponse.json(
      { rows: [], error: "Unknown source" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const candidateKey = normalizeCandidateNumber(String(searchParams.get("q") || ""));
  if (!candidateKey) {
    return NextResponse.json(
      { rows: [], error: "Candidate number must contain digits only" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await cachedNumberResult(source, candidateKey);
  if ("error" in result) {
    return NextResponse.json(
      { rows: [], error: result.error },
      {
        status: result.status,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": result.status === 504 || result.status === 503 ? "2" : "1",
        },
      },
    );
  }

  return NextResponse.json({ rows: result.rows }, { headers: responseHeaders() });
}
