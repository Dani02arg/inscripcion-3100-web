import type { CurrentUserResult } from "../api/me.ts";
import type { SessionClaims, CurrentUser } from "../auth/types.ts";

/** Estado de la cuenta privada para el armazón del dashboard. */
export type PrivateAccountState =
  | {
      readonly status: "ok";
      readonly claims: SessionClaims;
      readonly user: CurrentUser;
    }
  | {
      readonly status: "forbidden";
      readonly claims: SessionClaims;
    }
  | {
      readonly status: "error";
      readonly claims: SessionClaims;
      readonly message: string;
    };

/** Resultado del mapeo; `unauthorized` lo resuelve el cargador del servidor. */
export type PrivateAccountLookup =
  | PrivateAccountState
  | { readonly status: "unauthorized" };

/**
 * Traduce la respuesta de `GET /api/auth/me` a un estado de página.
 * No borra cookies ni redirige: eso queda en el cargador del servidor.
 */
export function mapCurrentUserResult(
  claims: SessionClaims,
  result: CurrentUserResult,
): PrivateAccountLookup {
  if (result.ok) {
    return { status: "ok", claims, user: result.user };
  }

  if (result.kind === "unauthorized") {
    return { status: "unauthorized" };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", claims };
  }

  return { status: "error", claims, message: result.message };
}
