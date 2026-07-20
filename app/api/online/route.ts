import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 5_000;
const ONLINE_CACHE = "public, max-age=15, s-maxage=30, stale-while-revalidate=300, stale-if-error=3600";

type RpcResult =
  | { data: unknown }
  | { error: string; status: number };

function hashSession(value: string) {
  const salt = process.env.ADMIN_SECRET || "mauriresults-online";
  return createHash("sha256").update(`${salt}:online:${value}`).digest("hex");
}

async function callRpc(name: string, init: RequestInit = {}): Promise<RpcResult> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { error: "Missing Supabase server variables", status: 500 };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });

    const text = await response.text();
    if (!response.ok) {
      return {
        error: text.slice(0, 500) || `Supabase returned ${response.status}`,
        status: response.status,
      };
    }
    return { data: text ? JSON.parse(text) : 0 };
  } catch (error) {
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      error: timedOut ? "Online counter timeout" : "Online counter unavailable",
      status: 503,
    };
  }
}

function numericRpcValue(data: unknown) {
  return Number(Array.isArray(data) ? data[0] : data) || 0;
}

async function readOnlineCount() {
  const result = await callRpc("get_site_online_count", { method: "POST" });
  if ("error" in result) throw new Error(result.error);
  return numericRpcValue(result.data);
}

const cachedOnlineCount = unstable_cache(
  readOnlineCount,
  ["mauriresults-online-count-v1"],
  { revalidate: 30 },
);

export async function GET() {
  try {
    const online = await cachedOnlineCount();
    return NextResponse.json(
      { online },
      {
        headers: {
          "Cache-Control": ONLINE_CACHE,
          "CDN-Cache-Control": ONLINE_CACHE,
          "Vercel-CDN-Cache-Control": ONLINE_CACHE,
          Vary: "Accept-Encoding",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { online: 0, error: "Online counter unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  let body: { sessionId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const sessionId = String(body.sessionId || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return NextResponse.json(
      { online: 0, error: "Invalid session identifier" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await callRpc("touch_site_active_session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_session_hash: hashSession(sessionId) }),
  });

  if ("error" in result) {
    return NextResponse.json(
      { online: 0, error: result.error },
      {
        status: result.status,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": result.status >= 500 ? "2" : "1",
        },
      },
    );
  }

  return NextResponse.json(
    { online: numericRpcValue(result.data) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
