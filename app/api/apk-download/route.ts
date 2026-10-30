import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const discontinued = () => NextResponse.json(
  {
    available: false,
    error: "APK_DISCONTINUED",
    message: "تم الاستغناء عن ملف APK. استخدم موقع MauriResults مباشرة.",
    website: "https://mauri-results.vercel.app",
  },
  { status: 410, headers: { "Cache-Control": "no-store" } },
);
export const GET = discontinued;
export const POST = discontinued;
