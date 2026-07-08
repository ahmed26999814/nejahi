import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 10_000;
const NUMBER_RESULT_LIMIT = "1";
const NAME_RESULT_LIMIT = "20";

const SEARCH_CONFIG: Record<string, {
  table: string;
  fallbackTable?: string;
  select: string;
  fallbackSelect?: string;
  numberColumns: string[];
  nameColumns: string[];
  order?: string;
}> = {
  bac: {
    table: "bac_ranked_results",
    fallbackTable: "bac_results",
    select: "Numero,NOM,TS,MOD,KR,WL,MS,MD,rank",
    fallbackSelect: "Numero,NOM,TS,MOD,KR,WL,MS,MD",
    numberColumns: ["Numero"],
    nameColumns: ["NOM"],
    order: "rank.asc",
  },
  brevet: {
    table: "brevet_results",
    select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
    numberColumns: ["Num_Bepc"],
    nameColumns: ["NOM"],
  },
  concours: {
    table: "concours_results_view",
    fallbackTable: "concours_results",
    select: 'NODOSS,"Numéro_C1AS",NOM_AR,TYPE,TOTAL,total_num,WILAYA_AR,MOUGHATAA_AR,Ecole_AR,"Centre Examen_AR","LIEU NAISS_AR",ANNEE_NAISS,Noreg',
    fallbackSelect: 'NODOSS,"Numéro_C1AS",NOM_AR,TYPE,TOTAL,WILAYA_AR,MOUGHATAA_AR,Ecole_AR,"Centre Examen_AR","LIEU NAISS_AR",ANNEE_NAISS,Noreg',
    numberColumns: ["NODOSS", "Numéro_C1AS"],
    nameColumns: ["NOM_AR"],
    order: "total_num.desc.nullslast",
  },
  bac_session: {
    table: "bac_session2_results",
    select: 'NODOSS,NOM_AR,NOM_FR,SERIE,"Moy Bac_Session",Decision,Wilaya_AR,Wilaya_FR,Etablissement_AR,Etablissement_FR,"Centre Examen_AR","Centre Examen_FR",LIEUNN_AR,LIEUN_FR,DATN',
    numberColumns: ["NODOSS"],
    nameColumns: ["NOM_AR", "NOM_FR"],
  },
  excellence_1as: {
    table: "excellence_1as_results",
    select: "Num_Excellence_1AS,Nom,SERIE,Mgex,Decision,Wilaya_AR,CENTRE_AR,Lieu,DATEN,Matricule,ARABE,FRANCAIS,CALCUL",
    numberColumns: ["Num_Excellence_1AS"],
    nameColumns: ["Nom"],
  },
};

function escapePostgrestValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)").trim();
}

function numberSearchValues(query: string, width = 5) {
  const value = query.trim();
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  return [...new Set([value, value.padStart(width, "0"), String(Number(value))])].map(escapePostgrestValue);
}

function isNumberSearch(query: string) {
  return /^\d+$/.test(query.trim());
}

async function supabaseSearch(table: string, params: URLSearchParams) {
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
    const message = error instanceof Error && error.name === "AbortError" ? "Search timeout" : String(error);
    return { error: message, status: 504 } as const;
  } finally {
    clearTimeout(timeout);
  }
}

function buildParams(config: (typeof SEARCH_CONFIG)[string], query: string, useFallback = false) {
  const numeric = isNumberSearch(query);
  const params = new URLSearchParams({
    select: useFallback ? (config.fallbackSelect || config.select) : config.select,
    limit: numeric ? NUMBER_RESULT_LIMIT : NAME_RESULT_LIMIT,
  });

  if (numeric) {
    const values = numberSearchValues(query);
    const clauses = config.numberColumns.flatMap((column) => values.map((value) => `${column}.eq.${value}`));
    params.set("or", `(${clauses.join(",")})`);
  } else {
    const value = escapePostgrestValue(query);
    params.set("or", `(${config.nameColumns.map((column) => `${column}.ilike.*${value}*`).join(",")})`);
  }

  if (config.order && !useFallback) params.set("order", config.order);
  return params;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = String(searchParams.get("source") || "").trim();
  const query = String(searchParams.get("q") || "").trim();
  const config = SEARCH_CONFIG[source];
  const numeric = isNumberSearch(query);

  if (!config) return NextResponse.json({ rows: [], error: "Unknown source" }, { status: 400 });
  if (query.length < 2) return NextResponse.json({ rows: [], error: "Query too short" }, { status: 400 });

  let result = await supabaseSearch(config.table, buildParams(config, query));

  if ("error" in result && config.fallbackTable) {
    result = await supabaseSearch(config.fallbackTable, buildParams(config, query, true));
  }

  if ("error" in result) {
    return NextResponse.json({ rows: [], error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    { rows: result.rows },
    {
      headers: {
        "Cache-Control": numeric ? "public, s-maxage=300, stale-while-revalidate=86400" : "no-store",
      },
    }
  );
}
