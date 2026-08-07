// proxy.ts — Next.js 16 route proxy (formerly middleware).
//
// Optimistic auth gate for the /app workspace: it only checks that an Auth.js
// session cookie is *present* and redirects to /signin when it isn't. Per the
// Next.js auth guide, proxy must not hit the database (it runs on every matched
// request, including prefetches) — the authoritative check is the database
// session validated in server code (auth() in server actions / route handlers)
// and the client RequireAuth guard, which catches a present-but-stale cookie.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth.js names the session cookie `authjs.session-token`, prefixed with
// `__Secure-` once it's served over HTTPS. Check both so the gate works in
// local dev and production without configuration.
const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;

export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has(SECURE_SESSION_COOKIE);

  if (!hasSession) {
    const signInUrl = new URL("/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
