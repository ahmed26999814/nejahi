import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["rimbac.com", "www.rimbac.com"]);

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripTags(value = "") {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(value, base) {
  if (!value) return null;
  try {
    const url = new URL(decodeHtml(value.trim()), base);
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getAttribute(attributes, name) {
  const expression = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return attributes.match(expression)?.[1] || "";
}

function extractAnchors(html, base) {
  const anchors = [];
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const href = safeUrl(getAttribute(match[1], "href"), base);
    if (!href) continue;
    const start = Math.max(0, match.index - 700);
    const end = Math.min(html.length, regex.lastIndex + 700);
    anchors.push({
      text: stripTags(match[2]),
      href,
      context: stripTags(html.slice(start, end)).slice(0, 700),
      attributes: match[1].slice(0, 500),
    });
  }
  return anchors;
}

export async function GET(request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const input = new URL(request.url).searchParams.get("url");
  const target = safeUrl(input, "https://rimbac.com/");
  if (!target) return NextResponse.json({ error: "Invalid Rimbac URL." }, { status: 400 });

  try {
    const response = await fetch(target, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent": "MauriResults-Rimbac-Indexer/1.0 (+authorized by site owner)",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    const anchors = extractAnchors(html, response.url || target);
    return NextResponse.json({
      requestedUrl: target,
      finalUrl: response.url,
      status: response.status,
      contentType,
      title: stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
      anchorCount: anchors.length,
      anchors,
      bodyText: stripTags(html).slice(0, 3000),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
