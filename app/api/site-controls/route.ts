import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ controls: DEFAULTS }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/site_content`);
    url.searchParams.set("select", "content_key,value");
    url.searchParams.set("content_key", "like.ui_%");

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    const controls = { ...DEFAULTS };
    for (const row of rows || []) {
      if (row?.content_key && row.value != null) controls[row.content_key] = String(row.value);
    }

    return NextResponse.json({ controls }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ controls: DEFAULTS }, { headers: { "Cache-Control": "no-store" } });
  }
}
