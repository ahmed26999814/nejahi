const TABLES = [
  "bac_results",
  "bac_session2_results",
  "brevet_results",
  "concours_results",
  "excellence_1as_results",
];

export const dynamic = "force-dynamic";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || anonKey;

  return {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    usingServiceRole: Boolean(serviceKey),
    url,
    key,
  };
}

async function inspectTable(table, config) {
  if (!config.url || !config.key) {
    return {
      table,
      ok: false,
      count: null,
      firstRow: null,
      error: "Missing Supabase URL or key",
    };
  }

  const url = new URL(`${config.url}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: "application/json",
        Prefer: "count=exact",
        Range: "0-0",
      },
    });

    const text = await response.text();
    let rows = [];
    try {
      rows = text ? JSON.parse(text) : [];
    } catch {
      rows = [];
    }

    const contentRange = response.headers.get("content-range") || "";
    const countMatch = contentRange.match(/\/(\d+)$/);

    return {
      table,
      ok: response.ok,
      status: response.status,
      count: countMatch ? Number(countMatch[1]) : rows.length,
      firstRow: Array.isArray(rows) ? rows[0] || null : null,
      columns: Array.isArray(rows) && rows[0] ? Object.keys(rows[0]) : [],
      error: response.ok ? null : text,
    };
  } catch (error) {
    return {
      table,
      ok: false,
      count: null,
      firstRow: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET() {
  const config = getSupabaseConfig();
  const tables = await Promise.all(TABLES.map((table) => inspectTable(table, config)));

  return Response.json({
    ok: tables.every((table) => table.ok),
    source: "supabase-rest",
    generatedAt: new Date().toISOString(),
    env: {
      hasUrl: config.hasUrl,
      hasAnonKey: config.hasAnonKey,
      usingServiceRole: config.usingServiceRole,
    },
    tables,
  });
}
