import { isIdentifierInput } from "./list.ts";
import type { UserFilters, UserOrigin } from "./types.ts";

export const USERS_PATH = "/dashboard/users";
export const STAFF_PATH = "/dashboard/users/staff";

export const USER_FILTER_PARAM_KEYS = [
  "dni",
  "cuil",
  "name",
  "lastname",
  "email",
  "page",
] as const;

export interface UserUrlState {
  readonly filters: UserFilters;
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

function readIdentifier(
  params: URLSearchParams,
  key: "dni" | "cuil",
): string {
  const value = (params.get(key) ?? "").trim();
  return isIdentifierInput(value) ? value : "";
}

/** Lee filtros y página de la URL y descarta los valores inválidos. */
export function parseUserFilters(
  input: URLSearchParams | string,
): UserUrlState {
  const params = toSearchParams(input);

  return {
    filters: {
      dni: readIdentifier(params, "dni"),
      cuil: readIdentifier(params, "cuil"),
      name: (params.get("name") ?? "").trim(),
      lastname: (params.get("lastname") ?? "").trim(),
      email: (params.get("email") ?? "").trim(),
    },
    page: parsePage(params.get("page")),
  };
}

/** Escribe filtros y página en la query, conservando parámetros ajenos. */
export function serializeUserFilters(
  filters: UserFilters,
  page: number,
  existing?: URLSearchParams,
): string {
  const params = new URLSearchParams(existing);

  for (const key of USER_FILTER_PARAM_KEYS) {
    params.delete(key);
  }

  const dni = filters.dni.trim();
  if (dni.length > 0 && isIdentifierInput(dni)) {
    params.set("dni", dni);
  }

  const cuil = filters.cuil.trim();
  if (cuil.length > 0 && isIdentifierInput(cuil)) {
    params.set("cuil", cuil);
  }

  const name = filters.name.trim();
  if (name.length > 0) {
    params.set("name", name);
  }

  const lastname = filters.lastname.trim();
  if (lastname.length > 0) {
    params.set("lastname", lastname);
  }

  const email = filters.email.trim();
  if (email.length > 0) {
    params.set("email", email);
  }

  if (Number.isSafeInteger(page) && page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

/** Interpreta el origen del detalle; sin valor válido vuelve al padrón. */
export function getUserOrigin(
  value: string | null | undefined,
): UserOrigin {
  return value === "staff" ? "staff" : "users";
}

/** Ruta del listado correspondiente al origen. */
export function getUserOriginPath(origin: UserOrigin): string {
  return origin === "staff" ? STAFF_PATH : USERS_PATH;
}

/** Solo acepta el padrón o el directorio; ante cualquier otro valor usa el padrón. */
export function sanitizeUserReturnPath(
  value: string | null | undefined,
): string {
  if (value === "staff" || value === STAFF_PATH) {
    return STAFF_PATH;
  }

  if (value === "users" || value === USERS_PATH) {
    return USERS_PATH;
  }

  return USERS_PATH;
}
