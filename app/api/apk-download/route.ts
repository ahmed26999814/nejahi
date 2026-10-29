import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const APK_URL = "https://nxizqnlemsbjmsfyuevg.supabase.co/storage/v1/object/public/app-releases/MauriResults-3.3.0.apk";

async function supabaseRequest(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function apkAvailable() {
  return fetch(APK_URL, {
    method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(3000),
  }).then((response) => response.ok && /application\/(?:vnd\.android\.package-archive|octet-stream)/i.test(response.headers.get("content-type") || "")).catch(() => false);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "status") {
    const available = await apkAvailable();
    return NextResponse.json({ available }, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
    });
  }

  if (action === "count") {
    const rows = await supabaseRequest("apk_download_stats?select=downloads&id=eq.mauriresults&limit=1").catch(() => null);
    const downloads = Number(rows?.[0]?.downloads || 0);
    return NextResponse.json(
      { downloads },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
    );
  }

  if (!await apkAvailable()) {
    return NextResponse.redirect(new URL("/apk?download=unavailable", request.url), 303);
  }

  await supabaseRequest("rpc/increment_apk_download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_id: "mauriresults" }),
  }).catch(() => null);

  return NextResponse.redirect(APK_URL, 302);
}
