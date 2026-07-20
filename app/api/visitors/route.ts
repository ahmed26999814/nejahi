import { createHash, randomUUID } from "node:crypto";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VISITOR_COOKIE = "mauriresults_visitor_id";
const ONE_YEAR = 60 * 60 * 24 * 365;
const REQUEST_TIMEOUT_MS = 5_000;
const COUNT_CACHE = "public, max-age=30, s-maxage=60, stale-while-revalidate=3600, stale-if-error=86400";

function hashValue(prefix: string, value: string) {
  const salt = process.env.ADMIN_SECRET || "mauriresults-visitors";
  return createHash("sha256").update(`${salt}:${prefix}:${value}`).digest("hex");
}

async function supabaseRpc(name: string, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Missing Supabase server variables");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    ...options,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text.slice(0, 500) || `HTTP ${response.status}`);
  return text ? JSON.parse(text) : 0;
}

async function fetchVisitorCount() {
  const parsed = await supabaseRpc("get_site_visit_count");
  return Number(Array.isArray(parsed) ? parsed[0] : parsed) || 0;
}

const cachedVisitorCount = unstable_cache(
  fetchVisitorCount,
  ["mauriresults-visitor-count-v1"],
  { revalidate: 60 },
);

export async function GET() {
  try {
    const count = await cachedVisitorCount();
    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": COUNT_CACHE,
          "CDN-Cache-Control": COUNT_CACHE,
          "Vercel-CDN-Cache-Control": COUNT_CACHE,
          Vary: "Accept-Encoding",
        },
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { count: 0, error: timedOut ? "Visitor counter timeout" : "Visitor counter unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ count: 0, error: "Missing Supabase server variables" }, { status: 500 });
  }

  let body: { sessionId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const sessionId = String(body.sessionId || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return NextResponse.json({ count: 0, error: "Invalid session identifier" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`));
  const existingId = match ? decodeURIComponent(match[1]) : "";
  const visitorId = /^[0-9a-f-]{36}$/i.test(existingId) ? existingId : randomUUID();
  const visitorHash = hashValue("visitor", visitorId);
  const sessionHash = hashValue("session", `${visitorId}:${sessionId}`);

  try {
    const parsed = await supabaseRpc("register_site_visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_visitor_hash: visitorHash,
        p_session_hash: sessionHash,
      }),
    });
    const count = Number(Array.isArray(parsed) ? parsed[0] : parsed) || 0;
    const result = NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
    result.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: ONE_YEAR,
      path: "/",
    });
    return result;
  } catch (error) {
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { count: 0, error: timedOut ? "Visitor counter timeout" : "Visitor counter unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
