import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 10_000;
const LIMIT = "200";

type Source = "bac" | "brevet" | "concours" | "bac_session" | "excellence_1as";
type Field = "wl" | "moughataa" | "ms" | "centre" | "track";

type RankingConfig = {
  table: string;
  fallbackTable?: string;
  select: string;
  fallbackSelect?: string;
  columns: Partial<Record<Field, string>>;
  order: string;
  fallbackOrder?: string;
};

const CONFIGS: Record<Source, RankingConfig> = {
  bac: {
    table: "bac_ranked_results",
    fallbackTable: "bac_results",
    select: "Numero,NOM,TS,MOD,KR,WL,MS,MD,rank",
    fallbackSelect: "Numero,NOM,TS,MOD,KR,WL,MS,MD",
    columns: { wl: "WL", moughataa: "MD", ms: "MS", track: "TS" },
    order: "rank.asc",
    fallbackOrder: "MOD.desc.nullslast",
  },
  brevet: {
    table: "brevet_ranked_results",
    fallbackTable: "brevet_results",
    select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS,rank",
    fallbackSelect: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
    columns: { wl: "WILAYA", ms: "Ecole", centre: "Centre" },
    order: "rank.asc",
    fallbackOrder: "Moyenne_Bepc.desc.nullslast",
  },
  concours: {
    table: "concours_ranked_results",
    fallbackTable: "concours_results_view",
    select: 'NODOSS,"Numéro_C1AS",NOM_AR,TYPE,TOTAL,total_num,WILAYA_AR,MOUGHATAA_AR,Ecole_AR,"Centre Examen_AR","LIEU NAISS_AR",ANNEE_NAISS,Noreg,rank',
    fallbackSelect: 'NODOSS,"Numéro_C1AS",NOM_AR,TYPE,TOTAL,total_num,WILAYA_AR,MOUGHATAA_AR,Ecole_AR,"Centre Examen_AR","LIEU NAISS_AR",ANNEE_NAISS,Noreg',
    columns: { wl: "WILAYA_AR", moughataa: "MOUGHATAA_AR", centre: "Centre Examen_AR", ms: "Ecole_AR", track: "TYPE" },
    order: "rank.asc",
    fallbackOrder: "total_num.desc.nullslast",
  },
  bac_session: {
    table: "bac_session2_ranked_results",
    fallbackTable: "bac_session2_results",
    select: 'NODOSS,NOM_AR,NOM_FR,SERIE,"Moy Bac_Session",Decision,Wilaya_AR,Wilaya_FR,Etablissement_AR,Etablissement_FR,"Centre Examen_AR","Centre Examen_FR",LIEUNN_AR,LIEUN_FR,DATN,rank',
    fallbackSelect: 'NODOSS,NOM_AR,NOM_FR,SERIE,"Moy Bac_Session",Decision,Wilaya_AR,Wilaya_FR,Etablissement_AR,Etablissement_FR,"Centre Examen_AR","Centre Examen_FR",LIEUNN_AR,LIEUN_FR,DATN',
    columns: { wl: "Wilaya_AR", ms: "Etablissement_AR", centre: "Centre Examen_AR", track: "SERIE" },
    order: "rank.asc",
    fallbackOrder: '"Moy Bac_Session".desc.nullslast',
  },
  excellence_1as: {
    table: "excellence_1as_ranked_results",
    fallbackTable: "excellence_1as_results",
    select: "Num_Excellence_1AS,Nom,SERIE,Mgex,Decision,Wilaya_AR,CENTRE_AR,Lieu,DATEN,Matricule,ARABE,FRANCAIS,CALCUL,rank",
    fallbackSelect: "Num_Excellence_1AS,Nom,SERIE,Mgex,Decision,Wilaya_AR,CENTRE_AR,Lieu,DATEN,Matricule,ARABE,FRANCAIS,CALCUL",
    columns: { wl: "Wilaya_AR", centre: "CENTRE_AR", track: "SERIE" },
    order: "rank.asc",
    fallbackOrder: "Mgex.desc.nullslast",
  },
};

function escapePostgrestValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)").trim();
}

async function supabaseRanking(table: string, params: URLSearchParams) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase environment variables", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  params.forEach((value, key) => {
    if (value) url.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
        Prefer: "count=none",
      },
    });

    const text = await response.text();
    if (!response.ok) return { error: text, status: response.status } as const;
    return { rows: text ? JSON.parse(text) : [], status: 200 } as const;
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "Ranking timeout" : String(error);
    return { error: message, status: 504 } as const;
  } finally {
    clearTimeout(timeout);
  }
}

function buildParams(config: RankingConfig, column: string, value: string, useFallback = false) {
  const params = new URLSearchParams({
    select: useFallback ? (config.fallbackSelect || config.select) : config.select,
    limit: LIMIT,
  });
  params.set(column, `eq.${escapePostgrestValue(value)}`);
  const order = useFallback ? (config.fallbackOrder || config.order) : config.order;
  if (order) params.set("order", order);
  return params;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = String(searchParams.get("source") || "").trim() as Source;
  const field = String(searchParams.get("field") || "").trim() as Field;
  const value = String(searchParams.get("value") || "").trim();
  const config = CONFIGS[source];
  const column = config?.columns[field];

  if (!config || !column) return NextResponse.json({ rows: [], error: "Invalid ranking target" }, { status: 400 });
  if (!value) return NextResponse.json({ rows: [], error: "Missing ranking value" }, { status: 400 });

  let result = await supabaseRanking(config.table, buildParams(config, column, value));
  if ("error" in result && config.fallbackTable) {
    result = await supabaseRanking(config.fallbackTable, buildParams(config, column, value, true));
  }
  if ("error" in result) return NextResponse.json({ rows: [], error: result.error }, { status: result.status });

  return NextResponse.json(
    { rows: result.rows },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" } }
  );
}
