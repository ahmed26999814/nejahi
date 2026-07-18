import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://mauri-results.vercel.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5_000;
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400";
const REQUIRED_APP_VERSION = "3.0.0";

type Dashboard = Record<string, unknown>;
type CacheEntry = { data: Dashboard; createdAt: number };

const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Dashboard>>();

const LEGACY_VIEWS: Record<string, Record<string, string | undefined>> = {
  bac: { stats: "bac_stats", regionStats: "bac_region_stats", schoolStats: "bac_school_stats", trackStats: "bac_track_stats", topStudents: "bac_top_students" },
  brevet: { stats: "brevet_stats", regionStats: "brevet_region_stats", schoolStats: "brevet_school_stats", topStudents: "brevet_top_students" },
  concours: { stats: "concours_stats", regionStats: "concours_region_stats", moughataaStats: "concours_moughataa_stats", schoolStats: "concours_school_stats", topStudents: "concours_top_students" },
  excellence_1as: { stats: "excellence_1as_stats", regionStats: "excellence_1as_region_stats", topStudents: "excellence_1as_top_students" },
  bac_session: { stats: "bac_session2_stats", regionStats: "bac_session2_region_stats", trackStats: "bac_session2_track_stats", topStudents: "bac_session2_top_students" },
};

function numberValue(value: unknown) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function labelValue(row: Record<string, unknown>) {
  return String(row.label ?? row.wilaya ?? row.track ?? row.school ?? row.moughataa ?? row.WILAYA ?? row.WL ?? "غير محدد").trim();
}

function normalizeStats(row: Record<string, unknown> | undefined, source: string) {
  const isConcours = source === "concours" || Boolean(row?.isConcours);
  const total = numberValue(row?.total ?? row?.total_students);
  const passed = isConcours ? 0 : numberValue(row?.passed);
  return {
    ...(row || {}),
    total,
    passed,
    failed: isConcours ? 0 : numberValue(row?.failed),
    average: numberValue(row?.average ?? row?.average_score),
    highest: numberValue(row?.highest ?? row?.highest_score),
    passRate: total ? (passed / total) * 100 : 0,
    isConcours,
  };
}

function normalizeBreakdown(rows: Array<Record<string, unknown>> = [], source: string) {
  const isConcours = source === "concours";
  return rows.map((row) => {
    const total = numberValue(row.total ?? row.total_students);
    const passed = isConcours ? 0 : numberValue(row.passed);
    return {
      ...row,
      label: labelValue(row),
      total,
      passed,
      average: numberValue(row.average ?? row.average_score),
      highest: numberValue(row.highest ?? row.highest_score),
      passRate: total ? (passed / total) * 100 : 0,
    };
  });
}

function normalizeTopStudents(rows: Array<Record<string, unknown>> = []) {
  return rows.map((row, index) => ({
    ...row,
    id: row.id ?? row.numero ?? row.Numero ?? row.NODOSS ?? row.Num_Bepc ?? row.Num_Excellence_1AS ?? "",
    name: row.name ?? row.NOM ?? row.NOM_AR ?? row.Nom ?? "",
    track: row.track ?? row.serie ?? row.TS ?? row.SERIE ?? "",
    score: numberValue(row.score ?? row.average_score ?? row.total_score ?? row.MOD ?? row.Mgex ?? row["Moy Bac_Session"] ?? row.Moyenne_Bepc),
    rank: numberValue(row.rank) || index + 1,
  }));
}

async function supabaseJson(url: URL, init?: RequestInit) {
  if (!SUPABASE_KEY) throw new Error("Missing Supabase key");
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? JSON.parse(text) : [];
}

async function fetchLegacyView(viewName?: string, limit = 100) {
  if (!viewName || !SUPABASE_URL) return [];
  const url = new URL(`${SUPABASE_URL}/rest/v1/${viewName}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", String(limit));
  try { return await supabaseJson(url); } catch { return []; }
}

async function getUploadedDashboard(source: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase environment variables");
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/get_cached_published_exam_dashboard`);
  return (await supabaseJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_source_key: source }),
  })) || {};
}

async function getLegacyDashboard(source: string) {
  const views = LEGACY_VIEWS[source];
  if (!views) throw new Error("Invalid source");
  const [statsRows, regionRows, schoolRows, trackRows, moughataaRows, topRows] = await Promise.all([
    fetchLegacyView(views.stats, 1),
    fetchLegacyView(views.regionStats),
    fetchLegacyView(views.schoolStats),
    fetchLegacyView(views.trackStats),
    fetchLegacyView(views.moughataaStats),
    fetchLegacyView(views.topStudents),
  ]);
  return {
    stats: normalizeStats(statsRows?.[0], source),
    regionStats: normalizeBreakdown(regionRows, source),
    schoolStats: normalizeBreakdown(schoolRows, source),
    trackStats: source === "concours" || source === "brevet" ? [] : normalizeBreakdown(trackRows, source),
    moughataaStats: normalizeBreakdown(moughataaRows, source),
    topStudents: normalizeTopStudents(topRows),
  };
}

function loadDashboard(source: string) {
  const existing = inFlight.get(source);
  if (existing) return existing;
  const request = (source.startsWith("upload:") ? getUploadedDashboard(source) : getLegacyDashboard(source))
    .then((data) => {
      memoryCache.set(source, { data, createdAt: Date.now() });
      return data;
    })
    .finally(() => inFlight.delete(source));
  inFlight.set(source, request);
  return request;
}

function json(data: Dashboard, cacheStatus: string) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "CDN-Cache-Control": CACHE_CONTROL,
      "Vercel-CDN-Cache-Control": CACHE_CONTROL,
      "X-Mauri-Cache": cacheStatus,
      Vary: "X-MauriResults-Client, Accept-Encoding",
    },
  });
}

function isLegacyNativeRequest(request: Request) {
  if (request.headers.get("x-mauriresults-client") === "flutter-native") return false;
  const userAgent = String(request.headers.get("user-agent") || "").toLowerCase();
  return userAgent.includes("okhttp") || userAgent.includes("expo") || userAgent.includes("reactnative") || userAgent.includes("react-native");
}

export async function GET(request: Request) {
  if (isLegacyNativeRequest(request)) {
    return NextResponse.json(
      {
        error: "هذا الإصدار متوقف. نزّل تحديث MauriResults الجديد 3.0.0.",
        updateRequired: true,
        minimumSupportedVersion: REQUIRED_APP_VERSION,
        downloadUrl: `${SITE_URL}/Apk/`,
      },
      { status: 426, headers: { "Cache-Control": "no-store" } }
    );
  }

  const source = String(new URL(request.url).searchParams.get("source") || "").trim();
  if (!source.startsWith("upload:") && !LEGACY_VIEWS[source]) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const cached = memoryCache.get(source);
  const age = cached ? Date.now() - cached.createdAt : Infinity;
  if (cached && age < FRESH_MS) return json(cached.data, "HIT");
  if (cached && age < STALE_MS) {
    void loadDashboard(source).catch(() => undefined);
    return json(cached.data, "STALE");
  }

  try {
    return json(await loadDashboard(source), "MISS");
  } catch {
    if (cached) return json(cached.data, "STALE-IF-ERROR");
    return NextResponse.json(
      { error: "تعذر تحميل الإحصائيات مؤقتًا" },
      {
        status: 503,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-if-error=300",
          "Retry-After": "30",
        },
      }
    );
  }
}
