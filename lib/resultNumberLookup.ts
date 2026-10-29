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
type JsonRequestResult =
  | { data: unknown; status: 200 }
  | { error: string; status: number };

export type NumberLookupResult =
  | { rows: PublicRow[]; status: 200 }
  | { error: string; status: number };

export type ShardLookupResult =
  | { candidates: Record<string, PublicRow[]>; status: 200 }
  | { error: string; status: number };

export { asciiCandidateDigits as asciiDigits } from "./candidateNumber";
import { normalizeCandidateNumber } from "./candidateNumber";
export { normalizeCandidateNumber };

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

function requestError(error: unknown): JsonRequestResult {
  const timedOut = error instanceof Error
    && (error.name === "TimeoutError" || error.name === "AbortError");
  return {
    error: timedOut ? "Search timeout" : "Search unavailable",
    status: timedOut ? 504 : 503,
  };
}

async function requestJson(url: URL, options: RequestInit = {}): Promise<JsonRequestResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase service credentials", status: 500 };
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
      return { error: text.slice(0, 700) || `HTTP ${response.status}`, status: response.status };
    }
    return { data: text ? JSON.parse(text) : [], status: 200 };
  } catch (error) {
    return requestError(error);
  }
}

async function requestShard(rpcName: string, body: Record<string, string>): Promise<ShardLookupResult> {
  if (!SUPABASE_URL) return { error: "Missing Supabase URL", status: 500 };
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${rpcName}`);
  const result = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if ("error" in result) return { error: result.error, status: result.status };
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

// Direct search from original results tables; no duplicated 803 MB lookup required.
async function requestDirectLookup(
  source: string,
  candidateKey: string,
  location?: { wilaya: string; moughataa: string; centre: string },
): Promise<NumberLookupResult> {
  if (!SUPABASE_URL) return { error: "Missing Supabase URL", status: 500 };
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/lookup_source_results`);
  const result = await requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      p_source_key: source,
      p_candidate_key: candidateKey,
      p_wilaya: location?.wilaya || null,
      p_moughataa: location?.moughataa || null,
      p_centre: location?.centre || null,
      p_limit: 20,
    }),
  });
  if ("error" in result) return { error: result.error, status: result.status };
  return { rows: rowsFromEntries(result.data), status: 200 };
}

export async function fetchExactNumberResult(source: string, candidateKey: string) {
  return requestDirectLookup(source, candidateKey);
}

export async function fetchExactConcoursResult(
  source: string,
  candidateKey: string,
  wilaya: string,
  moughataa: string,
  centre: string,
) {
  return requestDirectLookup(source, candidateKey, { wilaya, moughataa, centre });
}
