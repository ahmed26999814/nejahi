import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["rimbac.com", "www.rimbac.com"]);
const FILE_EXTENSION_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpe?g|png|webp)(?:$|[?#])/i;
const DOWNLOAD_WORDS_RE = /(تحميل|download|تنزيل|معاينة|فتح|الامتحان|الإمتحان|الحل|التصحيح|الموضوع|pdf)/i;
const SOLUTION_WORDS_RE = /(الحل|حل |التصحيح|تصحيح|corrig)/i;
const EXAM_WORDS_RE = /(الامتحان|الإمتحان|موضوع|اختبار|epreuve|épreuve)/i;

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
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
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
    // Keep the original value when it contains incomplete percent encoding.
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
    const file = parsed.searchParams.get("file") || parsed.searchParams.get("url") || parsed.searchParams.get("src");
    return file ? safeUrl(file, url) || url : url;
  } catch {
    return url;
  }
}

function extractAnchors(html, base) {
  const anchors = [];
  const regex = /<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const url = unwrapViewerUrl(match[2], base);
    if (!url) continue;
    anchors.push({
      url,
      text: stripTags(match[4]),
      raw: match[0],
      index: match.index,
    });
  }
  return anchors;
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

  return [...candidates].filter((url) => !/(logo|favicon|avatar|analytics|icon|banner|advert|ads)/i.test(url));
}

function aliasesFor(subject) {
  if (!subject || subject === "جميع المواد" || subject === "مواد متعددة") return [];
  return SUBJECT_ALIASES[subject] || [subject];
}

function includesSubject(text, subject) {
  const haystack = normalize(text);
  return aliasesFor(subject).some((alias) => haystack.includes(normalize(alias)));
}

function chooseByType(anchors, documentType) {
  if (!anchors.length) return null;
  if (documentType === "solution") {
    return anchors.find((anchor) => SOLUTION_WORDS_RE.test(anchor.text)) || anchors[1] || anchors[0];
  }
  if (documentType === "exam") {
    return anchors.find((anchor) => EXAM_WORDS_RE.test(anchor.text) && !SOLUTION_WORDS_RE.test(anchor.text)) || anchors[0];
  }
  return anchors.find((anchor) => DOWNLOAD_WORDS_RE.test(anchor.text)) || anchors[0];
}

function findYearLink(html, base, year) {
  if (!year) return null;
  const yearText = String(year);
  const anchors = extractAnchors(html, base);
  return anchors.find((anchor) => normalize(anchor.text).includes(yearText)) || null;
}

function findHintLink(html, base, hint) {
  if (!hint) return null;
  const needle = normalize(hint);
  return extractAnchors(html, base).find((anchor) => normalize(anchor.text).includes(needle)) || null;
}

function findSubjectLink(html, base, record) {
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowRegex.exec(html))) {
    if (!includesSubject(row[1], record.subject)) continue;
    const chosen = chooseByType(extractAnchors(row[1], base), record.document_type);
    if (chosen) return chosen;
  }

  // Some Rimbac pages use headings/cards instead of a table. Search a bounded block
  // after the matching subject heading so links from the next subject are not selected.
  const aliases = aliasesFor(record.subject).map(normalize).filter(Boolean);
  const blocks = html.split(/(?=<h[1-6]\b|<strong\b|<p\b|<div\b[^>]*(?:elementor|entry-content|wp-block))/gi);
  for (const block of blocks) {
    const blockText = normalize(block.slice(0, 1200));
    if (!aliases.some((alias) => blockText.includes(alias))) continue;
    const chosen = chooseByType(extractAnchors(block.slice(0, 5000), base), record.document_type);
    if (chosen) return chosen;
  }

  // Last fallback: use the nearest anchors following the first subject occurrence.
  const normalizedHtml = normalize(html);
  const subjectAlias = aliases.find((alias) => normalizedHtml.includes(alias));
  if (subjectAlias) {
    const plainSubject = aliasesFor(record.subject).find((alias) => html.toLowerCase().includes(alias.toLowerCase()));
    const position = plainSubject ? html.toLowerCase().indexOf(plainSubject.toLowerCase()) : -1;
    if (position >= 0) {
      const chosen = chooseByType(extractAnchors(html.slice(position, position + 7000), base), record.document_type);
      if (chosen) return chosen;
    }
  }

  return null;
}

async function fetchRemote(url) {
  if (!isAllowedUrl(url)) throw new Error("Remote URL is not allowed.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
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

  for (let depth = 0; depth < 5; depth += 1) {
    current = safeUrl(current, record.source_url);
    if (!current || visited.has(current)) break;
    visited.add(current);

    const response = await fetchRemote(current);
    if (!response.ok) throw new Error(`Rimbac returned ${response.status}.`);

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const finalUrl = response.url && isAllowedUrl(response.url) ? response.url : current;
    if (!contentType.includes("text/html")) return { response, finalUrl };

    const html = await response.text();

    // Collection/index pages first route to the requested year.
    if (record.year) {
      const yearLink = findYearLink(html, finalUrl, record.year);
      if (yearLink && !visited.has(yearLink.url)) {
        current = yearLink.url;
        continue;
      }
    }

    // References and memo collections often use the full document title as anchor text.
    const hintLink = findHintLink(html, finalUrl, record.link_text_hint);
    if (hintLink && !visited.has(hintLink.url)) {
      current = hintLink.url;
      continue;
    }

    const subjectLink = findSubjectLink(html, finalUrl, record);
    if (subjectLink && !visited.has(subjectLink.url)) {
      current = subjectLink.url;
      continue;
    }

    const files = extractFileCandidates(html, finalUrl);
    if (files.length) {
      current = files[0];
      continue;
    }

    const downloadLink = extractAnchors(html, finalUrl).find((anchor) => DOWNLOAD_WORDS_RE.test(anchor.text));
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
    if (!resolved) {
      return NextResponse.redirect(record.source_url, 302);
    }

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
