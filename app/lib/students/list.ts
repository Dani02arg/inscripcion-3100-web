import { normalizeSearch } from "../courses/list.ts";
import type {
  Student,
  StudentFilters,
  StudentPage,
} from "./types.ts";

/** Cantidad de alumnos por página del padrón. */
export const STUDENT_PAGE_SIZE = 15;

/** Longitudes máximas de los identificadores de los filtros. */
export const STUDENT_IDENTIFIER_MAX_LENGTH = Object.freeze({
  studentDni: 8,
  studentCuil: 11,
} as const);

export function getDefaultStudentFilters(): StudentFilters {
  return {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
  };
}

/** Devuelve un conjunto de filtros vacío y nuevo en cada llamada. */
export function clearStudentFilters(): StudentFilters {
  return getDefaultStudentFilters();
}

/** Hay filtros activos si al menos un campo recortado no está vacío. */
export function hasActiveStudentFilters(filters: StudentFilters): boolean {
  return [
    filters.studentDni,
    filters.studentCuil,
    filters.firstName,
    filters.lastName,
  ].some((value) => value.trim().length > 0);
}

/** Deja solo los dígitos de un identificador. */
export function normalizeStudentDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Acepta vacío o solo dígitos y, cuando se indica, respeta el largo máximo.
 * Rechaza puntos, espacios, guiones y letras.
 */
export function isStudentIdentifierInput(
  value: string,
  maxLength?: number,
): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return true;
  }

  if (!/^\d+$/.test(trimmed)) {
    return false;
  }

  return maxLength === undefined || trimmed.length <= maxLength;
}

/**
 * Filtra el conjunto completo sin mutar la entrada: DNI y CUIL se comparan
 * exactos y por dígitos; nombre y apellido, de forma parcial y sin distinguir
 * mayúsculas ni tildes. Conserva el orden recibido.
 */
export function filterStudents(
  students: readonly Student[],
  filters: StudentFilters,
): Student[] {
  const dni = filters.studentDni.trim();
  const cuil = filters.studentCuil.trim();
  const firstName = normalizeSearch(filters.firstName);
  const lastName = normalizeSearch(filters.lastName);
  const normalizedDni = normalizeStudentDigits(dni);
  const normalizedCuil = normalizeStudentDigits(cuil);

  return students.filter((student) => {
    if (
      dni.length > 0 &&
      normalizeStudentDigits(student.studentDni) !== normalizedDni
    ) {
      return false;
    }

    if (
      cuil.length > 0 &&
      normalizeStudentDigits(student.studentCuil) !== normalizedCuil
    ) {
      return false;
    }

    if (
      firstName.length > 0 &&
      !normalizeSearch(student.firstName).includes(firstName)
    ) {
      return false;
    }

    if (
      lastName.length > 0 &&
      !normalizeSearch(student.lastName).includes(lastName)
    ) {
      return false;
    }

    return true;
  });
}

/** Pagina el conjunto y ajusta la página a `1..última`. */
export function paginateStudents(
  students: readonly Student[],
  page: number,
  pageSize = STUDENT_PAGE_SIZE,
): StudentPage {
  const size =
    Number.isSafeInteger(pageSize) && pageSize > 0
      ? pageSize
      : STUDENT_PAGE_SIZE;
  const total = students.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const requestedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * size;
  const items = students.slice(startIndex, startIndex + size);

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
