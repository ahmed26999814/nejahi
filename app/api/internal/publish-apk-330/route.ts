import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIDGE_TOKEN = "bridge330_44a94ebd7e3b4b3fbfc1a07fd50fb7c9";
const PUBLISH_URL =
  "https://nxizqnlemsbjmsfyuevg.supabase.co/functions/v1/publish-apk-once?token=mr330_7f89d2aa1b654c0bb4b5d93960b152b3";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const response = await fetch(PUBLISH_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
