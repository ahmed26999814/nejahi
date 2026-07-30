import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

const PROJECT_ID = "prj_gakC4aJHh0P8f3exGw7xsygjxlaC";
const TEAM_ID = "team_RnUFntCuGa3xIhVCUU7Jey8X";
const SINCE = "2026-07-03T00:00:00.000Z";

export async function GET(request: Request) {
  const token = request.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, code: "NO_OIDC" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
  url.searchParams.set("projectId", PROJECT_ID);
  url.searchParams.set("teamId", TEAM_ID);
  url.searchParams.set("since", SINCE);
  url.searchParams.set("until", new Date().toISOString());

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    return NextResponse.json(
      { ok: response.ok, upstreamStatus: response.status, data },
      { status: response.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { ok: false, code: timedOut ? "TIMEOUT" : "UPSTREAM_ERROR" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
