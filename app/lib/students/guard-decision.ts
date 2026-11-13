import { getEffectiveRole } from "../auth/effective-role.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  canAccessStudents,
  canCreateStudents,
  canEditStudents,
  isTutorRole,
} from "./access.ts";

export const STUDENT_SESSION_EXPIRED_PATH = "/session-expired";
export const STUDENT_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a este módulo.";
export const STUDENT_SECTION_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a esta sección.";
export const STUDENT_WRITE_DENIED_MESSAGE =
  "Esta operación es exclusiva de tutores.";

export type StudentAccessDecision = "allowed" | "forbidden";
export type StudentPageRoleDecision = StudentAccessDecision | "error";
export type StudentPageSection = "list" | "detail" | "new" | "edit";

/** Decisión de acceso del rol a una parte del módulo. */
export function getStudentAccessDecision(
  role: unknown,
): StudentAccessDecision {
  return canAccessStudents(role) ? "allowed" : "forbidden";
}

/**
 * Decisión por pantalla: lista y detalle admiten a los tres roles; el alta y
 * la edición son exclusivas del tutor.
 */
export function getStudentSectionAccessDecision(
  section: StudentPageSection,
  role: unknown,
): StudentAccessDecision {
  if (section === "new") {
    return canCreateStudents(role) ? "allowed" : "forbidden";
  }

  if (section === "edit") {
    return canEditStudents(role) ? "allowed" : "forbidden";
  }

  return getStudentAccessDecision(role);
}

/** Decisión de la página según la cuenta privada y el rol vigente. */
export function getStudentPageDecision(
  account: PrivateAccountState,
  section: StudentPageSection = "list",
): StudentPageRoleDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  if (account.status === "error") {
    return "error";
  }

  return getStudentSectionAccessDecision(
    section,
    getEffectiveRole(account),
  );
}

/** Alias de la decisión de una sección concreta para las páginas. */
export function getStudentSectionDecision(
  account: PrivateAccountState,
  section: StudentPageSection,
): StudentPageRoleDecision {
  return getStudentPageDecision(account, section);
}

/** Decisión de una Server Action de alta o edición: exclusiva del tutor. */
export function getStudentActionRoleDecision(
  account: PrivateAccountState,
): StudentAccessDecision {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  return isTutorRole(getEffectiveRole(account))
    ? "allowed"
    : "forbidden";
}
