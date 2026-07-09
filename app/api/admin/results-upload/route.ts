import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const MAX_CLIENT_CHUNK_SIZE = 2_000;

const TABLE_BY_SOURCE: Record<string, string> = {
  bac: "bac_results",
  brevet: "brevet_results",
  concours: "concours_results",
  bac_session: "bac_session2_results",
  excellence_1as: "excellence_1as_results",
};

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isAdmin(request: Request) {
  const supplied = request.headers.get("x-admin-secret") || "";
  return Boolean(ADMIN_SECRET) && supplied === ADMIN_SECRET;
}

function safeTableName(value: string) {
  const table = String(value || "").trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(table)) return "";
  return table;
}

function safeColumnName(value: unknown) {
  const column = String(value || "").replace(/\u0000/g, "").trim();
  if (!column || column.length > 120) return "";
  return column;
}

function cleanCell(value: unknown) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  const text = String(value).replace(/\u0000/g, "").trim();
  return text === "" ? null : text;
}

function normalizeRow(row: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row || {})) {
    const cleanKey = safeColumnName(key);
    if (!cleanKey || cleanKey.startsWith("__EMPTY")) continue;
    output[cleanKey] = cleanCell(value);
  }
  return output;
}

function inferColumns(rows: Record<string, unknown>[], supplied: unknown[] = []) {
  const fromPayload = supplied.map(safeColumnName).filter(Boolean);
  const fromRows = rows.flatMap((row) => Object.keys(row || {}).map(safeColumnName)).filter(Boolean);
  return Array.from(new Set([...fromPayload, ...fromRows]));
}

function compactError(text: string) {
  return text.replace(/\s+/g, " ").slice(0, 900);
}

function parseJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getInsertedCount(data: unknown, fallback: number) {
  if (data && typeof data === "object" && "inserted" in data) {
    const value = Number((data as { inserted?: unknown }).inserted);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

async function createUploadTable(table: string, columns: string[]) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, status: 500, error: "Missing Supabase service role environment variables" } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/create_results_upload_table`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_table_name: table, p_columns: columns }),
  });

  const text = await response.text();
  if (!response.ok) return { ok: false, status: response.status, error: compactError(text) } as const;
  return { ok: true, status: response.status, data: parseJson(text) } as const;
}

async function prepareSpeed(
  table: string,
  numberColumn: string,
  nameColumn: string,
  scoreColumn: string,
  wilayaColumn = "",
  moughataaColumn = "",
  centreColumn = ""
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, status: 500, error: "Missing Supabase service role environment variables" } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/prepare_results_table_speed`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      p_table_name: table,
      p_number_column: numberColumn || null,
      p_name_column: nameColumn || null,
      p_score_column: scoreColumn || null,
      p_wilaya_column: wilayaColumn || null,
      p_moughataa_column: moughataaColumn || null,
      p_centre_column: centreColumn || null,
    }),
  });

  const text = await response.text();
  if (!response.ok) return { ok: false, status: response.status, error: compactError(text) } as const;
  return { ok: true, status: response.status, data: parseJson(text) } as const;
}

async function insertChunk(table: string, rows: Record<string, unknown>[]) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, status: 500, error: "Missing Supabase service role environment variables" } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, status: response.status, error: compactError(text) } as const;
  }

  return { ok: true, status: response.status, data: null } as const;
}

async function insertRowsRpc(table: string, rows: Record<string, unknown>[], columns: string[]) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, status: 500, error: "Missing Supabase service role environment variables" } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/insert_results_upload_rows`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_table_name: table, p_rows: rows, p_columns: columns }),
  });

  const text = await response.text();
  if (!response.ok) return { ok: false, status: response.status, error: compactError(text) } as const;
  return { ok: true, status: response.status, data: parseJson(text) } as const;
}

type JsonUploadPayload = {
  source?: string;
  table?: string;
  rows?: Record<string, unknown>[];
  columns?: unknown[];
  createTable?: boolean;
  speedSetup?: boolean;
  numberColumn?: string;
  nameColumn?: string;
  scoreColumn?: string;
  wilayaColumn?: string;
  moughataaColumn?: string;
  centreColumn?: string;
  isLastChunk?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
  fileName?: string;
  sheetName?: string;
};

async function handleJsonUpload(payload: JsonUploadPayload) {
  const source = String(payload.source || "").trim();
  const customTable = safeTableName(String(payload.table || ""));
  const table = customTable || TABLE_BY_SOURCE[source];
  const rows = Array.isArray(payload.rows) ? payload.rows.map(normalizeRow).filter((row) => Object.keys(row).length) : [];
  const columns = inferColumns(rows, Array.isArray(payload.columns) ? payload.columns : []);
  const createTable = Boolean(payload.createTable);
  const speedSetup = payload.speedSetup !== false;
  const isLastChunk = Boolean(payload.isLastChunk);
  const numberColumn = safeColumnName(payload.numberColumn);
  const nameColumn = safeColumnName(payload.nameColumn);
  const scoreColumn = safeColumnName(payload.scoreColumn);
  const wilayaColumn = safeColumnName(payload.wilayaColumn);
  const moughataaColumn = safeColumnName(payload.moughataaColumn);
  const centreColumn = safeColumnName(payload.centreColumn);
  const useRpcInsert = Boolean(customTable);

  if (!table) return json(400, { ok: false, error: "Choose a known exam source or provide a safe custom table name" });
  if (!rows.length) return json(400, { ok: false, error: "Missing rows chunk" });
  if (!columns.length) return json(400, { ok: false, error: "Missing columns" });
  if (rows.length > MAX_CLIENT_CHUNK_SIZE) return json(413, { ok: false, error: `Chunk too large. Maximum ${MAX_CLIENT_CHUNK_SIZE} rows per request.` });

  let tableCreated = false;
  if (createTable) {
    const created = await createUploadTable(table, columns);
    if (!created.ok) {
      return json(created.status, {
        ok: false,
        table,
        error: created.error,
        hint: "Run the create_results_upload_table SQL migration in Supabase first.",
      });
    }
    tableCreated = true;
  }

  const insertedResult = useRpcInsert ? await insertRowsRpc(table, rows, columns) : await insertChunk(table, rows);
  if (!insertedResult.ok) {
    return json(insertedResult.status, {
      ok: false,
      table,
      tableCreated,
      inserted: 0,
      error: insertedResult.error,
      hint: useRpcInsert ? "Run the insert_results_upload_rows SQL in Supabase, then try again." : undefined,
    });
  }

  const insertedCount = getInsertedCount(insertedResult.data, rows.length);

  let speedResult: unknown = null;
  if (isLastChunk && speedSetup && (numberColumn || nameColumn || scoreColumn)) {
    const prepared = await prepareSpeed(table, numberColumn, nameColumn, scoreColumn, wilayaColumn, moughataaColumn, centreColumn);
    if (!prepared.ok) {
      return json(200, {
        ok: true,
        warning: true,
        table,
        tableCreated,
        inserted: insertedCount,
        columns,
        speedError: prepared.error,
        hint: "Rows were uploaded, but speed setup failed. Run the upload_speed_hardening SQL migration in Supabase first, then upload again or run prepare_results_table_speed manually.",
      });
    }
    speedResult = prepared.data;
  }

  return json(200, {
    ok: true,
    table,
    tableCreated,
    inserted: insertedCount,
    columns,
    speedSetup,
    speedResult,
    chunkIndex: payload.chunkIndex,
    totalChunks: payload.totalChunks,
    message: isLastChunk ? "Upload completed." : "Chunk uploaded.",
  });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return json(401, { ok: false, error: "Unauthorized admin upload" });

  try {
    const payload = await request.json();
    return handleJsonUpload(payload as JsonUploadPayload);
  } catch (error) {
    return json(400, { ok: false, error: `Invalid JSON upload payload: ${String(error)}` });
  }
}
