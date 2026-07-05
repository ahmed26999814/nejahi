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
  let host = "";
  let projectRef = "";

  try {
    host = url ? new URL(url).host : "";
    projectRef = host.endsWith(".supabase.co") ? host.replace(".supabase.co", "") : host.split(".")[0] || "";
  } catch {
    host = "";
    projectRef = "";
  }

  return {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceKey),
    host,
    projectRef,
    url,
    anonKey,
    serviceKey,
  };
}

async function readTableWithKey(table, config, key, mode) {
  if (!config.url || !key) {
    return {
      mode,
      available: false,
      ok: false,
      count: null,
      firstRow: null,
      columns: [],
      error: `Missing ${mode} key or Supabase URL`,
    };
  }

  const url = new URL(`${config.url}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
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
      mode,
      available: true,
      ok: response.ok,
      status: response.status,
      count: countMatch ? Number(countMatch[1]) : rows.length,
      firstRow: Array.isArray(rows) ? rows[0] || null : null,
      columns: Array.isArray(rows) && rows[0] ? Object.keys(rows[0]) : [],
      error: response.ok ? null : text,
    };
  } catch (error) {
    return {
      mode,
      available: true,
      ok: false,
      count: null,
      firstRow: null,
      columns: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function inspectTable(table, config) {
  const [anon, serviceRole] = await Promise.all([
    readTableWithKey(table, config, config.anonKey, "anon"),
    readTableWithKey(table, config, config.serviceKey, "serviceRole"),
  ]);

  let diagnosis = "unknown";
  if (!anon.ok) diagnosis = "anon-request-failed";
  else if (serviceRole.available && serviceRole.ok && anon.count === 0 && serviceRole.count > 0) diagnosis = "rls-or-anon-select-policy";
  else if (serviceRole.available && serviceRole.ok && serviceRole.count === 0) diagnosis = "empty-in-this-project-or-wrong-table";
  else if (!serviceRole.available && anon.count === 0) diagnosis = "anon-sees-zero-add-service-role-to-confirm-rls-vs-empty";
  else if (anon.count > 0) diagnosis = "anon-can-read";

  return {
    table,
    diagnosis,
    anon,
    serviceRole,
  };
}

export async function GET() {
  const config = getSupabaseConfig();
  const tables = await Promise.all(TABLES.map((table) => inspectTable(table, config)));

  return Response.json({
    ok: tables.every((table) => table.anon.ok || table.serviceRole.ok),
    source: "supabase-rest",
    generatedAt: new Date().toISOString(),
    env: {
      hasUrl: config.hasUrl,
      hasAnonKey: config.hasAnonKey,
      hasServiceRoleKey: config.hasServiceRoleKey,
      supabaseHost: config.host,
      projectRef: config.projectRef,
    },
    note: "Counts are read from the Supabase project shown in env.projectRef. serviceRole counts bypass RLS only when SUPABASE_SERVICE_ROLE_KEY is configured on the server.",
    tables,
  });
}
