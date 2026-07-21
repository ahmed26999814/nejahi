import { NextResponse } from "next/server";
import { LEGACY_2025_EXAMS } from "../../../lib/legacyExamCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.SUPABASE_SERVICE_ROLE_KEY;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  "Vercel-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

type ExamSearchConfig = {
  source_key?: unknown;
  table_name?: unknown;
  search_mode?: unknown;
  wilaya_column?: unknown;
  moughataa_column?: unknown;
  centre_column?: unknown;
};

type LocationRow = Record<string, unknown>;

type LocationGroup = {
  wilaya: string;
  moughataas: Array<{
    name: string;
    centres: string[];
  }>;
};

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function validSource(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_:.-]{1,80}$/.test(value);
}

function validTable(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(value);
}

function validColumn(value: string) {
  return value.length > 0
    && value.length <= 96
    && !/[\u0000-\u001f,]/.test(value);
}

function selectIdentifier(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
    ? value
    : `"${value.replace(/"/g, "\"\"")}"`;
}

async function supabaseJson(url: URL, init?: RequestInit) {
  if (!SUPABASE_KEY) throw new Error("Missing Supabase key");
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    next: { revalidate: 3600 },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase error ${response.status}`);
  return text ? JSON.parse(text) : [];
}

async function resolveExam(source: string): Promise<ExamSearchConfig | null> {
  const legacy = LEGACY_2025_EXAMS.find((exam) => String(exam.source_key || "") === source) || null;
  if (!SUPABASE_URL || !SUPABASE_KEY) return legacy;

  const url = new URL(`${SUPABASE_URL}/rest/v1/published_exams`);
  url.searchParams.set(
    "select",
    "source_key,table_name,search_mode,wilaya_column,moughataa_column,centre_column",
  );
  url.searchParams.set("source_key", `eq.${source}`);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("limit", "1");

  try {
    const rows = await supabaseJson(url);
    return Array.isArray(rows) && rows[0] ? rows[0] : legacy;
  } catch {
    return legacy;
  }
}

function locationTableCandidates(table: string) {
  const candidates: string[] = [];
  if (table.endsWith("_results_view")) {
    candidates.push(table.slice(0, -"_results_view".length) + "_locations_view");
  } else if (table.endsWith("_results")) {
    candidates.push(table.slice(0, -"_results".length) + "_locations_view");
  }
  candidates.push(table);
  return [...new Set(candidates)].filter(validTable);
}

async function fetchRowsFromTable(
  table: string,
  select: string,
  maximumRows: number,
) {
  if (!SUPABASE_URL) throw new Error("Missing Supabase URL");
  const rows: LocationRow[] = [];
  const pageSize = 1000;

  for (let offset = 0; offset < maximumRows; offset += pageSize) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set("select", select);
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));
    const page = await supabaseJson(url, {
      headers: { Prefer: "count=none" },
    });
    if (!Array.isArray(page)) break;
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

async function fetchLocationRows(config: ExamSearchConfig) {
  const table = cleanText(config.table_name);
  const wilayaColumn = cleanText(config.wilaya_column);
  const moughataaColumn = cleanText(config.moughataa_column);
  const centreColumn = cleanText(config.centre_column);

  if (!validTable(table)
    || !validColumn(wilayaColumn)
    || !validColumn(moughataaColumn)
    || !validColumn(centreColumn)) {
    throw new Error("Invalid concours search configuration");
  }

  const select = [wilayaColumn, moughataaColumn, centreColumn]
    .map(selectIdentifier)
    .join(",");
  const candidates = locationTableCandidates(table);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const isDedicatedLocationView = candidate !== table;
      const rows = await fetchRowsFromTable(
        candidate,
        select,
        isDedicatedLocationView ? 20000 : 120000,
      );
      if (rows.length > 0) {
        return {
          rows,
          locationTable: candidate,
          wilayaColumn,
          moughataaColumn,
          centreColumn,
        };
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No concours locations were found");
}

function buildHierarchy(
  rows: LocationRow[],
  wilayaColumn: string,
  moughataaColumn: string,
  centreColumn: string,
): LocationGroup[] {
  const hierarchy = new Map<string, Map<string, Set<string>>>();

  for (const row of rows) {
    const wilaya = cleanText(row[wilayaColumn]);
    const moughataa = cleanText(row[moughataaColumn]);
    const centre = cleanText(row[centreColumn]);
    if (!wilaya || !moughataa || !centre) continue;

    const moughataas = hierarchy.get(wilaya) || new Map<string, Set<string>>();
    const centres = moughataas.get(moughataa) || new Set<string>();
    centres.add(centre);
    moughataas.set(moughataa, centres);
    hierarchy.set(wilaya, moughataas);
  }

  return [...hierarchy.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ar"))
    .map(([wilaya, moughataas]) => ({
      wilaya,
      moughataas: [...moughataas.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "ar"))
        .map(([name, centres]) => ({
          name,
          centres: [...centres].sort((a, b) => a.localeCompare(b, "ar")),
        })),
    }));
}

function hierarchyStats(locations: LocationGroup[]) {
  let moughataaCount = 0;
  let centreCount = 0;
  for (const wilaya of locations) {
    moughataaCount += wilaya.moughataas.length;
    for (const moughataa of wilaya.moughataas) {
      centreCount += moughataa.centres.length;
    }
  }
  return {
    wilayaCount: locations.length,
    moughataaCount,
    centreCount,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = cleanText(url.searchParams.get("source") || "concours");

  if (!validSource(source)) {
    return NextResponse.json({ locations: [], error: "Invalid source" }, { status: 400 });
  }

  const config = await resolveExam(source);
  if (!config || cleanText(config.search_mode).toLowerCase() !== "concours") {
    return NextResponse.json(
      { locations: [], error: "This exam does not use guided concours search" },
      { status: 400 },
    );
  }

  try {
    const {
      rows,
      locationTable,
      wilayaColumn,
      moughataaColumn,
      centreColumn,
    } = await fetchLocationRows(config);
    const locations = buildHierarchy(rows, wilayaColumn, moughataaColumn, centreColumn);
    return NextResponse.json(
      {
        source,
        locationTable,
        ...hierarchyStats(locations),
        locations,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        locations: [],
        error: error instanceof Error ? error.message : "Unable to load locations",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
