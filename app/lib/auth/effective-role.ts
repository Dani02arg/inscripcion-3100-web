import { isKnownRole } from "./session.ts";
import type { UserRole } from "./types.ts";

/** Fuente mínima con un rol verificable. */
export interface RoleCarrier {
  readonly role: unknown;
}

/**
 * Entrada del rol efectivo: el estado de la cuenta privada tal como lo
 * devuelve la capa de sesión. El perfil del servicio prevalece.
 */
export interface EffectiveRoleSource {
  readonly status: "ok" | "forbidden" | "error" | "unauthorized";
  readonly user?: RoleCarrier | null;
  readonly claims?: RoleCarrier | null;
}

/**
 * Devuelve el rol vigente para la interfaz.
 * Prioriza el rol de `GET /api/auth/me`; si no está disponible, cae al rol
 * del token. Devuelve `null` cuando no hay ningún rol conocido.
 */
export function getEffectiveRole(
  account: EffectiveRoleSource | null | undefined,
): UserRole | null {
  if (!account) {
    return null;
  }

  if (
    account.status === "ok" &&
    account.user &&
    isKnownRole(account.user.role)
  ) {
    return account.user.role;
  }

  if (account.claims && isKnownRole(account.claims.role)) {
    return account.claims.role;
  }

  return null;
}
