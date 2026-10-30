import { NextResponse } from "next/server";
import { neonRestFetch } from "../../../lib/neon/restCompat.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only data already published in the original public result/statistics pages.
// No arbitrary table access and no writes via this endpoint.
const ALLOWED_TABLES = new Set([
  "bac_results","bac_ranked_results","brevet_results",
  "bac_session2_results","concours_results","concours_results_view",
  "excellence_1as_results","site_content",
  "bac_stats","bac_region_stats","bac_school_stats","bac_track_stats","bac_top_students",
  "brevet_stats","brevet_region_stats","brevet_school_stats","brevet_top_students",
  "concours_stats","concours_region_stats","concours_moughataa_stats",
  "concours_school_stats","concours_top_students","concours_locations_view",
  "excellence_1as_stats","excellence_1as_region_stats","excellence_1as_top_students",
  "bac_session2_stats","bac_session2_region_stats","bac_session2_track_stats",
  "bac_session2_top_students",
]);
const RESULT_TABLES = new Set([
  "bac_results","bac_ranked_results","brevet_results","bac_session2_results",
  "concours_results","concours_results_view","excellence_1as_results",
]);
const ALLOWED_QUERY_COLUMNS = new Set([
 "WL","MD","MS","TS","WILAYA","Ecole","Centre","Wilaya_AR","Etablissement_AR",
 "Centre Examen_AR","SERIE","CENTRE_AR","WILAYA_AR","MOUGHATAA_AR",
 "Ecole_AR","TYPE","NODOSS","Numero","Num_Bepc","Num_Excellence_1AS",
 "Numéro","Noreg","order","offset","limit","select"
]);
export async function GET(request: Request) {
  const url = new URL(request.url);
  const table = url.searchParams.get("table") || "";
  if (process.env.NEXT_PUBLIC_NEON_MODE !== "1" ||
      !ALLOWED_TABLES.has(table) ||
      [...url.searchParams.keys()].some(key => key !== "table" && !ALLOWED_QUERY_COLUMNS.has(key))) {
    return NextResponse.json({ error: "Resource not available" }, { status: 404 });
  }
  const count = Number(url.searchParams.get("limit") || "100");
  const offset = Number(url.searchParams.get("offset") || "0");
  if (!Number.isInteger(count) || count < 1 || count > 1000 ||
      !Number.isInteger(offset) || offset < 0 || offset > 1000000) {
    return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  }
  if (RESULT_TABLES.has(table) &&
      ![...url.searchParams.keys()].some(key => !["table","select","order","limit","offset"].includes(key))) {
    return NextResponse.json({ error: "A result filter is required" }, { status: 400 });
  }
  url.searchParams.delete("table");
  url.searchParams.set("limit", String(count));
  const upstream = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!upstream) return NextResponse.json({ error: "Data source unavailable" }, { status: 503 });
  const original = new URL("/rest/v1/" + table, upstream);
  original.search = url.search;
  const response = await neonRestFetch(original.toString(), { method: "GET" });
  if (!response) return NextResponse.json({ error: "Data source unavailable" }, { status: 503 });
  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
