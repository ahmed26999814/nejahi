import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIDGE_TOKEN = "OqAsEu0KCs5xutMG7oXnKKpaep7HiNNY";
const PUBLISH_URL =
  "https://nxizqnlemsbjmsfyuevg.supabase.co/functions/v1/publish-apk-once";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== BRIDGE_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const response = await fetch(`${PUBLISH_URL}?token=${encodeURIComponent(BRIDGE_TOKEN)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
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
