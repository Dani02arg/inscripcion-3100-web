import { isKnownRole } from "../auth/session.ts";
import { normalizeSearch } from "../courses/list.ts";
import type {
  DirectoryFilters,
  RoleFilter,
  UserFilters,
  UserPage,
  UserSummary,
} from "./types.ts";

export const USER_PAGE_SIZE = 10;

/** Recorta y deja solo los dígitos del identificador. */
export function normalizeIdentifier(value: string): string {
  return value.replace(/\D/g, "");
}

/** Acepta vacío o solo dígitos; rechaza puntos, espacios, guiones y letras. */
export function isIdentifierInput(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || /^\d+$/.test(trimmed);
}

/** Normaliza el identificador de usuario a texto para compararlo. */
export function normalizeUserId(value: string | number): string {
  return String(value).trim();
}

export function getDefaultUserFilters(): UserFilters {
  return {
    dni: "",
    cuil: "",
    name: "",
    lastname: "",
    email: "",
  };
}

export function getDefaultDirectoryFilters(): DirectoryFilters {
  return {
    ...getDefaultUserFilters(),
    role: "all",
  };
}

export function clearUserFilters(): UserFilters {
  return getDefaultUserFilters();
}

export function clearDirectoryFilters(): DirectoryFilters {
  return getDefaultDirectoryFilters();
}

/** Hay filtros activos si al menos un campo recortado no está vacío. */
export function hasActiveUserFilters(filters: UserFilters): boolean {
  return [
    filters.dni,
    filters.cuil,
    filters.name,
    filters.lastname,
    filters.email,
  ].some((value) => value.trim().length > 0);
}

export function hasActiveDirectoryFilters(
  filters: DirectoryFilters,
): boolean {
  return hasActiveUserFilters(filters) || filters.role !== "all";
}

export function isRoleFilter(value: unknown): value is RoleFilter {
  return (
    value === "all" ||
    (isKnownRole(value) && value !== "TUTOR")
  );
}

/** Filtra el directorio sobre el conjunto completo sin mutar la entrada. */
export function filterDirectoryUsers(
  users: readonly UserSummary[],
  filters: DirectoryFilters,
): UserSummary[] {
  const name = normalizeSearch(filters.name);
  const lastname = normalizeSearch(filters.lastname);
  const email = normalizeSearch(filters.email);
  const dni = normalizeIdentifier(filters.dni);
  const cuil = normalizeIdentifier(filters.cuil);

  return users.filter((user) => {
    if (name.length > 0 && !normalizeSearch(user.name).includes(name)) {
      return false;
    }

    if (
      lastname.length > 0 &&
      !normalizeSearch(user.lastname).includes(lastname)
    ) {
      return false;
    }

    if (
      email.length > 0 &&
      !normalizeSearch(user.email ?? "").includes(email)
    ) {
      return false;
    }

    if (dni.length > 0 && normalizeIdentifier(user.dni ?? "") !== dni) {
      return false;
    }

    if (cuil.length > 0 && normalizeIdentifier(user.cuil ?? "") !== cuil) {
      return false;
    }

    if (filters.role !== "all" && user.role !== filters.role) {
      return false;
    }

    return true;
  });
}

/** Pagina el conjunto y ajusta la página a `1..última`. */
export function paginateUserList(
  users: readonly UserSummary[],
  page: number,
  pageSize = USER_PAGE_SIZE,
): UserPage {
  const size =
    Number.isSafeInteger(pageSize) && pageSize > 0
      ? pageSize
      : USER_PAGE_SIZE;
  const total = users.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const requestedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * size;
  const items = users.slice(startIndex, startIndex + size);

  return {
    items,
    page: currentPage,
    pageSize: size,
    total,
    totalPages,
    from: total === 0 ? 0 : startIndex + 1,
    to: total === 0 ? 0 : startIndex + items.length,
  };
}
