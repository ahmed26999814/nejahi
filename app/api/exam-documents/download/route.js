import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["rimbac.com", "www.rimbac.com"]);
const FILE_EXTENSION_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpe?g|png|webp)(?:$|[?#])/i;
const DOWNLOAD_WORDS_RE = /(تحميل|download|تنزيل|معاينة|فتح|pdf)/i;
const SOLUTION_WORDS_RE = /(^|\s)(الحل|حل|التصحيح|تصحيح)(\s|$)|corrig/i;
const EXAM_WORDS_RE = /(الامتحان|الإمتحان|موضوع|اختبار|epreuve|épreuve)/i;
const YEAR_CONTEXT_RE = /(بكلوريا|بكالوريا|ابريفه|أبريفه|brevet|bepc|كونكور|concours|الامتياز|الإمتياز|مسابقة|دورة)/i;

const SUBJECT_ALIASES = {
  "اللغة العربية": ["اللغة العربية", "العربية", "arabe"],
  الفرنسية: ["الفرنسية", "français", "francais", "french"],
  الرياضيات: ["الرياضيات", "mathématiques", "mathematiques", "math"],
  "التاريخ والجغرافيا": ["التاريخ والجغرافيا", "التاريخ و الجغرافيا", "histoire", "géographie", "geographie"],
  "العلوم الطبيعية": ["العلوم الطبيعية", "sciences naturelles", "science naturelle", "svt"],
  "التربية الإسلامية": ["التربية الإسلامية", "التربية الاسلامية", "education islamique"],
  "التربية المدنية": ["التربية المدنية", "education civique"],
  الإنجليزية: ["الإنجليزية", "الانجليزية", "english", "anglais"],
  "الفيزياء والكيمياء": ["الفيزياء والكيمياء", "الفيزياء و الكيمياء", "الفيزياء", "physique", "chimie"],
  "الفكر الإسلامي": ["الفكر الإسلامي", "الفكر الاسلامي", "الفكر"],
  "القرآن والحديث": ["القرآن والحديث", "القرءان", "القرآن", "الحديث"],
  "التشريع الإسلامي": ["التشريع الإسلامي", "التشريع الاسلامي", "التشريع"],
  الفلسفة: ["الفلسفة", "philosophie"],
  "القرآن الكريم": ["القرآن الكريم", "القرءان الكريم"],
  "الحديث والعقيدة والسيرة": ["الحديث والعقيدة والسيرة", "الحديث", "العقيدة", "السيرة"],
  الفقه: ["الفقه"],
  "أصول الفقه": ["أصول الفقه", "اصول الفقه"],
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return { url: url.replace(/\/$/, ""), key };
}

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
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(value, base) {
  if (!value) return null;
  let decoded = decodeHtml(String(value).trim().replace(/^['"]|['"]$/g, ""));
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Preserve incomplete percent encoding and let URL handle it.
  }

  try {
    const url = new URL(decoded, base);
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isAllowedUrl(value) {
  try {
    return ALLOWED_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function unwrapViewerUrl(value, base) {
  const url = safeUrl(value, base);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const nested = parsed.searchParams.get("file") || parsed.searchParams.get("url") || parsed.searchParams.get("src");
    return nested ? safeUrl(nested, url) || url : url;
  } catch {
    return url;
  }
}

function extractAnchors(html, base) {
  const anchors = [];
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(html))) {
    const href = match[1].match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    const url = unwrapViewerUrl(href, base);
    if (!url) continue;
    const start = Math.max(0, match.index - 900);
    const end = Math.min(html.length, regex.lastIndex + 900);
    anchors.push({
      url,
      text: stripTags(match[2]),
      context: stripTags(html.slice(start, end)),
      index: match.index,
    });
  }

  return anchors;
}

function extractTitle(html) {
  return stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function fileRank(url) {
  const path = url.toLowerCase();
  if (/\.pdf(?:$|[?#])/.test(path)) return 100;
  if (/\.(docx?|xlsx?|pptx?|zip|rar)(?:$|[?#])/.test(path)) return 80;
  if (/\.(jpe?g|png|webp)(?:$|[?#])/.test(path)) return 20;
  if (/\/wp-content\/uploads\//.test(path)) return 10;
  return 0;
}

function extractFileCandidates(html, base) {
  const candidates = new Set();
  const attributeRegex = /(?:href|src|data-url|data-src|data-download|data-file|data-pdf)\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = attributeRegex.exec(html))) {
    const url = unwrapViewerUrl(match[1], base);
    if (url && (FILE_EXTENSION_RE.test(url) || /\/wp-content\/uploads\//i.test(url))) candidates.add(url);
  }

  const rawRegex = /(?:https?:\/\/[^\s"'<>\\]+|\/wp-content\/uploads\/[^\s"'<>\\]+)/gi;
  while ((match = rawRegex.exec(html))) {
    const url = unwrapViewerUrl(match[0], base);
    if (url && (FILE_EXTENSION_RE.test(url) || /\/wp-content\/uploads\//i.test(url))) candidates.add(url);
  }

  return [...candidates]
    .filter((url) => !/(logo|favicon|avatar|analytics|icon|banner|advert|ads|220x150|150x150)/i.test(url))
    .sort((a, b) => fileRank(b) - fileRank(a));
}

function aliasesFor(subject) {
  if (!subject || subject === "جميع المواد" || subject === "مواد متعددة") return [];
  return SUBJECT_ALIASES[subject] || [subject];
}

function includesSubject(text, subject) {
  const haystack = normalize(text);
  return aliasesFor(subject).some((alias) => haystack.includes(normalize(alias)));
}

function isDesiredType(anchor, documentType) {
  const text = anchor.text || "";
  if (documentType === "solution") return SOLUTION_WORDS_RE.test(text);
  if (documentType === "exam") return EXAM_WORDS_RE.test(text) && !SOLUTION_WORDS_RE.test(text);
  return DOWNLOAD_WORDS_RE.test(text);
}

function findYearLink(html, base, year) {
  if (!year) return null;
  const target = String(year);
  const candidates = extractAnchors(html, base)
    .filter((anchor) => normalize(anchor.text).includes(target))
    .map((anchor) => {
      const text = stripTags(anchor.text);
      let score = 0;
      if (normalize(text) === target) score += 200;
      if (YEAR_CONTEXT_RE.test(text)) score += 120;
      if (YEAR_CONTEXT_RE.test(anchor.context)) score += 30;
      if (/(منحة|وظيفة|اكتتاب|جامعة|كوريا|تركيا|روسيا)/i.test(text)) score -= 300;
      return { ...anchor, score };
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.score > 0 ? candidates[0] : null;
}

function findHintLink(html, base, hint) {
  if (!hint) return null;
  const needle = normalize(hint);
  return extractAnchors(html, base).find((anchor) => normalize(anchor.text).includes(needle)) || null;
}

function findSubjectLink(html, base, record) {
  const rows = [];
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowRegex.exec(html))) rows.push(row[1]);

  for (const block of rows) {
    if (!includesSubject(block, record.subject)) continue;
    const selected = extractAnchors(block, base).find((anchor) => isDesiredType(anchor, record.document_type));
    if (selected) return selected;
  }

  const lowerHtml = html.toLowerCase();
  const candidates = [];
  for (const alias of aliasesFor(record.subject)) {
    const needle = alias.toLowerCase();
    let position = lowerHtml.indexOf(needle);
    while (position >= 0) {
      const chunk = html.slice(position, position + 6500);
      const selected = extractAnchors(chunk, base).find((anchor) => isDesiredType(anchor, record.document_type));
      if (selected) {
        let score = 100;
        if (includesSubject(selected.context, record.subject)) score += 60;
        if (selected.index < 2500) score += 30;
        candidates.push({ ...selected, score, subjectPosition: position });
      }
      position = lowerHtml.indexOf(needle, position + needle.length);
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.subjectPosition - b.subjectPosition);
  return candidates[0] || null;
}

function findDownloadLink(html, base) {
  return extractAnchors(html, base)
    .filter((anchor) => DOWNLOAD_WORDS_RE.test(anchor.text))
    .sort((a, b) => fileRank(b.url) - fileRank(a.url))[0] || null;
}

async function fetchRemote(url) {
  if (!isAllowedUrl(url)) throw new Error("Remote URL is not allowed.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "MauriResults-Exam-Library/1.0 (+authorized Rimbac index)",
        Accept: "text/html,application/pdf,application/octet-stream,image/*,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveDownload(record) {
  let current = record.direct_url || record.source_url;
  const visited = new Set();
  let yearResolved = !record.year || Boolean(record.direct_url) || normalize(current).includes(String(record.year));
  let subjectResolved = Boolean(record.direct_url) || aliasesFor(record.subject).length === 0;
  let hintResolved = !record.link_text_hint;

  for (let depth = 0; depth < 8; depth += 1) {
    current = safeUrl(current, record.source_url);
    if (!current || visited.has(current)) break;
    visited.add(current);

    const response = await fetchRemote(current);
    if (!response.ok) throw new Error(`Rimbac returned ${response.status}.`);

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const finalUrl = response.url && isAllowedUrl(response.url) ? response.url : current;
    if (!contentType.includes("text/html")) return { response, finalUrl };

    const html = await response.text();
    const title = extractTitle(html);
    if (/(domain is expired|your domain is expired)/i.test(`${title} ${stripTags(html).slice(0, 800)}`)) {
      throw new Error("The source page is unavailable.");
    }

    if (!yearResolved) {
      const yearLink = findYearLink(html, finalUrl, record.year);
      yearResolved = true;
      if (yearLink && !visited.has(yearLink.url)) {
        current = yearLink.url;
        continue;
      }
    }

    if (!hintResolved) {
      const hintLink = findHintLink(html, finalUrl, record.link_text_hint);
      hintResolved = true;
      if (hintLink && !visited.has(hintLink.url)) {
        current = hintLink.url;
        continue;
      }
    }

    if (!subjectResolved) {
      const subjectLink = findSubjectLink(html, finalUrl, record);
      subjectResolved = true;
      if (subjectLink && !visited.has(subjectLink.url)) {
        current = subjectLink.url;
        continue;
      }
    }

    const files = extractFileCandidates(html, finalUrl);
    if (files.length && !visited.has(files[0])) {
      current = files[0];
      continue;
    }

    const downloadLink = findDownloadLink(html, finalUrl);
    if (downloadLink && !visited.has(downloadLink.url)) {
      current = downloadLink.url;
      continue;
    }

    break;
  }

  return null;
}

function extensionFrom(url, contentType) {
  try {
    const match = new URL(url).pathname.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpe?g|png|webp)$/i);
    if (match) return `.${match[1].toLowerCase()}`;
  } catch {
    // Ignore malformed final URLs.
  }
  if (contentType.includes("pdf")) return ".pdf";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".pdf";
}

function safeFilename(title, extension) {
  const cleaned = String(title || "exam-document")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
  return `${cleaned || "exam-document"}${extension}`;
}

async function getDocument(id) {
  const { url, key } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/exam_documents`);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("id", `eq.${id}`);
  endpoint.searchParams.set("is_active", "eq.true");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}.`);
  const rows = await response.json();
  return rows[0] || null;
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "معرّف الملف غير صالح." }, { status: 400 });
  }

  try {
    const record = await getDocument(id);
    if (!record) return NextResponse.json({ error: "الملف غير موجود." }, { status: 404 });

    const resolved = await resolveDownload(record);
    if (!resolved) return NextResponse.redirect(record.source_url, 302);

    const contentType = resolved.response.headers.get("content-type") || "application/octet-stream";
    const extension = extensionFrom(resolved.finalUrl, contentType);
    const filename = safeFilename(record.title, extension);
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    const contentLength = resolved.response.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(resolved.response.body, { status: 200, headers });
  } catch (error) {
    console.error("exam-documents:download", error);
    return NextResponse.json(
      { error: "تعذر بدء التنزيل تلقائيًا. قد يكون رابط المصدر متوقفًا مؤقتًا." },
      { status: 502 }
    );
  }
}
