import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const TABLE = "site_content";
const REQUEST_TIMEOUT_MS = 12_000;

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function assertAdmin(request) {
  if (!ADMIN_SECRET) return { error: json({ error: "ADMIN_SECRET is not configured." }, 503) };
  const provided = request.headers.get("x-admin-secret");
  if (provided !== ADMIN_SECRET) return { error: json({ error: "Unauthorized" }, 401) };
  if (!SUPABASE_URL || !SERVICE_KEY) return { error: json({ error: "Supabase server credentials are not configured." }, 503) };
  return {};
}

async function supabase(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const { signal, ...fetchOptions } = options;

  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...fetchOptions,
      cache: "no-store",
      signal: signal || controller.signal,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    if (!response.ok) throw new Error(text || response.statusText);
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Supabase request timed out. Please retry.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const params = new URLSearchParams({
      select: "content_key,title,value,type,storage_path,updated_at",
      order: "content_key.asc",
    });
    const rows = await supabase(`/rest/v1/${TABLE}?${params}`);
    return json({ items: rows || [] });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function PUT(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [body];
    const payload = items
      .filter((item) => item?.content_key)
      .map((item) => ({
        content_key: String(item.content_key),
        title: item.title ? String(item.title) : null,
        value: item.value == null ? null : String(item.value),
        type: item.type ? String(item.type) : "text",
      }));

    if (!payload.length) return json({ error: "No content items provided." }, 400);

    const params = new URLSearchParams({ on_conflict: "content_key" });
    const rows = await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });
    return json({ items: rows || [] });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function DELETE(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const { content_key } = await request.json();
    if (!content_key) return json({ error: "content_key is required." }, 400);

    const params = new URLSearchParams({ content_key: `eq.${content_key}` });
    const rows = await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ value: null }),
    });
    return json({ items: rows || [] });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
