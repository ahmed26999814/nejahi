import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const APK_PATH = "/apk/MauriResults-3.2.0.apk";

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
  });
  if (!response.ok) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "count") {
    const rows = await supabaseRequest("apk_download_stats?select=downloads&id=eq.mauriresults&limit=1");
    const downloads = Number(rows?.[0]?.downloads || 0);
    return NextResponse.json(
      { downloads },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
    );
  }

  await supabaseRequest("rpc/increment_apk_download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_id: "mauriresults" }),
  });

  return NextResponse.redirect(new URL(APK_PATH, url.origin), 302);
}
