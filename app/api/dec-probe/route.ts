import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_URL = "https://dec.education.gov.mr/search-bepc";

export async function GET() {
  try {
    const pageResponse = await fetch(PAGE_URL, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await pageResponse.text();
    const scriptSources = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi), (match) => new URL(match[1], PAGE_URL).toString());
    const scripts = await Promise.all(
      scriptSources.slice(0, 20).map(async (url) => {
        try {
          const response = await fetch(url, {
            cache: "no-store",
            headers: { "user-agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(20000),
          });
          return { url, text: await response.text() };
        } catch (error) {
          return { url, text: `ERROR:${error instanceof Error ? error.message : String(error)}` };
        }
      }),
    );
    const hints = scripts.flatMap(({ url, text }) => {
      const matches = Array.from(text.matchAll(/.{0,180}(?:search-bepc|bepc|axios|fetch\(|\/api\/|nni|nodoss|numero|numéro|matiere|matière|moyenne|note).{0,260}/gi), (match) => match[0]);
      return matches.slice(0, 120).map((value) => ({ url, value }));
    });
    return NextResponse.json({
      ok: pageResponse.ok,
      status: pageResponse.status,
      htmlHead: html.slice(0, 12000),
      scriptSources,
      hints: hints.slice(0, 400),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
