import { NextRequest } from "next/server";

const ALLOWED_HOST = "docs.bsimr.com";
const ALLOWED_PATH_PREFIX = "/pdfs/";

function safeFilename(value: string) {
  return value.replace(/[\r\n"\\/]/g, "_").slice(0, 160) || "book.pdf";
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const requestedName = request.nextUrl.searchParams.get("name");

  if (!rawUrl) {
    return new Response("رابط الكتاب غير موجود.", { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return new Response("رابط الكتاب غير صالح.", { status: 400 });
  }

  if (
    sourceUrl.protocol !== "https:" ||
    sourceUrl.hostname !== ALLOWED_HOST ||
    !sourceUrl.pathname.startsWith(ALLOWED_PATH_PREFIX) ||
    !sourceUrl.pathname.toLowerCase().endsWith(".pdf")
  ) {
    return new Response("هذا المصدر غير مسموح به.", { status: 403 });
  }

  try {
    const upstream = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: { "User-Agent": "MauriResults-Book-Downloader/1.0" },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("تعذر تحميل الكتاب من المصدر.", { status: 502 });
    }

    const fallbackName = decodeURIComponent(sourceUrl.pathname.split("/").pop() || "book.pdf");
    const filename = safeFilename(requestedName || fallbackName);
    const encodedFilename = encodeURIComponent(filename);
    const headers = new Headers();

    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="book.pdf"; filename*=UTF-8''${encodedFilename}`);
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("X-Content-Type-Options", "nosniff");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return new Response("حدث خطأ أثناء تنزيل الكتاب.", { status: 500 });
  }
}
