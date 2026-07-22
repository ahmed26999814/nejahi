import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: false, error: "This one-time endpoint has been disabled." },
    { status: 410, headers: { "cache-control": "no-store" } },
  );
}
