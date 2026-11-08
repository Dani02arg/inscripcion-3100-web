import { redirect } from "next/navigation";

import { getCurrentUser } from "../api/me.ts";
import {
  getSessionToken,
  verifySession,
} from "../auth/session-cookie.ts";
import {
  mapCurrentUserResult,
  type PrivateAccountState,
} from "./private-account-state.ts";

const SESSION_EXPIRED_PATH = "/session-expired";

/**
 * Carga la cuenta privada en el servidor.
 * Sin sesión redirige a `/login`; con `401` limpia la cookie en un Route
 * Handler y avisa del vencimiento; con `403` conserva la sesión y devuelve
 * el estado denegado.
 */
export async function getPrivateAccount(): Promise<PrivateAccountState> {
  const claims = await verifySession();
  const token = await getSessionToken();

  if (!token) {
    redirect(SESSION_EXPIRED_PATH);
  }

  const result = await getCurrentUser(token);
  const mapped = mapCurrentUserResult(claims, result);

  if (mapped.status === "unauthorized") {
    redirect(SESSION_EXPIRED_PATH);
  }

  return mapped;
}
