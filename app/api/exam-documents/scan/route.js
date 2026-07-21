import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["rimbac.com", "www.rimbac.com"]);
const REFERENCE_LINK_RE = /(مذكرة|مذكرات|مرجع|مراجع|كتب|دروس|النفيس|رياضيات|علوم|فيزياء|كيمياء|فلسفة|فرنسية|عربية|تشريع|فكر|قرآن|حديث|تاريخ|جغرافيا)/i;
const EXCLUDED_LINK_RE = /(منحة|وظيفة|اكتتاب|الصفحة الرئيسية|الإبلاغ|الخصوصية|اتفاقية|اتصل بنا|من نحن|فيسبوك|rss)/i;

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
      if (url && !/(logo|favicon|avatar|220x150|150x150|banner|icon)/i.test(url)) found.add(url);
    }
  }
  return [...found];
}

function extractTabs(html, base) {
  const titles = [];
  const titleRegex = /<button\b([^>]*aria-controls\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = titleRegex.exec(html))) {
    titles.push({ title: stripTags(match[3]), contentId: match[2] });
  }

  return titles.map((tab) => {
    const markers = [`id="${tab.contentId}"`, `id='${tab.contentId}'`];
    let start = markers.map((marker) => html.indexOf(marker)).find((value) => value >= 0) ?? -1;
    if (start < 0) return { ...tab, files: [] };
    const nextCandidates = [
      html.indexOf('id="e-n-tab-content-', start + 10),
      html.indexOf("id='e-n-tab-content-", start + 10),
    ].filter((value) => value > start);
    const end = nextCandidates.length ? Math.min(...nextCandidates) : html.length;
    return { ...tab, files: extractEmbeddedUrls(html.slice(start, end), base) };
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

async function fetchPage(url) {
  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "User-Agent": "MauriResults-Rimbac-Indexer/1.0 (+authorized by site owner)",
      Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
    },
  });
  const html = await response.text();
  const base = response.url || url;
  return {
    requestedUrl: url,
    finalUrl: base,
    status: response.status,
    contentType: response.headers.get("content-type") || "",
    title: stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
    html,
    anchors: extractAnchors(html, base),
    tabs: extractTabs(html, base),
    files: extractEmbeddedUrls(html, base),
  };
}

async function crawlReferences(rootPage) {
  const candidates = new Map();
  rootPage.anchors.forEach((anchor) => {
    const combined = `${anchor.text} ${anchor.context}`;
    if (!REFERENCE_LINK_RE.test(combined) || EXCLUDED_LINK_RE.test(anchor.text)) return;
    if (anchor.href === rootPage.finalUrl || anchor.href === "https://rimbac.com/") return;
    candidates.set(anchor.href, anchor.text || stripTags(anchor.context).slice(0, 120));
  });

  const selected = [...candidates.entries()].slice(0, 40);
  const pages = [];
  for (let index = 0; index < selected.length; index += 5) {
    const batch = selected.slice(index, index + 5);
    const results = await Promise.all(
      batch.map(async ([url, linkText]) => {
        try {
          const page = await fetchPage(url);
          return {
            linkText,
            url: page.finalUrl,
            title: page.title,
            status: page.status,
            files: [...new Set([...page.files, ...page.tabs.flatMap((tab) => tab.files)])],
            tabs: page.tabs,
          };
        } catch (error) {
          return { linkText, url, title: "", status: 0, files: [], error: error.message };
        }
      })
    );
    pages.push(...results);
  }

  return pages.filter((page) => page.files.length || page.tabs.some?.((tab) => tab.files?.length));
}

export async function GET(request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const input = requestUrl.searchParams.get("url");
  const rawQuery = requestUrl.searchParams.get("q") || "";
  const query = normalize(rawQuery);
  const crawl = requestUrl.searchParams.get("crawl") === "1";
  const target = safeUrl(input, "https://rimbac.com/");
  if (!target) return NextResponse.json({ error: "Invalid Rimbac URL." }, { status: 400 });

  try {
    const page = await fetchPage(target);
    if (crawl) {
      const children = await crawlReferences(page);
      return NextResponse.json({
        requestedUrl: target,
        finalUrl: page.finalUrl,
        status: page.status,
        title: page.title,
        rootFiles: [...new Set([...page.files, ...page.tabs.flatMap((tab) => tab.files)])],
        children,
      });
    }

    const anchors = query
      ? page.anchors.filter((anchor) => normalize(`${anchor.text} ${anchor.context} ${anchor.href}`).includes(query))
      : page.anchors;
    return NextResponse.json({
      requestedUrl: target,
      finalUrl: page.finalUrl,
      status: page.status,
      contentType: page.contentType,
      title: page.title,
      anchorCount: page.anchors.length,
      matchedAnchorCount: anchors.length,
      anchors: anchors.slice(0, 80),
      tabs: page.tabs,
      embeddedFiles: page.files,
      rawMatches: rawMatches(page.html, rawQuery),
      bodyText: stripTags(page.html).slice(0, 4000),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
