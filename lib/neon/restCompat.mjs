import { neon } from "@neondatabase/serverless";

// PostgREST compatibility bridge for server-initiated calls only.
// No request path is publicly routable; it is installed exclusively in
// the explicit Neon PREVIEW application environment, never in production.
// Reject unsupported PostgREST grammar instead of quietly returning wrong data.
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
const qid = (value) => {
  if (!identifier.test(value)) throw new Error("Invalid SQL identifier");
  return '"' + value.replaceAll('"', '""') + '"';
};
const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-mauri-database": "neon-staging-bridge",
};
const bridgeError = (status, message) => new Response(
  JSON.stringify({ code: "NEON_BRIDGE", message }),
  { status, headers: jsonHeaders },
);
const stringValue = (v) => typeof v === "string" ? v : JSON.stringify(v);
const safeLimit = (v, fallback, max) => {
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 0 ? Math.min(max, n) : fallback;
};

function newSql() {
  const url = process.env.NEON_DATABASE_URL || process.env.NEON_STAGING_DATABASE_URL;
  if (!url) throw new Error("Neon staging DB is not configured");
  return neon(url);
}

function buildFilter(key, condition, params) {
  const column = qid(key);
  const raw = String(condition);
  const ops = [
    ["not.is.", "IS NOT"],
    ["not.eq.", "IS DISTINCT FROM"],
    ["not.ilike.", "NOT ILIKE"],
    ["not.like.", "NOT LIKE"],
    ["not.in.", "NOT IN"],
    ["ilike.", "ILIKE"],
    ["like.", "LIKE"],
    ["gte.", ">="],
    ["lte.", "<="],
    ["neq.", "<>"],
    ["gt.", ">"],
    ["lt.", "<"],
    ["eq.", "="],
    ["is.", "IS"],
    ["in.", "IN"],
  ];
  const op = ops.find(([prefix]) => raw.startsWith(prefix));
  if (!op) throw new Error("Unsupported PostgREST filter");
  const [prefix, sqlOp] = op;
  const value = raw.slice(prefix.length);
  if (sqlOp === "IS" || sqlOp === "IS NOT") {
    if (!["null", "true", "false"].includes(value.toLowerCase())) throw new Error("Unsupported IS filter");
    return column + " " + sqlOp + " " + value.toUpperCase();
  }
  if (sqlOp.endsWith(" IN")) {
    if (!value.startsWith("(") || !value.endsWith(")")) throw new Error("Malformed IN filter");
    const items = value.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
    if (!items.length || items.length > 250) throw new Error("IN list is empty or too large");
    const slots = items.map(item => {
      params.push(item.replace(/^"(.*)"$/, "$1"));
      return "$" + params.length;
    });
    return column + " " + sqlOp + " (" + slots.join(",") + ")";
  }
  let clean = value;
  if (sqlOp.includes("LIKE")) clean = value.replace(/\*/g, "%");
  params.push(clean);
  return column + " " + sqlOp + " $" + params.length;
}

function splitFilters(raw) {
  // Split at commas outside nested parentheses and quoted literals.
  const parts = [];
  let depth = 0, quoted = false, escaped = false, start = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (escaped) { escaped = false; continue; }
    if (c === "\\") { escaped = true; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (!quoted && c === "(") depth++;
    if (!quoted && c === ")") depth--;
    if (!quoted && depth === 0 && c === ",") {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return parts.map(x => x.trim()).filter(Boolean);
}

function buildDisjunction(raw, params) {
  if (!raw.startsWith("(") || !raw.endsWith(")")) throw new Error("Malformed OR filter");
  const terms = splitFilters(raw.slice(1, -1)).map(phrase => {
    const dot = phrase.indexOf(".");
    if (dot < 1) throw new Error("Malformed OR term");
    return buildFilter(phrase.slice(0, dot), phrase.slice(dot + 1), params);
  });
  if (!terms.length || terms.length > 20) throw new Error("Invalid OR filter terms");
  return "(" + terms.join(" OR ") + ")";
}

function buildWhere(search, params) {
  const parts = [];
  const reserved = new Set(["select", "order", "limit", "offset", "or", "and", "columns", "on_conflict"]);
  for (const [key, val] of search) {
    if (key === "or") parts.push(buildDisjunction(val, params));
    else if (key === "and") {
      if (!val.startsWith("(") || !val.endsWith(")")) throw new Error("Malformed AND filter");
      const terms = splitFilters(val.slice(1, -1)).map(phrase => {
        const dot = phrase.indexOf(".");
        if (dot < 1) throw new Error("Malformed AND term");
        return buildFilter(phrase.slice(0, dot), phrase.slice(dot + 1), params);
      });
      parts.push("(" + terms.join(" AND ") + ")");
    } else if (!reserved.has(key)) {
      parts.push(buildFilter(key, val, params));
    }
  }
  return parts.length ? " WHERE " + parts.join(" AND ") : "";
}

function columns(search) {
  const requested = search.get("select") || "*";
  if (requested === "*") return "*";
  const keys = requested.split(",").map(s => s.trim());
  const quotedIdentifier = /^"(?:[^"]|"")*"$/;
  if (!keys.length || keys.length > 120 || keys.some(s =>
    s.length > 130 || (!identifier.test(s) && !quotedIdentifier.test(s)))) {
    throw new Error("Unsupported PostgREST select projection");
  }
  return keys.map(s => identifier.test(s) ? qid(s) : s).join(", ");
}
function orderBy(search) {
  const raw = search.get("order");
  if (!raw) return "";
  const parts = raw.split(",").map(item => {
    const [col, direction, nulls] = item.split(".");
    if (!identifier.test(col)) throw new Error("Unsafe ordering");
    if (direction && !["asc", "desc"].includes(direction)) throw new Error("Unsupported order");
    if (nulls && !["nullsfirst", "nullslast"].includes(nulls)) throw new Error("Unsupported nulls order");
    return qid(col) + " " + (direction || "asc").toUpperCase()
      + (nulls ? " NULLS " + (nulls === "nullsfirst" ? "FIRST" : "LAST") : "");
  });
  return " ORDER BY " + parts.join(", ");
}
function encodeBody(value, header) {
  return new Response(value === undefined ? "" : JSON.stringify(value), {
    status: header?.status || 200,
    headers: { ...jsonHeaders, ...(header?.headers || {}) },
  });
}

async function readTable(sql, table, url, method, headers) {
  const params = [];
  const where = buildWhere(url.searchParams, params);
  const projection = columns(url.searchParams);
  const order = orderBy(url.searchParams);
  const limit = safeLimit(url.searchParams.get("limit"), 1000, 10000);
  const offset = safeLimit(url.searchParams.get("offset"), 0, 10_000_000);
  const source = "public." + qid(table);
  const query = "SELECT " + projection + " FROM " + source + where + order
    + " LIMIT " + limit + " OFFSET " + offset;
  const result = method === "HEAD" ? [] : await sql.query(query, params);
  const outputHeaders = {};
  if ((headers.get("prefer") || "").includes("count=exact")) {
    const countRows = await sql.query("SELECT count(*)::int AS total FROM " + source + where, params);
    const total = Number(countRows[0]?.total || 0);
    outputHeaders["content-range"] = total ? offset + "-" + (offset + Math.max(0, result.length - 1)) + "/" + total : "*/0";
  }
  if (method === "HEAD") return new Response(null, { status: 200, headers: { ...jsonHeaders, ...outputHeaders } });
  const wantsObject = (headers.get("accept") || "").includes("vnd.pgrst.object");
  if (wantsObject && result.length !== 1) return bridgeError(406, "Expected exactly one row");
  return encodeBody(wantsObject ? result[0] : result, { headers: outputHeaders });
}

async function writeTable(sql, table, url, method, headers, body) {
  if (!["POST", "PATCH", "DELETE"].includes(method)) throw new Error("Unsupported write method");
  const source = "public." + qid(table);
  const params = [];
  const wantsData = (headers.get("prefer") || "").includes("return=representation");
  let query;
  if (method === "DELETE") {
    const where = buildWhere(url.searchParams, params);
    if (!where) throw new Error("Refusing unfiltered DELETE");
    query = "DELETE FROM " + source + where + (wantsData ? " RETURNING *" : "");
  } else if (method === "PATCH") {
    const whereParams = [];
    const where = buildWhere(url.searchParams, whereParams);
    if (!where) throw new Error("Refusing unfiltered UPDATE");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected object");
    const fields = Object.keys(body);
    if (!fields.length || fields.length > 120) throw new Error("Invalid update fields");
    const setClauses = fields.map(k => {
      params.push(stringValue(body[k]));
      return qid(k) + "=$" + params.length;
    });
    const shiftedWhere = where.replace(/\$(\d+)/g, (_, n) => "$" + (Number(n) + params.length));
    params.push(...whereParams);
    query = "UPDATE " + source + " SET " + setClauses.join(", ") + shiftedWhere
      + (wantsData ? " RETURNING *" : "");
  } else {
    const rows = Array.isArray(body) ? body : [body];
    if (!rows.length || rows.length > 500 || rows.some(row => !row || typeof row !== "object" || Array.isArray(row))) {
      throw new Error("Invalid insertion payload");
    }
    const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
    if (!keys.length || keys.length > 120) throw new Error("Invalid insertion columns");
    params.push(JSON.stringify(rows));
    const fields = keys.map(qid).join(", ");
    query = "INSERT INTO " + source + "(" + fields + ") SELECT " + fields
      + " FROM jsonb_populate_recordset(NULL::" + source + ", $1::jsonb)";
    const prefer = headers.get("prefer") || "";
    const onConflict = url.searchParams.get("on_conflict");
    if (prefer.includes("resolution=merge-duplicates")) {
      if (!onConflict) throw new Error("Upsert requires an explicit conflict key");
      const columns = onConflict.split(",").map(x => x.trim());
      if (!columns.length || columns.length > 3 || columns.some(x => !identifier.test(x))) {
        throw new Error("Invalid conflict key");
      }
      const conflicts = columns.map(qid).join(",");
      const changes = keys.filter(k => !columns.includes(k)).map(k => qid(k) + "=EXCLUDED." + qid(k));
      query += " ON CONFLICT (" + conflicts + ") "
        + (changes.length ? "DO UPDATE SET " + changes.join(",") : "DO NOTHING");
    }
    query += wantsData ? " RETURNING *" : "";
  }
  const result = await sql.query(query, params);
  return wantsData ? encodeBody(result, { status: method === "POST" ? 201 : 200 }) : new Response(null, {
    status: method === "POST" ? 201 : 204, headers: jsonHeaders,
  });
}

async function callRpc(sql, fn, body) {
  const args = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const keys = Object.keys(args);
  if (keys.length > 40) throw new Error("Too many RPC arguments");
  const meta = await sql.query(
    "SELECT p.proretset AS returns_rows, t.typname AS return_type FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_type t ON t.oid=p.prorettype WHERE n.nspname='public' AND p.proname=$1 AND p.prokind='f' AND p.pronargs >= $2 ORDER BY p.pronargs LIMIT 1",
    [fn, keys.length],
  );
  if (!meta.length) return bridgeError(404, "Unknown stored procedure");
  const named = keys.map((key, i) => qid(key) + " := $" + (i + 1)).join(", ");
  const argsValues = keys.map(k => {
    const v = args[k];
    if (Array.isArray(v)) return "{" + v.map(x => String(x).replaceAll('"', '\\"')).map(x => '"' + x + '"').join(",") + "}";
    return typeof v === "object" && v !== null ? JSON.stringify(v) : v;
  });
  const func = "public." + qid(fn) + "(" + named + ")";
  if (meta[0].returns_rows) {
    if (meta[0].return_type === "jsonb" || meta[0].return_type === "json") {
      const rows = await sql.query("SELECT " + func + " AS value", argsValues);
      return encodeBody(rows.map(row => row.value));
    }
    const rows = await sql.query("SELECT * FROM " + func, argsValues);
    return encodeBody(rows);
  }
  const rows = await sql.query("SELECT " + func + " AS value", argsValues);
  return encodeBody(rows[0]?.value ?? null);
}

export async function neonRestFetch(input, options = {}) {
  if (process.env.NEXT_PUBLIC_NEON_MODE !== "1") return null;
  let url;
  try {
    const value = typeof input === "string" || input instanceof URL
      ? String(input) : input instanceof Request ? input.url : String(input);
    url = new URL(value);
  } catch { return null; }
  if (!url.hostname.endsWith(".supabase.co") || !url.pathname.startsWith("/rest/v1/")) return null;

  const method = String(options.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  const headers = new Headers(options.headers || (input instanceof Request ? input.headers : {}));
  const path = decodeURIComponent(url.pathname.slice("/rest/v1/".length));
  const parts = path.split("/");
  try {
    const sql = newSql();
    let body;
    if (options.body != null) {
      body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
    } else if (input instanceof Request && method !== "GET" && method !== "HEAD") {
      body = await input.clone().json();
    }
    if (parts[0] === "rpc" && parts.length === 2) {
      qid(parts[1]);
      if (method !== "POST" && method !== "GET") return bridgeError(405, "Unsupported RPC method");
      return await callRpc(sql, parts[1], body || Object.fromEntries(url.searchParams));
    }
    if (parts.length !== 1) return bridgeError(404, "Unsupported REST path");
    const table = parts[0];
    qid(table);
    if (method === "GET" || method === "HEAD") return await readTable(sql, table, url, method, headers);
    return await writeTable(sql, table, url, method, headers, body);
  } catch (error) {
    // Never pass through SQL details: an internal failure must fail closed.
    return bridgeError(503, "Neon staging request could not be completed");
  }
}
