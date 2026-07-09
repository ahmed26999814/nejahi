import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function getDashboard(source: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: "Missing Supabase environment variables", status: 500 } as const;
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/get_published_exam_dashboard`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ p_source_key: source }),
  });

  const text = await response.text();
  if (!response.ok) return { error: text, status: response.status } as const;
  return { data: text ? JSON.parse(text) : {}, status: 200 } as const;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = String(searchParams.get("source") || "").trim();
  if (!source.startsWith("upload:")) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const result = await getDashboard(source);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" },
  });
}
