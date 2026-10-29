import {
  findStudyFile,
  isTrustedDriveDownloadUrl,
  driveSourceUrls,
  safeStudyFilename,
  allowedStudyFileLength,
} from "../../../../lib/study-download.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const FILE_MIME = {
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

async function fetchTrustedDrive(url) {
  for (let redirect = 0; redirect < 6; redirect += 1) {
    if (!isTrustedDriveDownloadUrl(url)) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    let response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/pdf,application/octet-stream,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*;q=0.5" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (response.status >= 300 && response.status < 400) {
      const destination = response.headers.get("location");
      await response.body?.cancel().catch(() => {});
      if (!destination) return null;
      url = new URL(destination, url).toString();
      continue;
    }
    return response;
  }
  return null;
}

function isBinaryFileResponse(response) {
  if (!response?.ok || !response.body) return false;
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (!type || /(?:text\/html|text\/plain|application\/json|application\/xml)/.test(type)) return false;
  const accepted = [
    "application/pdf",
    "application/octet-stream",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
  ];
  return accepted.some(mime => type.includes(mime)) &&
    allowedStudyFileLength(response.headers.get("content-length"));
}

async function handleDownload(request, headOnly) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const file = findStudyFile(id);
  if (!file) return Response.json({ error: "الملف غير موجود." }, { status: 404 });

  for (const source of driveSourceUrls(id)) {
    try {
      const upstream = await fetchTrustedDrive(source);
      if (!upstream) continue;
      if (!isBinaryFileResponse(upstream)) {
        await upstream.body?.cancel().catch(() => {});
        continue;
      }

      const filename = safeStudyFilename(file);
      const headers = new Headers({
        "Content-Type": FILE_MIME[file.fileType] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="study-file.${(file.fileType || "PDF").toLowerCase()}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      });
      const length = upstream.headers.get("content-length");
      if (length) headers.set("Content-Length", length);
      if (headOnly) {
        await upstream.body?.cancel().catch(() => {});
        return new Response(null, { status: 200, headers });
      }
      return new Response(upstream.body, { status: 200, headers });
    } catch (error) {
      console.warn("study-files:download source unavailable", error instanceof Error ? error.message : "unknown error");
    }
  }
  return Response.json(
    { error: "تعذر تنزيل هذا الملف مباشرة. قد يحتاج إلى إذن من صاحب المجلد." },
    { status: 424, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request) {
  return handleDownload(request, false);
}

export async function HEAD(request) {
  const response = await handleDownload(request, true);
  return new Response(null, { status: response.status, headers: response.headers });
}
