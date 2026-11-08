import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "../lib/auth/session-cookie.ts";

/**
 * Limpia la cookie de sesión rechazada por el backend y vuelve al login.
 * El borrado ocurre en un Route Handler, donde sí está permitido.
 */
export function GET(request: Request): NextResponse {
  const response = NextResponse.redirect(
    new URL("/login?reason=session-expired", request.url),
  );

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
