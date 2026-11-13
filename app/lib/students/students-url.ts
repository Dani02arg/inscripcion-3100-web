import { isTutorRole } from "./access.ts";
import type { StudentFilters } from "./types.ts";

export const STUDENTS_PATH = "/dashboard/students";
export const STUDENT_NEW_PATH = `${STUDENTS_PATH}/new`;

/** Parámetros que se reflejan en la dirección; nunca incluyen DNI ni CUIL. */
export const STUDENT_FILTER_PARAM_KEYS = [
  "firstName",
  "lastName",
  "page",
] as const;

/** Parámetros de identificadores que se eliminan de la dirección si aparecen. */
export const STUDENT_SENSITIVE_PARAM_KEYS = [
  "studentDni",
  "studentCuil",
  "dni",
  "cuil",
] as const;

export interface StudentUrlState {
  readonly filters: StudentFilters;
  readonly page: number;
}

function toSearchParams(
  input: URLSearchParams | string,
): URLSearchParams {
  return input instanceof URLSearchParams
    ? input
    : new URLSearchParams(input);
}

function parsePage(value: string | null): number {
  if (value === null) {
    return 1;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** Lee nombre, apellido y página de la dirección; descarta valores inválidos. */
export function parseStudentUrl(
  input: URLSearchParams | string,
): StudentUrlState {
  const params = toSearchParams(input);

  return {
    filters: {
      studentDni: "",
      studentCuil: "",
      firstName: (params.get("firstName") ?? "").trim(),
      lastName: (params.get("lastName") ?? "").trim(),
    },
    page: parsePage(params.get("page")),
  };
}

/**
 * Escribe nombre, apellido y página conservando parámetros ajenos y
 * eliminando cualquier identificador que hubiera quedado en la dirección.
 */
export function serializeStudentFilters(
  filters: StudentFilters,
  page: number,
  existing?: URLSearchParams,
): string {
  const params = new URLSearchParams(existing);

  for (const key of STUDENT_FILTER_PARAM_KEYS) {
    params.delete(key);
  }

  for (const key of STUDENT_SENSITIVE_PARAM_KEYS) {
    params.delete(key);
  }

  const firstName = filters.firstName.trim();
  if (firstName.length > 0) {
    params.set("firstName", firstName);
  }

  const lastName = filters.lastName.trim();
  if (lastName.length > 0) {
    params.set("lastName", lastName);
  }

  if (Number.isSafeInteger(page) && page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

/** Devuelve la dirección del listado con los filtros no sensibles y la página. */
export function getStudentListPath(
  filters: StudentFilters,
  page: number,
  existing?: URLSearchParams,
): string {
  const query = serializeStudentFilters(filters, page, existing);
  return query.length > 0 ? `${STUDENTS_PATH}?${query}` : STUDENTS_PATH;
}

/** Dirección del formulario de alta. */
export function studentNewPath(): string {
  return STUDENT_NEW_PATH;
}

function encodeStudentId(studentId: string): string {
  return encodeURIComponent(studentId.trim());
}

/** Dirección del detalle; sin identificador vuelve al listado. */
export function studentDetailPath(studentId: string): string {
  const encoded = encodeStudentId(studentId);
  return encoded.length > 0
    ? `${STUDENTS_PATH}/${encoded}`
    : STUDENTS_PATH;
}

/** Dirección de la edición; sin identificador vuelve al listado. */
export function studentEditPath(studentId: string): string {
  const encoded = encodeStudentId(studentId);
  return encoded.length > 0
    ? `${STUDENTS_PATH}/${encoded}/edit`
    : STUDENTS_PATH;
}

/**
 * Solo acepta rutas internas del listado, con o sin query. Rechaza rutas
 * externas, doble barra, barras invertidas y subpantallas ajenas al listado.
 */
export function sanitizeStudentReturnPath(
  value: string | null | undefined,
): string {
  if (!value) {
    return STUDENTS_PATH;
  }

  const lower = value.toLowerCase();

  if (
    !value.startsWith(STUDENTS_PATH) ||
    lower.includes("//") ||
    lower.includes("%2f%2f") ||
    value.includes("\\")
  ) {
    return STUDENTS_PATH;
  }

  const pathname = value.split("?", 1)[0] ?? "";

  if (
    pathname !== STUDENTS_PATH &&
    pathname !== `${STUDENTS_PATH}/`
  ) {
    return STUDENTS_PATH;
  }

  return value;
}

/** Texto del enlace de regreso según el rol. */
export function getStudentReturnLabel(role: unknown): string {
  return isTutorRole(role) ? "Volver a mis hijos" : "Volver a alumnos";
}
