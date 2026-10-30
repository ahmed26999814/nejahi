import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NEXT_PUBLIC_NEON_MODE !== "1")
    return NextResponse.json({ status: "disabled" }, { status: 404 });
  const host = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!host || !host.endsWith(".supabase.co"))
    return NextResponse.json({ status: "host_unavailable" }, { status: 503 });
  try {
    const url = new URL("/rest/v1/site_content?select=content_key,title,value,type,updated_at&order=content_key.asc", host);
    const response = await fetch(url, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "" },
      cache: "no-store",
    });
    const content = await response.json().catch(() => []);
    return NextResponse.json({
      status: "checked",
      serviceSecretConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      adminSecretConfigured: Boolean(process.env.ADMIN_SECRET),
      neonDatabaseConfigured: Boolean(process.env.NEON_DATABASE_URL || process.env.NEON_STAGING_DATABASE_URL),
      bridgeActive: response.headers.get("x-mauri-database") === "neon-staging-bridge",
      upstreamOk: response.ok,
      resultCount: Array.isArray(content) ? content.length : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "error", bridgeActive: false }, { status: 503 });
  }
}
