import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const TABLE = "result_alert_subscriptions";
const REQUEST_TIMEOUT_MS = 12_000;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function assertAdmin(request) {
  if (!ADMIN_SECRET) return { error: json({ error: "ADMIN_SECRET is not configured." }, 503) };
  if (request.headers.get("x-admin-secret") !== ADMIN_SECRET) {
    return { error: json({ error: "Unauthorized" }, 401) };
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { error: json({ error: "Supabase server credentials are not configured." }, 503) };
  }
  return {};
}

function cleanQuery(value) {
  return String(value ?? "")
    .replace(/[,%*().]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function parseId(value) {
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

async function supabase(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || response.statusText);
    return {
      data: text ? JSON.parse(text) : null,
      contentRange: response.headers.get("content-range") || "",
    };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Supabase request timed out. Please retry.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(20, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const query = cleanQuery(url.searchParams.get("query"));
    const offset = (page - 1) * limit;

    const params = new URLSearchParams({
      select: "id,exam_slug,full_name,whatsapp,whatsapp_normalized,notified,created_at,updated_at,notified_at",
      order: "created_at.desc",
      offset: String(offset),
      limit: String(limit),
    });

    if (query) {
      const digits = query.replace(/\D/g, "");
      const filters = [`full_name.ilike.*${query}*`, `whatsapp.ilike.*${query}*`];
      if (digits) filters.push(`whatsapp_normalized.ilike.*${digits}*`);
      params.set("or", `(${filters.join(",")})`);
    }

    const result = await supabase(`/rest/v1/${TABLE}?${params}`, {
      headers: { Prefer: "count=exact" },
    });
    const total = Number.parseInt(result.contentRange.split("/")[1] || "0", 10) || 0;

    return json({
      items: result.data || [],
      total,
      page,
      limit,
      has_more: offset + (result.data?.length || 0) < total,
    });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function PATCH(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const id = parseId(body.id);
    if (!id) return json({ error: "A valid id is required." }, 400);

    const notified = Boolean(body.notified);
    const params = new URLSearchParams({ id: `eq.${id}` });
    const result = await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        notified,
        notified_at: notified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }),
    });

    return json({ item: result.data?.[0] || null });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function DELETE(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const id = parseId(body.id);
    if (!id) return json({ error: "A valid id is required." }, 400);

    const params = new URLSearchParams({ id: `eq.${id}` });
    await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });

    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
