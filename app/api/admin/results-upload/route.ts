import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const INSERT_CHUNK_SIZE = 500;
const MAX_ROWS = 120_000;

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

function safeColumnName(value: string) {
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
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = String(key || "").replace(/\u0000/g, "").trim();
    if (!cleanKey || cleanKey.startsWith("__EMPTY")) continue;
    output[cleanKey] = cleanCell(value);
  }
  return output;
}

function extractRows(fileBuffer: ArrayBuffer, sheetName?: string) {
  const workbook = XLSX.read(fileBuffer, {
    type: "array",
    cellDates: true,
    dense: false,
  });

  const targetSheetName = sheetName && workbook.SheetNames.includes(sheetName)
    ? sheetName
    : workbook.SheetNames[0];

  if (!targetSheetName) return { sheetName: "", rows: [] as Record<string, unknown>[] };

  const sheet = workbook.Sheets[targetSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  const rows = rawRows
    .map(normalizeRow)
    .filter((row) => Object.values(row).some((value) => value !== null && value !== ""));

  return { sheetName: targetSheetName, rows };
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
  if (!response.ok) {
    return { ok: false, status: response.status, error: text.replace(/\s+/g, " ").slice(0, 700) } as const;
  }

  return { ok: true, status: response.status, data: text ? JSON.parse(text) : null } as const;
}

async function prepareSpeed(table: string, numberColumn: string, nameColumn: string, scoreColumn: string) {
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
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, error: text.replace(/\s+/g, " ").slice(0, 700) } as const;
  }

  return { ok: true, status: response.status, data: text ? JSON.parse(text) : null } as const;
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
    return { ok: false, status: response.status, error: text.replace(/\s+/g, " ").slice(0, 600) } as const;
  }

  return { ok: true, status: response.status } as const;
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return json(401, { ok: false, error: "Unauthorized admin upload" });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: "Invalid multipart form data" });
  }

  const file = form.get("file");
  const source = String(form.get("source") || "").trim();
  const customTable = safeTableName(String(form.get("table") || ""));
  const dryRun = String(form.get("dryRun") || "true") !== "false";
  const createTable = String(form.get("createTable") || "false") === "true";
  const speedSetup = String(form.get("speedSetup") || "true") !== "false";
  const numberColumn = safeColumnName(String(form.get("numberColumn") || ""));
  const nameColumn = safeColumnName(String(form.get("nameColumn") || ""));
  const scoreColumn = safeColumnName(String(form.get("scoreColumn") || ""));
  const sheetName = String(form.get("sheetName") || "").trim() || undefined;
  const table = customTable || TABLE_BY_SOURCE[source];

  if (!table) return json(400, { ok: false, error: "Choose a known exam source or provide a safe custom table name" });
  if (!(file instanceof File)) return json(400, { ok: false, error: "Missing XLSX file" });
  if (!/\.(xlsx|xls)$/i.test(file.name)) return json(400, { ok: false, error: "Only .xlsx or .xls files are supported" });

  let parsed;
  try {
    parsed = extractRows(await file.arrayBuffer(), sheetName);
  } catch (error) {
    return json(400, { ok: false, error: `Unable to read Excel file: ${String(error)}` });
  }

  const rows = parsed.rows;
  if (!rows.length) return json(400, { ok: false, error: "No rows found in the first sheet" });
  if (rows.length > MAX_ROWS) return json(413, { ok: false, error: `Too many rows. Maximum is ${MAX_ROWS}. Split the file first.` });

  const columns: string[] = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  ).map((column) => String(column)).filter(Boolean);
  const previewRows = rows.slice(0, 5);

  if (dryRun) {
    return json(200, {
      ok: true,
      dryRun: true,
      createTable,
      speedSetup,
      speedColumns: { numberColumn, nameColumn, scoreColumn },
      table,
      source: source || "custom",
      fileName: file.name,
      sheetName: parsed.sheetName,
      totalRows: rows.length,
      columns,
      previewRows,
      message: createTable
        ? "Preview only. The table and speed setup will run when dryRun=false."
        : "Preview only. Send dryRun=false to publish rows to Supabase.",
    });
  }

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

  let inserted = 0;
  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + INSERT_CHUNK_SIZE);
    const result = await insertChunk(table, chunk);
    if (!result.ok) {
      return json(result.status, {
        ok: false,
        table,
        tableCreated,
        inserted,
        failedAtRow: index + 1,
        error: result.error,
      });
    }
    inserted += chunk.length;
  }

  let speedResult: unknown = null;
  if (speedSetup && (numberColumn || nameColumn || scoreColumn)) {
    const prepared = await prepareSpeed(table, numberColumn, nameColumn, scoreColumn);
    if (!prepared.ok) {
      return json(200, {
        ok: true,
        warning: true,
        dryRun: false,
        createTable,
        tableCreated,
        table,
        source: source || "custom",
        fileName: file.name,
        sheetName: parsed.sheetName,
        inserted,
        columns,
        speedError: prepared.error,
        hint: "Rows were uploaded, but speed setup failed. Run the prepare_results_table_speed SQL migration in Supabase first, then run speed setup again.",
      });
    }
    speedResult = prepared.data;
  }

  return json(200, {
    ok: true,
    dryRun: false,
    createTable,
    tableCreated,
    table,
    source: source || "custom",
    fileName: file.name,
    sheetName: parsed.sheetName,
    inserted,
    columns,
    speedSetup,
    speedResult,
    message: tableCreated ? "Table created, results uploaded, and speed setup completed." : "Results uploaded successfully.",
  });
}
