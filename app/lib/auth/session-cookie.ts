import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { SessionClaims } from "./types.ts";
import { decodeSessionToken, isSessionExpired } from "./session.ts";

export const SESSION_COOKIE_NAME = "token";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Lee y valida la sesión de la cookie; devuelve `null` si no hay o es inválida. */
export async function getSessionClaims(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const claims = decodeSessionToken(token);

  if (!claims || isSessionExpired(claims, Date.now())) {
    return null;
  }

  return claims;
}

/** Devuelve el token crudo de la cookie, sin validarlo. */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Escribe la cookie de sesión con las opciones de seguridad de la spec. */
export async function createSession(
  token: string,
  claims: SessionClaims,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires: new Date(claims.exp * 1000),
  });
}

/** Borra la cookie de sesión. */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Devuelve la sesión vigente o redirige a `/login`. Memoizado por render. */
export const verifySession = cache(async (): Promise<SessionClaims> => {
  const claims = await getSessionClaims();

  if (!claims) {
    redirect("/login");
  }

  return claims;
});
