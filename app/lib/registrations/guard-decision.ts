import { getEffectiveRole } from "../auth/effective-role.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import { canEvaluateRegistrations, isStaffRole } from "./access.ts";

export const REGISTRATION_SESSION_EXPIRED_PATH = "/session-expired";
export const REGISTRATION_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a este módulo.";
export const REGISTRATION_EVALUATE_DENIED_MESSAGE =
  "Esta operación es exclusiva de los roles de secretaría y administración.";

export type RegistrationAccessDecision = "allowed" | "forbidden";
export type RegistrationPageRoleDecision =
  | RegistrationAccessDecision
  | "error";
export type RegistrationPageSection = "list" | "detail";

/** Decisión de acceso del rol al módulo de inscripciones. */
export function getRegistrationAccessDecision(
  role: unknown,
): RegistrationAccessDecision {
  return canEvaluateRegistrations(role) ? "allowed" : "forbidden";
}

/** Decisión por pantalla: lista y detalle requieren un rol de staff. */
export function getRegistrationSectionAccessDecision(
  _section: RegistrationPageSection,
  role: unknown,
): RegistrationAccessDecision {
  return getRegistrationAccessDecision(role);
}

/** Decisión de la página según la cuenta privada y el rol vigente. */
export function getRegistrationPageDecision(
  account: PrivateAccountState,
  section: RegistrationPageSection = "list",
): RegistrationPageRoleDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  if (account.status === "error") {
    return "error";
  }

  return getRegistrationSectionAccessDecision(
    section,
    getEffectiveRole(account),
  );
}

/** Decisión de una Server Action de dictamen: solo roles de staff. */
export function getRegistrationActionRoleDecision(
  account: PrivateAccountState,
): RegistrationAccessDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  return isStaffRole(getEffectiveRole(account)) ? "allowed" : "forbidden";
}
