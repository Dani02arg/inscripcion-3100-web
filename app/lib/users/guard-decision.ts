import { getEffectiveRole } from "../auth/effective-role.ts";
import { isKnownRole } from "../auth/session.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  canEditOwnProfile,
  canManageUsers,
  canRequestRoleChange,
} from "./access.ts";

export const USER_SESSION_EXPIRED_PATH = "/session-expired";
export const USER_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a este módulo.";
export const PROFILE_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a esta sección.";
export const TUTOR_ACTION_DENIED_MESSAGE =
  "Esta operación es exclusiva de tutores.";

export type UserAccessDecision = "allowed" | "forbidden";
export type UserPageRoleDecision = UserAccessDecision | "error";

export function getUserAccessDecision(role: unknown): UserAccessDecision {
  return canManageUsers(role) ? "allowed" : "forbidden";
}

export function getProfileAccessDecision(role: unknown): UserAccessDecision {
  return isKnownRole(role) ? "allowed" : "forbidden";
}

export function getTutorProfileAccessDecision(
  role: unknown,
): UserAccessDecision {
  return canEditOwnProfile(role) ? "allowed" : "forbidden";
}

export function getRoleRequestAccessDecision(
  role: unknown,
): UserAccessDecision {
  return canRequestRoleChange(role) ? "allowed" : "forbidden";
}

/** Decisión de la página de gestión con el rol efectivo del perfil. */
export function getUserPageRoleDecision(
  account: PrivateAccountState,
): UserPageRoleDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  if (account.status === "error") {
    return "error";
  }

  return getUserAccessDecision(getEffectiveRole(account));
}

/** Decisión de las páginas de perfil y cuenta. */
export function getProfilePageRoleDecision(
  account: PrivateAccountState,
): UserPageRoleDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  if (account.status === "error") {
    return "error";
  }

  return getProfileAccessDecision(getEffectiveRole(account));
}

/** Decisión de una Server Action de gestión. */
export function getUserActionRoleDecision(
  account: PrivateAccountState,
): UserAccessDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  return getUserAccessDecision(getEffectiveRole(account));
}

/** Decisión de la actualización del perfil de tutor. */
export function getTutorActionRoleDecision(
  account: PrivateAccountState,
): UserAccessDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  return getTutorProfileAccessDecision(getEffectiveRole(account));
}

/** Decisión de la solicitud de cambio de rol. */
export function getRoleRequestActionRoleDecision(
  account: PrivateAccountState,
): UserAccessDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  return getRoleRequestAccessDecision(getEffectiveRole(account));
}
