import type { UserRole } from "../auth/types.ts";

export const USER_MANAGER_ROLES = Object.freeze([
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly UserRole[]);

export type UserManagerRole = (typeof USER_MANAGER_ROLES)[number];

export function isUserManagerRole(role: unknown): role is UserManagerRole {
  return (
    typeof role === "string" &&
    (USER_MANAGER_ROLES as readonly string[]).includes(role)
  );
}

/** Solo administrativos y administradores acceden al padrón y al directorio. */
export function canManageUsers(role: unknown): boolean {
  return isUserManagerRole(role);
}

/** Solo el administrador cambia roles y da de baja usuarios. */
export function canAdministerUsers(role: unknown): boolean {
  return role === "ADMINISTRADOR";
}

/** Solo el tutor solicita un cambio de rol. */
export function canRequestRoleChange(role: unknown): boolean {
  return role === "TUTOR";
}

/** Solo el tutor actualiza su ocupación y nivel educativo. */
export function canEditOwnProfile(role: unknown): boolean {
  return role === "TUTOR";
}
