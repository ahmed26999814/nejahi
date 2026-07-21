import "server-only";

import { unstable_cache } from "next/cache";
import {
  fetchCentreShard,
  fetchExactNumberResult,
  fetchNumberShard,
} from "./resultNumberLookup";
import { SEARCH_CACHE_TAG, searchSourceTag } from "./cacheTags";

// Results remain immutable between publication events. Publication and reset routes
// invalidate these tags explicitly, so a longer warm-cache window greatly reduces
// Supabase traffic during result-day spikes without keeping stale data after updates.
const RESULT_CACHE_SECONDS = 3_600;

export function cachedNumberShard(source: string, shard: string) {
  return unstable_cache(
    () => fetchNumberShard(source, shard),
    ["mauriresults-number-shard-v2", source, shard],
    {
      revalidate: RESULT_CACHE_SECONDS,
      tags: [SEARCH_CACHE_TAG, searchSourceTag(source)],
    },
  )();
}

export function cachedCentreShard(
  source: string,
  wilaya: string,
  moughataa: string,
  centre: string,
) {
  return unstable_cache(
    () => fetchCentreShard(source, wilaya, moughataa, centre),
    ["mauriresults-centre-shard-v2", source, wilaya, moughataa, centre],
    {
      revalidate: RESULT_CACHE_SECONDS,
      tags: [SEARCH_CACHE_TAG, searchSourceTag(source)],
    },
  )();
}

export function cachedLegacyConcoursResult(source: string, candidateKey: string) {
  return unstable_cache(
    () => fetchExactNumberResult(source, candidateKey),
    ["mauriresults-legacy-concours-number-v2", source, candidateKey],
    {
      revalidate: RESULT_CACHE_SECONDS,
      tags: [SEARCH_CACHE_TAG, searchSourceTag(source)],
    },
  )();
}
