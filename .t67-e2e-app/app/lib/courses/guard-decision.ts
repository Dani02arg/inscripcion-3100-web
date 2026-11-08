import { getEffectiveRole } from "../auth/effective-role.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import { canManageCourses } from "./access.ts";

export const COURSE_SESSION_EXPIRED_PATH = "/session-expired";
export const COURSE_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a este módulo.";

export type CourseAccessDecision = "allowed" | "forbidden";

export type CoursePageRoleDecision = CourseAccessDecision | "error";

/** Decisión pura de acceso por rol, reutilizable en páginas y acciones. */
export function getCourseAccessDecision(
  role: unknown,
): CourseAccessDecision {
  return canManageCourses(role) ? "allowed" : "forbidden";
}

/**
 * Decisión de acceso a una página de cursos con el rol efectivo.
 * Una cuenta denegada prevalece; un error de perfil se informa como error.
 */
export function getCoursePageRoleDecision(
  account: PrivateAccountState,
): CoursePageRoleDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  if (account.status === "error") {
    return "error";
  }

  const role = getEffectiveRole(account);
  return role !== null && canManageCourses(role) ? "allowed" : "forbidden";
}

/**
 * Decisión de acceso de una Server Action con el rol efectivo.
 * Si el perfil no está disponible, cae al rol del token.
 */
export function getCourseActionRoleDecision(
  account: PrivateAccountState,
): CourseAccessDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  const role = getEffectiveRole(account);
  return role !== null && canManageCourses(role) ? "allowed" : "forbidden";
}
