import { NextResponse } from "next/server";

// Next.js redirects match paths without case sensitivity. Check the original
// pathname here so the lowercase download page can never redirect to itself.
export function middleware(request) {
  if (request.nextUrl.pathname === "/Apk") {
    return NextResponse.redirect(new URL("/apk", request.url), 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/Apk"], runtime: "nodejs" };
