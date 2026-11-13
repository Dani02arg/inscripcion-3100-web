import type { UserRole } from "../auth/types.ts";

/** Roles que pueden consultar alumnos: el tutor ve los propios y los demás, todos. */
export const STUDENT_READER_ROLES = Object.freeze([
  "TUTOR",
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly UserRole[]);

/** Solo el tutor registra y actualiza alumnos. */
export const STUDENT_WRITER_ROLES = Object.freeze([
  "TUTOR",
] as const satisfies readonly UserRole[]);

export type StudentReaderRole = (typeof STUDENT_READER_ROLES)[number];
export type StudentWriterRole = (typeof STUDENT_WRITER_ROLES)[number];

/** Indica si el valor es un rol con acceso al módulo de alumnos. */
export function isStudentReaderRole(
  role: unknown,
): role is StudentReaderRole {
  return (
    typeof role === "string" &&
    (STUDENT_READER_ROLES as readonly string[]).includes(role)
  );
}

/** Indica si el valor corresponde al rol tutor. */
export function isTutorRole(role: unknown): role is StudentWriterRole {
  return role === "TUTOR";
}

/** Cualquier rol conocido puede entrar al módulo; el alcance lo define la vista. */
export function canAccessStudents(role: unknown): boolean {
  return isStudentReaderRole(role);
}

/** Solo los roles administrativos consultan el padrón completo. */
export function canReadAllStudents(role: unknown): boolean {
  return role === "ADMINISTRATIVO" || role === "ADMINISTRADOR";
}

/** Solo el tutor registra y actualiza alumnos propios. */
export function canWriteStudents(role: unknown): boolean {
  return isTutorRole(role);
}

/** Alta de alumnos: exclusiva del tutor. */
export function canCreateStudents(role: unknown): boolean {
  return canWriteStudents(role);
}

/** Edición de alumnos: exclusiva del tutor. */
export function canEditStudents(role: unknown): boolean {
  return canWriteStudents(role);
}
