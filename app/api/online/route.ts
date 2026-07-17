import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REQUEST_TIMEOUT_MS = 5_000;

function hashSession(value: string) {
  const salt = process.env.ADMIN_SECRET || "mauriresults-online";
  return createHash("sha256").update(`${salt}:online:${value}`).digest("hex");
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ online: 0, error: "Missing Supabase server variables" }, { status: 500 });
  }

  let body: { sessionId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const sessionId = String(body.sessionId || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return NextResponse.json({ online: 0, error: "Invalid session identifier" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/touch_site_active_session`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ p_session_hash: hashSession(sessionId) }),
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json({ online: 0, error: text.slice(0, 500) }, { status: response.status });
    }

    const parsed = text ? JSON.parse(text) : 0;
    const online = Number(Array.isArray(parsed) ? parsed[0] : parsed) || 0;
    return NextResponse.json({ online }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({ online: 0, error: timedOut ? "Online counter timeout" : "Online counter unavailable" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
