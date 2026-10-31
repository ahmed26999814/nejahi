import "server-only";

import { unstable_cache } from "next/cache";
import {
  fetchCentreShard,
  fetchExactNumberResult,
  fetchExactConcoursResult,
  fetchNumberShard,
} from "./resultNumberLookup";
import type { NumberLookupResult, ShardLookupResult } from "./resultNumberLookup";
import { SEARCH_CACHE_TAG, searchSourceTag } from "./cacheTags";

// Cache published results, but never cache transient Supabase errors.
// Without the throw, unstable_cache stores a {status: 504} value for an hour.
const RESULT_CACHE_SECONDS = 600;
type Result = NumberLookupResult | ShardLookupResult;

async function cacheOnlySuccessful<T extends Result>(
  source: string,
  parts: string[],
  fetcher: () => Promise<T>,
): Promise<T> {
  let upstreamFailure: T | null = null;
  try {
    return await unstable_cache(
      async () => {
        const result = await fetcher();
        if ("error" in result) {
          upstreamFailure = result;
          throw new Error("Skip caching transient result lookup failure");
        }
        return result;
      },
      parts,
      { revalidate: RESULT_CACHE_SECONDS, tags: [SEARCH_CACHE_TAG, searchSourceTag(source)] },
    )();
  } catch {
    return upstreamFailure ?? ({ error: "Search unavailable", status: 503 } as T);
  }
}

export function cachedNumberShard(source: string, shard: string) {
  return cacheOnlySuccessful(
    source,
    ["mauriresults-number-shard-v3", source, shard],
    () => fetchNumberShard(source, shard),
  );
}

export function cachedCentreShard(
  source: string,
  wilaya: string,
  moughataa: string,
  centre: string,
) {
  return cacheOnlySuccessful(
    source,
    ["mauriresults-centre-shard-v3", source, wilaya, moughataa, centre],
    () => fetchCentreShard(source, wilaya, moughataa, centre),
  );
}

export function cachedLegacyConcoursResult(source: string, candidateKey: string) {
  return cacheOnlySuccessful(
    source,
    ["mauriresults-legacy-concours-number-v3", source, candidateKey],
    () => fetchExactNumberResult(source, candidateKey),
  );
}

export function cachedLegacyConcoursByLocation(
  candidateKey: string, wilaya: string, moughataa: string, centre: string,
) {
  return cacheOnlySuccessful(
    "concours",
    ["mauriresults-legacy-concours-location-v2", candidateKey, wilaya, moughataa, centre],
    () => fetchExactConcoursResult("concours", candidateKey, wilaya, moughataa, centre),
  );
}
