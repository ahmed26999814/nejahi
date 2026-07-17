import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "mauriresults.vercel.app";
const LEGACY_HOST = "mauri-results.vercel.app";

export function middleware(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = String(forwardedHost || request.headers.get("host") || "")
    .split(":")[0]
    .trim()
    .toLowerCase();

  if (host === LEGACY_HOST) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.hostname = CANONICAL_HOST;
    canonicalUrl.port = "";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (request.nextUrl.pathname === "/api/public-exams") {
    const url = request.nextUrl.clone();
    if (url.searchParams.has("client")) return NextResponse.next();

    const isBrowserRequest = Boolean(
      request.headers.get("sec-fetch-site") ||
      request.headers.get("sec-fetch-mode") ||
      request.headers.get("referer")
    );

    if (!isBrowserRequest) {
      url.searchParams.set("client", "mobile");
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
