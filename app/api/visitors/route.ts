import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VISITOR_COOKIE = "mauriresults_visitor_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

function hashVisitorId(value: string) {
  const salt = process.env.ADMIN_SECRET || "mauriresults-visitors";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ count: 0, error: "Missing Supabase server variables" }, { status: 500 });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`));
  const existingId = match ? decodeURIComponent(match[1]) : "";
  const visitorId = /^[0-9a-f-]{36}$/i.test(existingId) ? existingId : randomUUID();
  const visitorHash = hashVisitorId(visitorId);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_site_visitor`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_visitor_hash: visitorHash }),
  });

  const text = await response.text();
  if (!response.ok) {
    return NextResponse.json({ count: 0, error: text.slice(0, 500) }, { status: response.status });
  }

  const parsed = text ? JSON.parse(text) : 0;
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
}
