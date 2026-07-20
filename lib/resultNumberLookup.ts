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

type LookupEntry = {
  candidate_key?: unknown;
  payload?: unknown;
  rank?: unknown;
};

type PublicRow = Record<string, unknown>;

export type NumberLookupResult =
  | { rows: PublicRow[]; status: 200 }
  | { error: string; status: number };

export type ShardLookupResult =
  | { candidates: Record<string, PublicRow[]>; status: 200 }
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

export function candidateShardKey(candidateKey: string) {
  const normalized = normalizeCandidateNumber(candidateKey);
  return normalized ? normalized.padStart(3, "0").slice(-3) : "";
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
    Object.entries(value as PublicRow).filter(([key]) => !key.startsWith("__")),
  );
}

function publicRow(entry: LookupEntry) {
  const payload = publicPayload(entry.payload);
  if (!payload) return null;
  const rank = Number(entry.rank);
  return payload.rank == null && Number.isFinite(rank) && rank > 0
    ? { ...payload, rank }
    : payload;
}

function rowsFromEntries(entries: unknown) {
  return (Array.isArray(entries) ? entries : [])
    .map((rawEntry) => publicRow(rawEntry as LookupEntry))
    .filter(Boolean) as PublicRow[];
}

function candidatesFromEntries(entries: unknown) {
  const candidates: Record<string, PublicRow[]> = Object.create(null);
  for (const rawEntry of Array.isArray(entries) ? entries : []) {
    const entry = rawEntry as LookupEntry;
    const candidateKey = normalizeCandidateNumber(String(entry.candidate_key || ""));
    const row = publicRow(entry);
    if (!candidateKey || !row) continue;
    (candidates[candidateKey] ||= []).push(row);
  }
  return candidates;
}

function requestError(error: unknown) {
  const timedOut = error instanceof Error
    && (error.name === "TimeoutError" || error.name === "AbortError");
  return {
    error: timedOut ? "Search timeout" : "Search unavailable",
    status: timedOut ? 504 : 503,
  } as const;
}

async function requestJson(url: URL, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase service credentials", status: 500 } as const;
  }

  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    if (!response.ok) {
      return { error: text.slice(0, 700) || `HTTP ${response.status}`, status: response.status } as const;
    }
    return { data: text ? JSON.parse(text) : [], status: 200 } as const;
  } catch (error) {
    return requestError(error);
  }
}

async function requestLookup(url: URL): Promise<NumberLookupResult> {
  const result = await requestJson(url);
  if ("error" in result) return result;
  return { rows: rowsFromEntries(result.data), status: 200 };
}

async function requestShard(rpcName: string, body: Record<string, string>): Promise<ShardLookupResult> {
  if (!SUPABASE_URL) return { error: "Missing Supabase URL", status: 500 };
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`);
  const result = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if ("error" in result) return result;
  return { candidates: candidatesFromEntries(result.data), status: 200 };
}

export async function fetchNumberShard(source: string, shardKey: string) {
  const normalizedSource = normalizeSource(source);
  if (!normalizedSource || normalizedSource === "concours" || !/^\d{3}$/.test(shardKey)) {
    return { error: "Invalid result shard", status: 400 } as const;
  }
  return requestShard("get_result_number_shard", {
    p_source_key: normalizedSource,
    p_shard_key: shardKey,
  });
}

export async function fetchCentreShard(
  source: string,
  wilaya: string,
  moughataa: string,
  centre: string,
) {
  const normalizedSource = normalizeSource(source);
  if (!normalizedSource.startsWith("upload:")) {
    return { error: "Invalid concours source", status: 400 } as const;
  }
  if (![wilaya, moughataa, centre].every((value) => String(value || "").trim())) {
    return { error: "Missing concours location", status: 400 } as const;
  }
  return requestShard("get_result_centre_shard", {
    p_source_key: normalizedSource,
    p_wilaya: String(wilaya).trim().slice(0, 160),
    p_moughataa: String(moughataa).trim().slice(0, 160),
    p_centre: String(centre).trim().slice(0, 160),
  });
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
