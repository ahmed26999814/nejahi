import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGIN = "https://dec.education.gov.mr";

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json,text/plain,*/*",
      referer: `${ORIGIN}/search-bepc`,
      "user-agent": "Mozilla/5.0",
    },
    signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, ok: response.ok, text: await response.text() };
}

export async function GET(request: NextRequest) {
  const number = String(request.nextUrl.searchParams.get("number") || "75457").replace(/\D/g, "").slice(0, 14);
  try {
    const configResponse = await fetchText(`${ORIGIN}/assets/config/config.json`);
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(configResponse.text) as Record<string, unknown>;
    } catch {}

    const configuredBase = String(
      config.SERVER_API_URL || config.serverApiUrl || config.apiUrl || config.API_URL || ORIGIN,
    ).replace(/\/$/, "");

    const bases = Array.from(new Set([configuredBase, ORIGIN]));
    const paths = [
      `/_api/bepc/search/${number}`,
      `/_api/details-bepc/${number}`,
      `/api/bepc/search/${number}`,
      `/api/details-bepc/${number}`,
    ];

    const probes = [];
    for (const base of bases) {
      for (const path of paths) {
        const result = await fetchText(`${base}${path}`);
        probes.push({ url: `${base}${path}`, status: result.status, ok: result.ok, body: result.text.slice(0, 12000) });
      }
    }

    return NextResponse.json({ number, configStatus: configResponse.status, config, configuredBase, probes });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
