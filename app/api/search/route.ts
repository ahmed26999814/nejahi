import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const SITE_URL = "https://mauri-results.vercel.app";
const REQUIRED_APP_VERSION = "3.0.0";

const SOURCE_ALIASES: Record<string, string> = {
  bac_2026: "bac",
  brevet_2026: "brevet",
  concours_2026: "concours",
  bac_session_2026: "bac_session",
  excellence_1as_2026: "excellence_1as",
};

const BUILTIN_SOURCES = new Set([
  "bac",
  "brevet",
  "concours",
  "bac_session",
  "excellence_1as",
]);

function asciiDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)));
}

function normalizeCandidateNumber(value: string) {
  const digits = asciiDigits(String(value || "").trim()).slice(0, 20);
  if (!/^\d{1,20}$/.test(digits)) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function normalizeSource(value: string) {
  const source = String(value || "").trim();
  const canonical = SOURCE_ALIASES[source] || source;
  if (BUILTIN_SOURCES.has(canonical)) return canonical;
  return /^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(canonical) ? canonical : "";
}

function sourceToToken(source: string) {
  return source.startsWith("upload:")
    ? `upload--${source.slice("upload:".length)}`
    : source;
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Netlify-CDN-Cache-Control": "no-store",
  };
}

function isLegacyNativeRequest(request: Request) {
  if (request.headers.get("x-mauriresults-client") === "flutter-native") return false;
  const userAgent = String(request.headers.get("user-agent") || "").toLowerCase();
  return userAgent.includes("okhttp")
    || userAgent.includes("expo")
    || userAgent.includes("reactnative")
    || userAgent.includes("react-native");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sourceInput = String(url.searchParams.get("source") || "").trim();

  if (sourceInput === "update_required_v3") {
    return NextResponse.json(
      {
        rows: [{
          Numero: "3.0.0",
          NOM: "هذا الإصدار متوقف — نزّل التحديث الجديد",
          MOD: "3.0.0",
          KR: `افتح ${SITE_URL.replace("https://", "")}/Apk ونزّل النسخة الجديدة`,
          WL: "تحديث إجباري",
          MS: "MauriResults",
          MD: "لا يمكن متابعة النسخة القديمة",
        }],
        updateRequired: true,
        minimumSupportedVersion: REQUIRED_APP_VERSION,
        downloadUrl: `${SITE_URL}/Apk/`,
      },
      { status: 200, headers: noStoreHeaders() },
    );
  }

  if (isLegacyNativeRequest(request)) {
    return NextResponse.json(
      {
        rows: [],
        error: "هذا الإصدار متوقف. نزّل تحديث MauriResults الجديد 3.0.0.",
        updateRequired: true,
        minimumSupportedVersion: REQUIRED_APP_VERSION,
        downloadUrl: `${SITE_URL}/Apk/`,
      },
      { status: 426, headers: noStoreHeaders() },
    );
  }

  const source = normalizeSource(sourceInput);
  if (!source) {
    return NextResponse.json(
      { rows: [], error: "Unknown source" },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const candidateKey = normalizeCandidateNumber(String(url.searchParams.get("q") || ""));
  if (!candidateKey) {
    return NextResponse.json(
      { rows: [], error: "Candidate number must contain digits only" },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const target = new URL(
    `/api/result-number/${encodeURIComponent(sourceToToken(source))}/${encodeURIComponent(candidateKey)}`,
    request.url,
  );
  const response = NextResponse.redirect(target, 307);
  Object.entries(noStoreHeaders()).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set("X-Mauri-Search", "NUMBER-REDIRECT");
  return response;
}
