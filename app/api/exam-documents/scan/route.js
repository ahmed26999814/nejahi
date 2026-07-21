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

function normalize(value = "") {
  return stripTags(value)
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
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
    const start = Math.max(0, match.index - 1200);
    const end = Math.min(html.length, regex.lastIndex + 1200);
    anchors.push({
      text: stripTags(match[2]),
      href,
      context: stripTags(html.slice(start, end)).slice(0, 1600),
      attributes: match[1].slice(0, 500),
      index: match.index,
    });
  }
  return anchors;
}

function extractEmbeddedUrls(block, base) {
  const found = new Set();
  const patterns = [
    /fileLink\s*:\s*["']([^"']+)["']/gi,
    /(?:data-file|data-pdf|data-url|data-download)\s*=\s*["']([^"']+)["']/gi,
    /https?:\/\/[^\s"'<>\\]+\.(?:pdf|docx?|xlsx?|pptx?|zip|rar)(?:\?[^\s"'<>\\]*)?/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(block))) {
      const candidate = match[1] || match[0];
      const url = safeUrl(candidate, base);
      if (url) found.add(url);
    }
  }
  return [...found];
}

function extractTabs(html, base) {
  const titles = [];
  const titleRegex = /<button\b([^>]*aria-controls\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = titleRegex.exec(html))) {
    titles.push({
      title: stripTags(match[3]),
      contentId: match[2],
    });
  }

  return titles.map((tab) => {
    const marker = `id="${tab.contentId}"`;
    const singleMarker = `id='${tab.contentId}'`;
    let start = html.indexOf(marker);
    if (start < 0) start = html.indexOf(singleMarker);
    if (start < 0) return { ...tab, files: [] };

    const nextDouble = html.indexOf('id="e-n-tab-content-', start + marker.length);
    const nextSingle = html.indexOf("id='e-n-tab-content-", start + marker.length);
    const candidates = [nextDouble, nextSingle].filter((value) => value > start);
    const end = candidates.length ? Math.min(...candidates) : html.length;
    return {
      ...tab,
      files: extractEmbeddedUrls(html.slice(start, end), base),
    };
  });
}

function rawMatches(html, query) {
  if (!query) return [];
  const lowerHtml = html.toLowerCase();
  const needles = [query.trim(), normalize(query)].filter(Boolean);
  const positions = new Set();

  for (const needle of needles) {
    let index = lowerHtml.indexOf(needle.toLowerCase());
    while (index >= 0 && positions.size < 20) {
      positions.add(index);
      index = lowerHtml.indexOf(needle.toLowerCase(), index + needle.length);
    }
  }

  return [...positions]
    .sort((a, b) => a - b)
    .slice(0, 12)
    .map((index) => html.slice(Math.max(0, index - 1800), Math.min(html.length, index + 5000)));
}

export async function GET(request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const input = requestUrl.searchParams.get("url");
  const rawQuery = requestUrl.searchParams.get("q") || "";
  const query = normalize(rawQuery);
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
    const base = response.url || target;
    const allAnchors = extractAnchors(html, base);
    const anchors = query
      ? allAnchors.filter((anchor) => normalize(`${anchor.text} ${anchor.context} ${anchor.href}`).includes(query))
      : allAnchors;
    return NextResponse.json({
      requestedUrl: target,
      finalUrl: response.url,
      status: response.status,
      contentType,
      title: stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
      anchorCount: allAnchors.length,
      matchedAnchorCount: anchors.length,
      anchors: anchors.slice(0, 80),
      tabs: extractTabs(html, base),
      embeddedFiles: extractEmbeddedUrls(html, base),
      rawMatches: rawMatches(html, rawQuery),
      bodyText: stripTags(html).slice(0, 4000),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
