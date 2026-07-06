import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = "site_content";

export async function GET() {
  try {
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