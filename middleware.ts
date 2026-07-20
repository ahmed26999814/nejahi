import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.searchParams.has("client")) return NextResponse.next();

  const isBrowserRequest = Boolean(
    request.headers.get("sec-fetch-site")
    || request.headers.get("sec-fetch-mode")
    || request.headers.get("referer")
  );

  if (!isBrowserRequest) {
    url.searchParams.set("client", "mobile");
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/public-exams"],
};
