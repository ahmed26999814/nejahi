import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const closedResponse = () =>
  NextResponse.json(
    {
      open: false,
      messages: [],
      error: "تم إغلاق المحادثة نهائيًا",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );

export async function GET() {
  return closedResponse();
}

export async function POST() {
  return closedResponse();
}
