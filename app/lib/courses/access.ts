import type { UserRole } from "../auth/types.ts";

export const COURSE_MANAGER_ROLES = [
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly UserRole[];

export type CourseManagerRole = (typeof COURSE_MANAGER_ROLES)[number];

export function isCourseManagerRole(role: unknown): role is CourseManagerRole {
  return (
    typeof role === "string" &&
    (COURSE_MANAGER_ROLES as readonly string[]).includes(role)
  );
}

/** Solo administrativos y administradores acceden al módulo de cursos. */
export function canManageCourses(role: unknown): boolean {
  return isCourseManagerRole(role);
}
