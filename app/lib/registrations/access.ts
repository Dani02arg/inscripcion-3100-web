import type { UserRole } from "../auth/types.ts";

/** Roles que evalúan solicitudes de inscripción. */
export const REGISTRATION_MANAGER_ROLES = Object.freeze([
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly UserRole[]);

export type RegistrationManagerRole =
  (typeof REGISTRATION_MANAGER_ROLES)[number];

/** Indica si el valor es un rol del staff (secretaría o administración). */
export function isStaffRole(role: unknown): role is RegistrationManagerRole {
  return (
    typeof role === "string" &&
    (REGISTRATION_MANAGER_ROLES as readonly string[]).includes(role)
  );
}

/** Indica si el rol puede evaluar (emitir dictámenes sobre) solicitudes. */
export function canEvaluateRegistrations(role: unknown): boolean {
  return isStaffRole(role);
}
