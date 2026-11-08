import type { UserRole } from "../auth/types.ts";

/** En esta versión el tutor muestra el estado vacío de alumnos. */
export function showsTutorEmptyState(role: UserRole): boolean {
  return role === "TUTOR";
}

/** Saludo personalizado del tutor. */
export function tutorGreeting(name: string): string {
  return `¡Hola, ${name}!`;
}
