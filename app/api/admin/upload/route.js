import { NextResponse } from "next/server";
import { putNeonImage, deleteOwnedNeonImage } from "../../../../lib/neon/imageStorage.mjs";
import { neon } from "@neondatabase/serverless";
import { IMAGE_ITEMS } from "../../../../constants/adminContent";

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


const NEON_PREVIEW = process.env.NEXT_PUBLIC_NEON_MODE === "1";
const UPLOAD_LIMIT_BYTES = 3_500_000;
const SAFE_MIME = Object.freeze({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
});
const IMAGE_KEYS = new Set(IMAGE_ITEMS.map(item => item.key));
function stagingSql() {
  if (!(process.env.NEON_DATABASE_URL || process.env.NEON_STAGING_DATABASE_URL)) throw new Error("Neon staging not configured");
  return neon(process.env.NEON_DATABASE_URL || process.env.NEON_STAGING_DATABASE_URL);
}
async function uploadStagingImage(request) {
  const form = await request.formData();
  const file = form.get("file");
  const key = String(form.get("content_key") || "");
  const title = String(form.get("title") || key).slice(0, 180);
  const previousPath = String(form.get("previous_path") || "");
  if (!IMAGE_KEYS.has(key) || !file || typeof file.arrayBuffer !== "function") {
    return json({ error: "Invalid image key or file" }, 400);
  }
  const extension = SAFE_MIME[file.type];
  if (!extension || !Number.isFinite(file.size) || file.size < 1 || file.size > UPLOAD_LIMIT_BYTES) {
    return json({ error: "Only PNG, JPEG or WebP images up to 3.5MB are accepted" }, 400);
  }
  let imageUrl = "";
  const path = "site-images/" + key + "/" + Date.now() + "-" + crypto.randomUUID() + "." + extension;
  try {
    imageUrl = await putNeonImage(path, Buffer.from(await file.arrayBuffer()), file.type);
    const sql = stagingSql();
    const rows = await sql.query(
      "INSERT INTO public.site_content(content_key,title,value,type,storage_path) VALUES ($1,$2,$3,'image',$4) ON CONFLICT(content_key) DO UPDATE SET title=EXCLUDED.title,value=EXCLUDED.value,type='image',storage_path=EXCLUDED.storage_path RETURNING *",
      [key, title, imageUrl, imageUrl],
    );
    if (previousPath && previousPath !== imageUrl) {
      await deleteOwnedNeonImage(previousPath).catch(() => {});
    }
    return json({ item: rows[0], image_url: imageUrl, storage_path: imageUrl });
  } catch {
    if (imageUrl) await deleteOwnedNeonImage(imageUrl).catch(() => {});
    return json({ error: "Neon Object Storage unavailable" }, 503);
  }
}
async function deleteStagingImage(request) {
  const { content_key, storage_path } = await request.json();
  if (!IMAGE_KEYS.has(String(content_key || ""))) return json({ error: "Invalid image key" }, 400);
  try {
    const sql = stagingSql();
    const rows = await sql.query(
      "UPDATE public.site_content SET value=NULL,storage_path=NULL WHERE content_key=$1 RETURNING *",
      [content_key],
    );
    if (storage_path) await deleteOwnedNeonImage(storage_path).catch(() => {});
    return json({ items: rows });
  } catch {
    return json({ error: "Image removal unavailable" }, 503);
  }
}

export async function POST(request) {
  const { error } = assertAdmin(request);
  if (error) return error;
  if (NEON_PREVIEW) return uploadStagingImage(request);

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
  if (NEON_PREVIEW) return deleteStagingImage(request);

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
