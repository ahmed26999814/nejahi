import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function clean(value: unknown, maxLength = 160) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function asciiDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)));
}

function candidateKey(value: string) {
  const digits = asciiDigits(clean(value, 20));
  if (!/^\d{1,20}$/.test(digits)) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function sourceToToken(source: string) {
  return source.startsWith("upload:")
    ? `upload--${source.slice("upload:".length)}`
    : "";
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Netlify-CDN-Cache-Control": "no-store",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = clean(searchParams.get("source"), 80);
  const wilaya = clean(searchParams.get("wilaya"));
  const moughataa = clean(searchParams.get("moughataa"));
  const centre = clean(searchParams.get("centre"));
  const key = candidateKey(clean(searchParams.get("number"), 20));

  if (!/^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(source)) {
    return NextResponse.json(
      { rows: [], error: "Invalid source" },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  if (![wilaya, moughataa, centre, key].every(Boolean)) {
    return NextResponse.json(
      { rows: [], error: "All location fields and candidate number are required" },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const path = [
    "/api/concours-number",
    encodeURIComponent(sourceToToken(source)),
    encodeURIComponent(wilaya),
    encodeURIComponent(moughataa),
    encodeURIComponent(centre),
    encodeURIComponent(key),
  ].join("/");

  const response = NextResponse.redirect(new URL(path, request.url), 307);
  Object.entries(noStoreHeaders()).forEach(([header, value]) => response.headers.set(header, value));
  response.headers.set("X-Mauri-Search", "NUMBER-REDIRECT");
  return response;
}
