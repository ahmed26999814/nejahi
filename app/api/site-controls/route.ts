import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

const DEFAULTS: Record<string, string> = {
  ui_show_search: "true",
  ui_show_toppers: "true",
  ui_show_analytics: "true",
  ui_show_calculator: "true",
  ui_show_contact: "true",
  ui_show_developer: "true",
  ui_show_footer: "true",
  ui_label_search: "البحث",
  ui_label_toppers: "الأوائل",
  ui_label_analytics: "الإحصائيات",
  ui_label_calculator: "حاسبة المعدل",
  ui_label_contact: "اتصل بنا",
  ui_label_developer: "الإعداد والتطوير",
};

async function fetchControls() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { ...DEFAULTS };

  const url = new URL(`${SUPABASE_URL}/rest/v1/site_content`);
  url.searchParams.set("select", "content_key,value");
  url.searchParams.set("content_key", "like.ui_%");

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      Prefer: "count=none",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(await response.text());
  const rows = await response.json();
  const controls = { ...DEFAULTS };
  for (const row of rows || []) {
    if (row?.content_key && row.value != null) controls[row.content_key] = String(row.value);
  }
  return controls;
}

const cachedControls = unstable_cache(fetchControls, ["mauriresults-site-controls-v2"], { revalidate: 300 });

export async function GET() {
  try {
    const controls = await cachedControls();
    return NextResponse.json({ controls }, { headers: { "Cache-Control": PUBLIC_CACHE, "CDN-Cache-Control": PUBLIC_CACHE, Vary: "Accept-Encoding" } });
  } catch {
    return NextResponse.json({ controls: DEFAULTS }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
  }
}
