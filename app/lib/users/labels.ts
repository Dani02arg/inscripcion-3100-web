import { isKnownRole } from "../auth/session.ts";
import { ROLE_LABELS, type UserRole } from "../auth/types.ts";
import {
  EDUCATION_LEVELS,
  type EducationLevel,
  type UserSummary,
} from "./types.ts";

export const USER_UNKNOWN_LABEL = "No disponible";
export const USER_NO_INFO_LABEL = "No informado";
export const ROLE_FILTER_ALL_LABEL = "Todos";

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  PRIMARIO: "Primario",
  SECUNDARIO: "Secundario",
  TERCIARIO: "Terciario",
  UNIVERSITARIO: "Universitario",
  POSTGRADO: "Postgrado",
};

export interface UserOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface UserFilterOption<T extends string> {
  readonly value: T | "all";
  readonly label: string;
}

export const USER_ROLE_FORM_OPTIONS: readonly UserOption<UserRole>[] = [
  { value: "TUTOR", label: ROLE_LABELS.TUTOR },
  { value: "ADMINISTRATIVO", label: ROLE_LABELS.ADMINISTRATIVO },
  { value: "ADMINISTRADOR", label: ROLE_LABELS.ADMINISTRADOR },
];

export const ROLE_FILTER_OPTIONS: readonly UserFilterOption<
  Exclude<UserRole, "TUTOR">
>[] = [
  { value: "all", label: ROLE_FILTER_ALL_LABEL },
  { value: "ADMINISTRATIVO", label: ROLE_LABELS.ADMINISTRATIVO },
  { value: "ADMINISTRADOR", label: ROLE_LABELS.ADMINISTRADOR },
];

export const EDUCATION_LEVEL_OPTIONS: readonly UserOption<EducationLevel>[] =
  EDUCATION_LEVELS.map((value) => ({
    value,
    label: EDUCATION_LEVEL_LABELS[value],
  }));

export function isEducationLevel(value: unknown): value is EducationLevel {
  return (
    typeof value === "string" &&
    (EDUCATION_LEVELS as readonly string[]).includes(value)
  );
}

/** Etiqueta visible del rol; un rol desconocido no se presenta como válido. */
export function getUserRoleLabel(value: string): string {
  return isKnownRole(value) ? ROLE_LABELS[value] : USER_UNKNOWN_LABEL;
}

/** Etiqueta visible del nivel educativo o «No informado» si falta. */
export function getEducationLevelLabel(
  value: string | null | undefined,
): string {
  return value !== null && value !== undefined && isEducationLevel(value)
    ? EDUCATION_LEVEL_LABELS[value]
    : USER_NO_INFO_LABEL;
}

/** Nombre y apellido visibles de la fila o «No informado» si faltan ambos. */
export function formatUserFullName(
  user: Pick<UserSummary, "name" | "lastname">,
): string {
  const fullName = `${user.name.trim()} ${user.lastname.trim()}`.trim();
  return fullName.length > 0 ? fullName : USER_NO_INFO_LABEL;
}

/** Descripción accesible de una fila de usuario con los datos visibles. */
export function buildUserRowLabel(user: UserSummary): string {
  const fullName = formatUserFullName(user);
  const dni =
    user.dni && user.dni.trim().length > 0
      ? user.dni.trim()
      : USER_NO_INFO_LABEL;
  const email =
    user.email && user.email.trim().length > 0
      ? user.email.trim()
      : USER_NO_INFO_LABEL;

  return [
    `Usuario ${fullName}`,
    `DNI ${dni}`,
    `correo ${email}`,
    `rol ${getUserRoleLabel(user.role)}`,
  ].join(", ");
}
