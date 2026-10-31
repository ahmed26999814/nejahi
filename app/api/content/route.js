import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = (process.env.NEXT_PUBLIC_NEON_MODE === "1" ? "neon-internal" : process.env.SUPABASE_SERVICE_ROLE_KEY);
const TABLE = "site_content";

export async function GET() {
  try {
    if (process.env.NEXT_PUBLIC_NEON_MODE === "1") {
      const connection = process.env.NEON_DATABASE_URL || process.env.NEON_STAGING_DATABASE_URL;
      if (!connection) return NextResponse.json({ items: [], error: "Neon is not configured" }, { status: 503 });
      const sql = neon(connection);
      const items = await sql`SELECT content_key,title,value,type,updated_at FROM public.site_content ORDER BY content_key`;
      return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const params = new URLSearchParams({
      select: "content_key,title,value,type,updated_at",
      order: "content_key.asc",
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${params}`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json({ items: [], error: text }, { status: 200 });
    }

    return NextResponse.json({ items: text ? JSON.parse(text) : [] });
  } catch (error) {
    return NextResponse.json({ items: [], error: error.message }, { status: 200 });
  }
}