import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 3_000;

const BUILTIN_SOURCES = new Set([
  "bac",
  "brevet",
  "concours",
  "bac_session",
  "excellence_1as",
]);

export type NumberLookupResult =
  | { rows: Array<Record<string, unknown>>; status: 200 }
  | { error: string; status: number };

export function asciiDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)));
}

export function normalizeCandidateNumber(value: string) {
  const digits = asciiDigits(String(value || "").trim()).slice(0, 20);
  if (!/^\d{1,20}$/.test(digits)) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

export function normalizeSource(value: string) {
  const source = String(value || "").trim();
  if (BUILTIN_SOURCES.has(source)) return source;
  return /^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(source) ? source : "";
}

export function sourceToToken(source: string) {
  const normalized = normalizeSource(source);
  if (!normalized) return "";
  return normalized.startsWith("upload:")
    ? `upload--${normalized.slice("upload:".length)}`
    : normalized;
}

export function tokenToSource(token: string) {
  const value = String(token || "").trim();
  if (BUILTIN_SOURCES.has(value)) return value;
  if (/^upload--[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(value)) {
    return `upload:${value.slice("upload--".length)}`;
  }
  return "";
}

function publicPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) => !key.startsWith("__")),
  );
}

function rowsFromEntries(entries: unknown) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const payload = publicPayload(entry?.payload);
      if (!payload) return null;
      return payload.rank == null && entry?.rank != null
        ? { ...payload, rank: entry.rank }
        : payload;
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

async function requestLookup(url: URL): Promise<NumberLookupResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase service credentials", status: 500 };
  }

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
    if (!response.ok) {
      return { error: text.slice(0, 700) || `HTTP ${response.status}`, status: response.status };
    }

    return { rows: rowsFromEntries(text ? JSON.parse(text) : []), status: 200 };
  } catch (error) {
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      error: timedOut ? "Search timeout" : "Search unavailable",
      status: timedOut ? 504 : 503,
    };
  }
}

export async function fetchExactNumberResult(source: string, candidateKey: string) {
  if (!SUPABASE_URL) return { error: "Missing Supabase URL", status: 500 } as const;
  const url = new URL(`${SUPABASE_URL}/rest/v1/result_number_lookup`);
  url.searchParams.set("select", "payload,rank");
  url.searchParams.set("source_key", `eq.${source}`);
  url.searchParams.set("candidate_key", `eq.${candidateKey}`);
  url.searchParams.set("order", "rank.asc.nullslast");
  url.searchParams.set("limit", "20");
  return requestLookup(url);
}

export async function fetchExactConcoursResult(
  source: string,
  candidateKey: string,
  wilaya: string,
  moughataa: string,
  centre: string,
) {
  if (!SUPABASE_URL) return { error: "Missing Supabase URL", status: 500 } as const;
  const url = new URL(`${SUPABASE_URL}/rest/v1/result_number_lookup`);
  url.searchParams.set("select", "payload,rank");
  url.searchParams.set("source_key", `eq.${source}`);
  url.searchParams.set("candidate_key", `eq.${candidateKey}`);
  url.searchParams.set("wilaya", `eq.${wilaya}`);
  url.searchParams.set("moughataa", `eq.${moughataa}`);
  url.searchParams.set("centre", `eq.${centre}`);
  url.searchParams.set("order", "rank.asc.nullslast");
  url.searchParams.set("limit", "20");
  return requestLookup(url);
}
