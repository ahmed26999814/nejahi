import { NextResponse } from "next/server";

export function middleware(request) {
  const response = NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

  const isCandidateResultRequest = pathname === "/"
    && (searchParams.has("candidate") || searchParams.has("source"));

  if (isCandidateResultRequest) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/"],
};
