import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-static";
export const revalidate = 86_400;

const CACHE_CONTROL = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

export async function GET() {
  return NextResponse.json(
    {
      candidates: [],
      options: [],
      error: "تم إلغاء البحث بالاسم. استخدم رقم المترشح فقط.",
      numberOnly: true,
    },
    {
      status: 410,
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "CDN-Cache-Control": CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CACHE_CONTROL,
      },
    },
  );
}
