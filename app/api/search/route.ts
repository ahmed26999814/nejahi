import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 8_000;
const NUMBER_RESULT_LIMIT = "10";
const NAME_RESULT_LIMIT = "20";
const MAX_QUERY_LENGTH = 120;

const SOURCE_ALIASES: Record<string, string> = {
  bac_2026: "bac",
  brevet_2026: "brevet",
  concours_2026: "concours",
  bac_session_2026: "bac_session",
  excellence_1as_2026: "excellence_1as",
};

type SearchConfig = {
  table: string;
  fallbackTable?: string;
  select: string;
  fallbackSelect?: string;
  numberColumns: string[];
  nameColumns: string[];
  order?: string;
};

const SEARCH_CONFIG: Record<string, SearchConfig> = {
  bac: { table: "bac_ranked_results", fallbackTable: "bac_results", select: "Numero,NOM,TS,MOD,KR,WL,MS,MD,rank", fallbackSelect: "Numero,NOM,TS,MOD,KR,WL,MS,MD", numberColumns: ["Numero"], nameColumns: ["NOM"], order: "rank.asc" },
  brevet: { table: "brevet_ranked_results", fallbackTable: "brevet_results", select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS,rank", fallbackSelect: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS", numberColumns: ["Num_Bepc"], nameColumns: ["NOM"], order: "rank.asc" },
  concours: { table: "concours_ranked_results", fallbackTable: "concours_results", select: 'NODOSS,"Numéro_C1AS",NOM_AR,TYPE,TOTAL,WILAYA_AR,MOUGHATAA_AR,Ecole_AR,"Centre Examen_AR","LIEU NAISS_AR",ANNEE_NAISS,Noreg,rank', fallbackSelect: 'NODOSS,"Numéro_C1AS",NOM_AR,TYPE,TOTAL,WILAYA_AR,MOUGHATAA_AR,Ecole_AR,"Centre Examen_AR","LIEU NAISS_AR",ANNEE_NAISS,Noreg', numberColumns: ["NODOSS", "Numéro_C1AS"], nameColumns: ["NOM_AR"], order: "rank.asc" },
  bac_session: { table: "bac_session2_ranked_results", fallbackTable: "bac_session2_results", select: 'NODOSS,NOM_AR,NOM_FR,SERIE,"Moy Bac_Session",Decision,Wilaya_AR,Wilaya_FR,Etablissement_AR,Etablissement_FR,"Centre Examen_AR","Centre Examen_FR",LIEUNN_AR,LIEUN_FR,DATN,rank', fallbackSelect: 'NODOSS,NOM_AR,NOM_FR,SERIE,"Moy Bac_Session",Decision,Wilaya_AR,Wilaya_FR,Etablissement_AR,Etablissement_FR,"Centre Examen_AR","Centre Examen_FR",LIEUNN_AR,LIEUN_FR,DATN', numberColumns: ["NODOSS"], nameColumns: ["NOM_AR", "NOM_FR"], order: "rank.asc" },
  excellence_1as: { table: "excellence_1as_ranked_results", fallbackTable: "excellence_1as_results", select: "Num_Excellence_1AS,Nom,SERIE,Mgex,Decision,Wilaya_AR,CENTRE_AR,Lieu,DATEN,Matricule,ARABE,FRANCAIS,CALCUL,rank", fallbackSelect: "Num_Excellence_1AS,Nom,SERIE,Mgex,Decision,Wilaya_AR,CENTRE_AR,Lieu,DATEN,Matricule,ARABE,FRANCAIS,CALCUL", numberColumns: ["Num_Excellence_1AS"], nameColumns: ["Nom"], order: "rank.asc" },
};

function escapePostgrestValue(value: string) { return value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)").trim(); }
function numberSearchValues(query: string) {
  const value = query.trim();
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  const numeric = String(Number(value));
  const variants = new Set<string>([value, numeric]);
  for (let width = 3; width <= 8; width += 1) variants.add(numeric.padStart(width, "0"));
  return [...variants].map(escapePostgrestValue);
}
function isNumberSearch(query: string) { return /^\d+$/.test(query.trim()); }
function normalizeQuery(query: string) { return query.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH); }
function unwrapRpcRows(rows: unknown[]) { return (Array.isArray(rows) ? rows : []).map((row: any) => row?.search_uploaded_exam_rows ?? row).filter(Boolean); }

async function timedFetch(url: string | URL, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}

async function supabaseSearch(table: string, params: URLSearchParams) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { error: "Missing Supabase environment variables", status: 500 } as const;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  params.forEach((value, key) => { if (value) url.searchParams.set(key, value); });
  try {
    const response = await timedFetch(url, { cache: "no-store", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json", Prefer: "count=none" } });
    const text = await response.text();
    if (!response.ok) return { error: text, status: response.status } as const;
    return { rows: text ? JSON.parse(text) : [], status: 200 } as const;
  } catch (error) {
    return { error: error instanceof Error && error.name === "AbortError" ? "Search timeout" : String(error), status: 504 } as const;
  }
}

async function searchUploaded(source: string, query: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { error: "Missing Supabase environment variables", status: 500 } as const;
  try {
    const response = await timedFetch(`${SUPABASE_URL}/rest/v1/rpc/search_uploaded_exam_rows`, {
      method: "POST", cache: "no-store",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ p_source_key: source, p_query: query, p_wilaya: null, p_moughataa: null, p_centre: null }),
    });
    const text = await response.text();
    if (!response.ok) return { error: text, status: response.status } as const;
    return { rows: unwrapRpcRows(text ? JSON.parse(text) : []), status: 200 } as const;
  } catch (error) {
    return { error: error instanceof Error && error.name === "AbortError" ? "Search timeout" : String(error), status: 504 } as const;
  }
}

function buildParams(config: SearchConfig, query: string, useFallback = false) {
  const numeric = isNumberSearch(query);
  const params = new URLSearchParams({ select: useFallback ? (config.fallbackSelect || config.select) : config.select, limit: numeric ? NUMBER_RESULT_LIMIT : NAME_RESULT_LIMIT });
  if (numeric) {
    const values = numberSearchValues(query);
    params.set("or", `(${config.numberColumns.flatMap((column) => values.map((value) => `${column}.eq.${value}`)).join(",")})`);
  } else {
    const value = escapePostgrestValue(query);
    params.set("or", `(${config.nameColumns.map((column) => `${column}.ilike.*${value}*`).join(",")})`);
  }
  if (config.order && !useFallback) params.set("order", config.order);
  return params;
}

function shouldUseFallback(result: Awaited<ReturnType<typeof supabaseSearch>>) {
  if (!("error" in result)) return false;
  const message = String(result.error || "");
  return result.status === 404
    || message.includes("PGRST205")
    || message.includes("42P01")
    || /relation .* does not exist/i.test(message);
}

async function executeSearch(source: string, query: string) {
  if (source.startsWith("upload:")) return searchUploaded(source, query);
  const canonicalSource = SOURCE_ALIASES[source] || source;
  const config = SEARCH_CONFIG[canonicalSource];
  if (!config) return { error: "Unknown source", status: 400 } as const;
  let result = await supabaseSearch(config.table, buildParams(config, query));
  if (config.fallbackTable && shouldUseFallback(result)) {
    result = await supabaseSearch(config.fallbackTable, buildParams(config, query, true));
  }
  return result;
}

const cachedSearch = unstable_cache(async (source: string, query: string) => executeSearch(source, query), ["mauriresults-public-search-v5"], { revalidate: 60 });
function responseHeaders(numeric: boolean) {
  const cache = numeric ? "public, s-maxage=300, stale-while-revalidate=21600" : "public, s-maxage=60, stale-while-revalidate=3600";
  return { "Cache-Control": cache, "CDN-Cache-Control": cache, Vary: "Accept-Encoding" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = String(searchParams.get("source") || "").trim();
  const query = normalizeQuery(String(searchParams.get("q") || ""));
  const numeric = isNumberSearch(query);
  const canonicalSource = SOURCE_ALIASES[source] || source;
  if ((numeric && query.length < 1) || (!numeric && query.length < 2)) {
    return NextResponse.json({ rows: [], error: "Query too short" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (!source.startsWith("upload:") && !SEARCH_CONFIG[canonicalSource]) return NextResponse.json({ rows: [], error: "Unknown source" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const result = await cachedSearch(source, query);
  if ("error" in result) return NextResponse.json({ rows: [], error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ rows: result.rows }, { headers: responseHeaders(numeric) });
}
