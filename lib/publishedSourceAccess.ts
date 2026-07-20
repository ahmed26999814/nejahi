import "server-only";

import { unstable_cache } from "next/cache";
import { PUBLIC_EXAMS_CACHE_TAG } from "./cacheTags";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const BUILTIN_SOURCES = new Set([
  "bac",
  "brevet",
  "concours",
  "bac_session",
  "excellence_1as",
]);

async function uploadedSourceIsActive(source: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set("select", "source_key");
  url.searchParams.set("source_key", `eq.${source}`);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      Prefer: "count=none",
    },
  });
  if (!response.ok) return false;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

export function isPublicResultSource(source: string) {
  if (BUILTIN_SOURCES.has(source)) return Promise.resolve(true);
  if (!/^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(source)) return Promise.resolve(false);
  return unstable_cache(
    () => uploadedSourceIsActive(source),
    ["mauriresults-published-source-v1", source],
    { revalidate: 60, tags: [PUBLIC_EXAMS_CACHE_TAG] },
  )();
}
