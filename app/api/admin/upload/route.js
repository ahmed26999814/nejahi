import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const BUCKET = "site-images";
const TABLE = "site_content";

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
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || response.statusText);
  return text ? JSON.parse(text) : null;
}

function publicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export async function POST(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const key = String(form.get("content_key") || "");
    const title = String(form.get("title") || key);
    const previousPath = String(form.get("previous_path") || "");

    if (!key || !file || typeof file.arrayBuffer !== "function") {
      return json({ error: "content_key and file are required." }, 400);
    }
    if (!file.type?.startsWith("image/")) {
      return json({ error: "Only image uploads are allowed." }, 400);
    }

    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const storagePath = `${key}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const buffer = await file.arrayBuffer();

    await supabase(`/storage/v1/object/${BUCKET}/${storagePath}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (previousPath) {
      await supabase(`/storage/v1/object/${BUCKET}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [previousPath] }),
      }).catch(() => null);
    }

    const imageUrl = publicUrl(storagePath);
    const params = new URLSearchParams({ on_conflict: "content_key" });
    const rows = await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        content_key: key,
        title,
        value: imageUrl,
        type: "image",
        storage_path: storagePath,
      }),
    });

    return json({ item: rows?.[0], image_url: imageUrl, storage_path: storagePath });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function DELETE(request) {
  const { error } = assertAdmin(request);
  if (error) return error;

  try {
    const { content_key, storage_path } = await request.json();
    if (!content_key) return json({ error: "content_key is required." }, 400);

    if (storage_path) {
      await supabase(`/storage/v1/object/${BUCKET}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [storage_path] }),
      }).catch(() => null);
    }

    const params = new URLSearchParams({ content_key: `eq.${content_key}` });
    const rows = await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ value: null, storage_path: null }),
    });
    return json({ items: rows || [] });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
