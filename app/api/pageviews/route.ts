import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 2_500;
const CANONICAL_HOST = "mauri-results.vercel.app";

function isCanonicalBrowserRequest(request: Request) {
  const headers = request.headers;
  const host = String(headers.get("x-forwarded-host") || headers.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (host !== CANONICAL_HOST) return false;

  const fetchSite = String(headers.get("sec-fetch-site") || "").toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== CANONICAL_HOST) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !isCanonicalBrowserRequest(request)) {
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_site_pageview`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
  } catch {
    // Page-view tracking is deliberately best-effort and must never affect UX.
  }

  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
