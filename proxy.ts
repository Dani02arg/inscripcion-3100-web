import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decodeSessionToken, isSessionExpired } from "./app/lib/auth/session.ts";

const SESSION_COOKIE_NAME = "token";

function hasValidSession(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const claims = decodeSessionToken(token);

  if (!claims || isSessionExpired(claims, Date.now())) {
    return false;
  }

  return true;
}

/** Redirecciones optimistas de sesión; la protección real vive en el DAL. */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionValid = hasValidSession(request);

  if (pathname === "/login" && sessionValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard") && !sessionValid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
