import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHAT_COOKIE = "mauriresults_chat_id";
const ONE_YEAR = 60 * 60 * 24 * 365;
const CLOSE_HOUR_UTC = 18; // Africa/Nouakchott is UTC year-round.

function chatState() {
  const now = new Date();
  const open = now.getUTCHours() < CLOSE_HOUR_UTC;
  const closesAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), CLOSE_HOUR_UTC));
  return { open, closesAt: closesAt.toISOString() };
}

function readCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CHAT_COOKIE}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : "";
  return /^[0-9a-f-]{36}$/i.test(value) ? value : randomUUID();
}

function anonymousLabel(id: string) {
  const digest = createHash("sha256").update(id).digest("hex");
  const number = (Number.parseInt(digest.slice(0, 8), 16) % 900) + 100;
  return `مجهول ${number}`;
}

function withCookie(response: NextResponse, id: string) {
  response.cookies.set(CHAT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: ONE_YEAR,
    path: "/",
  });
  return response;
}

function serverHeaders() {
  return {
    apikey: SERVICE_ROLE_KEY || "",
    Authorization: `Bearer ${SERVICE_ROLE_KEY || ""}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function GET(request: Request) {
  const identity = readCookie(request);
  const state = chatState();

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return withCookie(NextResponse.json({ ...state, messages: [], error: "Chat is not configured" }, { status: 500 }), identity);
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const endpoint = new URL(`${SUPABASE_URL}/rest/v1/live_chat_messages`);
  endpoint.searchParams.set("select", "id,anonymous_label,body,created_at");
  endpoint.searchParams.set("created_at", `gte.${start}`);
  endpoint.searchParams.set("order", "created_at.asc");
  endpoint.searchParams.set("limit", "120");

  const result = await fetch(endpoint, { headers: serverHeaders(), cache: "no-store" });
  const text = await result.text();
  if (!result.ok) {
    return withCookie(NextResponse.json({ ...state, messages: [], error: text.slice(0, 300) }, { status: result.status }), identity);
  }

  return withCookie(
    NextResponse.json({ ...state, selfLabel: anonymousLabel(identity), messages: text ? JSON.parse(text) : [] }, { headers: { "Cache-Control": "no-store" } }),
    identity,
  );
}

export async function POST(request: Request) {
  const identity = readCookie(request);
  const state = chatState();

  if (!state.open) {
    return withCookie(NextResponse.json({ ...state, error: "تم إغلاق المحادثة عند الساعة 18:00" }, { status: 403 }), identity);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return withCookie(NextResponse.json({ ...state, error: "Chat is not configured" }, { status: 500 }), identity);
  }

  let body = "";
  try {
    const payload = await request.json();
    body = String(payload?.body || "").replace(/\s+/g, " ").trim();
  } catch {
    body = "";
  }

  if (!body || body.length > 300) {
    return withCookie(NextResponse.json({ ...state, error: "اكتب رسالة من 1 إلى 300 حرف" }, { status: 400 }), identity);
  }

  const recentEndpoint = new URL(`${SUPABASE_URL}/rest/v1/live_chat_messages`);
  recentEndpoint.searchParams.set("select", "created_at");
  recentEndpoint.searchParams.set("anonymous_id", `eq.${identity}`);
  recentEndpoint.searchParams.set("order", "created_at.desc");
  recentEndpoint.searchParams.set("limit", "1");
  const recentResult = await fetch(recentEndpoint, { headers: serverHeaders(), cache: "no-store" });
  if (recentResult.ok) {
    const recent = await recentResult.json();
    const lastTime = recent?.[0]?.created_at ? new Date(recent[0].created_at).getTime() : 0;
    if (Date.now() - lastTime < 3000) {
      return withCookie(NextResponse.json({ ...state, error: "انتظر قليلًا قبل إرسال رسالة أخرى" }, { status: 429 }), identity);
    }
  }

  const insertResult = await fetch(`${SUPABASE_URL}/rest/v1/live_chat_messages`, {
    method: "POST",
    headers: { ...serverHeaders(), Prefer: "return=representation" },
    body: JSON.stringify({ anonymous_id: identity, anonymous_label: anonymousLabel(identity), body }),
  });
  const text = await insertResult.text();
  if (!insertResult.ok) {
    return withCookie(NextResponse.json({ ...state, error: text.slice(0, 300) }, { status: insertResult.status }), identity);
  }

  const created = text ? JSON.parse(text)?.[0] : null;
  return withCookie(NextResponse.json({ ...state, message: created }, { status: 201 }), identity);
}
