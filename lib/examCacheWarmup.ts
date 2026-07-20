import "server-only";

import { cachedCentreShard, cachedNumberShard } from "./resultShardCache";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MANIFEST_TIMEOUT_MS = 20_000;
const DEFAULT_WARMUP_BUDGET_MS = 180_000;
const MAX_RETRY_PASSES = 3;

type CentrePath = {
  wilaya: string;
  moughataa: string;
  centre: string;
};

type WarmItem<T> = {
  id: string;
  value: T;
};

export type ExamCacheWarmupResult = {
  ok: boolean;
  mode: "number-shards" | "centre-shards";
  total: number;
  warmed: number;
  failed: number;
  attempts: number;
  elapsedMs: number;
  timedOut: boolean;
  failedSamples: string[];
};

function clean(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, 160);
}

function isSuccessful(result: unknown) {
  return Boolean(result && typeof result === "object" && !("error" in result));
}

async function listCentrePaths(source: string): Promise<CentrePath[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase service credentials for cache warmup");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_result_centre_shards`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_source_key: source }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Centre cache manifest failed: ${text.slice(0, 700)}`);
  }

  const rows = text ? JSON.parse(text) : [];
  const unique = new Map<string, CentrePath>();
  for (const row of Array.isArray(rows) ? rows : []) {
    const path = {
      wilaya: clean(row?.wilaya),
      moughataa: clean(row?.moughataa),
      centre: clean(row?.centre),
    };
    if (!path.wilaya || !path.moughataa || !path.centre) continue;
    const id = `${path.wilaya}\u001f${path.moughataa}\u001f${path.centre}`;
    unique.set(id, path);
  }
  return [...unique.values()];
}

async function warmItems<T>(
  items: WarmItem<T>[],
  loader: (value: T) => Promise<unknown>,
  batchSize: number,
  mode: ExamCacheWarmupResult["mode"],
  budgetMs: number,
): Promise<ExamCacheWarmupResult> {
  const started = Date.now();
  const warmed = new Set<string>();
  let pending = items;
  let attempts = 0;
  let timedOut = false;

  while (pending.length && attempts < MAX_RETRY_PASSES) {
    attempts += 1;
    const failedThisPass: WarmItem<T>[] = [];

    for (let index = 0; index < pending.length; index += batchSize) {
      if (Date.now() - started >= budgetMs) {
        timedOut = true;
        failedThisPass.push(...pending.slice(index));
        break;
      }

      const batch = pending.slice(index, index + batchSize);
      const results = await Promise.all(
        batch.map(async (item) => {
          try {
            return isSuccessful(await loader(item.value));
          } catch {
            return false;
          }
        }),
      );

      results.forEach((ok, batchIndex) => {
        const item = batch[batchIndex];
        if (ok) warmed.add(item.id);
        else failedThisPass.push(item);
      });
    }

    pending = failedThisPass.filter((item) => !warmed.has(item.id));
    if (timedOut) break;
  }

  return {
    ok: pending.length === 0,
    mode,
    total: items.length,
    warmed: warmed.size,
    failed: pending.length,
    attempts,
    elapsedMs: Date.now() - started,
    timedOut,
    failedSamples: pending.slice(0, 5).map((item) => item.id.replaceAll("\u001f", " / ")),
  };
}

export async function warmExamSearchCache(
  source: string,
  searchMode: string,
  budgetMs = DEFAULT_WARMUP_BUDGET_MS,
): Promise<ExamCacheWarmupResult> {
  if (searchMode === "concours") {
    const paths = await listCentrePaths(source);
    const items = paths.map((path) => ({
      id: `${path.wilaya}\u001f${path.moughataa}\u001f${path.centre}`,
      value: path,
    }));
    return warmItems(
      items,
      (path) => cachedCentreShard(source, path.wilaya, path.moughataa, path.centre),
      12,
      "centre-shards",
      budgetMs,
    );
  }

  const items = Array.from({ length: 1000 }, (_, index) => {
    const shard = String(index).padStart(3, "0");
    return { id: shard, value: shard };
  });
  return warmItems(
    items,
    (shard) => cachedNumberShard(source, shard),
    24,
    "number-shards",
    budgetMs,
  );
}
