import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const LIMIT = 20;

function clean(value) {
  return String(value ?? "").trim();
}

function escapePostgrestValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)");
}

function numberSearchValues(query, width = 5) {
  const value = clean(query);
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  return [...new Set([value, value.padStart(width, "0"), String(Number(value))])].map(escapePostgrestValue);
}

function concoursNumberSearchValues(query) {
  const value = clean(query);
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  return [...new Set([value, value.padStart(5, "0"), value.padStart(6, "0"), String(Number(value))])].map(escapePostgrestValue);
}

async function requestTable(table, params) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase environment variables.");

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const error = new Error(await response.text());
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function requestWithFallback(primaryTable, fallbackTable, params, fallbackSelect) {
  try {
    return await requestTable(primaryTable, params);
  } catch (error) {
    if (!fallbackTable) throw error;
    const { select, order, ...rest } = params;
    return requestTable(fallbackTable, { ...rest, select: fallbackSelect || select });
  }
}

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = clean(searchParams.get("source"));
    const query = clean(searchParams.get("q"));
    if (!source || query.length < 2) return json({ rows: [] });

    const value = escapePostgrestValue(query);
    const isNumberLike = /^[0-9A-Za-z-]+$/.test(query);

    if (source === "bac") {
      const numbers = numberSearchValues(query, 5);
      const params = {
        select: "Numero,NOM,TS,MOD,KR,WL,MS,MD,rank",
        or: isNumberLike ? `(${numbers.map((n) => `Numero.eq.${n}`).join(",")},NOM.ilike.*${value}*)` : "",
        NOM: isNumberLike ? "" : `ilike.*${value}*`,
        limit: LIMIT,
      };
      const rows = await requestWithFallback("bac_ranked_results", "bac_results", params, "Numero,NOM,TS,MOD,KR,WL,MS,MD");
      return json({ rows });
    }

    if (source === "brevet") {
      const numbers = numberSearchValues(query, 5);
      const rows = await requestTable("brevet_results", {
        select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
        or: isNumberLike ? `(${numbers.map((n) => `Num_Bepc.eq.${n}`).join(",")},NOM.ilike.*${value}*)` : "",
        NOM: isNumberLike ? "" : `ilike.*${value}*`,
        limit: LIMIT,
      });
      return json({ rows });
    }

    if (source === "concours") {
      const numbers = concoursNumberSearchValues(query);
      const params = {
        select: "*",
        or: isNumberLike ? `(${numbers.map((n) => `NODOSS.eq.${n}`).join(",")},${numbers.map((n) => `Numéro_C1AS.eq.${n}`).join(",")})` : `(NOM_AR.ilike.*${value}*)`,
        order: "total_num.desc.nullslast",
        limit: LIMIT,
      };
      const rows = await requestWithFallback("concours_results_view", "concours_results", params);
      return json({ rows });
    }

    if (source === "bac_session") {
      const numbers = numberSearchValues(query, 5);
      const rows = await requestTable("bac_session2_results", {
        select: "*",
        or: isNumberLike ? `(${numbers.map((n) => `NODOSS.eq.${n}`).join(",")},NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)` : `(NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)`,
        limit: LIMIT,
      });
      return json({ rows });
    }

    if (source === "excellence_1as") {
      const numbers = numberSearchValues(query, 5);
      const rows = await requestTable("excellence_1as_results", {
        select: "*",
        or: isNumberLike ? `(${numbers.map((n) => `Num_Excellence_1AS.eq.${n}`).join(",")},Nom.ilike.*${value}*)` : `(Nom.ilike.*${value}*)`,
        limit: LIMIT,
      });
      return json({ rows });
    }

    return json({ rows: [] });
  } catch (error) {
    console.error("[MauriResults API Search Error]", error);
    return json({ error: "SEARCH_FAILED" }, 500);
  }
}
