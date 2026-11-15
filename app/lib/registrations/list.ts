import { normalizeSearch } from "../courses/list.ts";
import type {
  Registration,
  RegistrationFilters,
  RegistrationPage,
  RegistrationStatusTab,
} from "./types.ts";

/** Reutiliza la normalización de búsqueda de Cursos. */
export { normalizeSearch };

/** Cantidad de solicitudes por página. */
export const REGISTRATION_PAGE_SIZE = 15;

/** Longitudes máximas de los identificadores de los filtros. */
export const REGISTRATION_IDENTIFIER_MAX_LENGTH = Object.freeze({
  studentDni: 8,
  studentCuil: 11,
} as const);

/** Orden cronológico del listado. */
export type RegistrationSortOrder = "recent" | "oldest";

/** Filtros iniciales: textos vacíos y selects en «Todas/Todos». */
export function getDefaultFilters(): RegistrationFilters {
  return {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
    year: "all",
    studyYear: "all",
    division: "",
    cycle: "all",
    shift: "all",
    speciality: "all",
  };
}

/** Restablece los filtros a los valores por defecto. */
export function clearFilters(): RegistrationFilters {
  return getDefaultFilters();
}

/** Hay filtros activos si al menos un campo recortado no está vacío. */
export function hasActiveFilters(filters: RegistrationFilters): boolean {
  const textFields = [
    filters.studentDni,
    filters.studentCuil,
    filters.lastName,
    filters.firstName,
    filters.division,
  ];

  const enumFields = [
    filters.year,
    filters.studyYear,
    filters.cycle,
    filters.shift,
    filters.speciality,
  ];

  return (
    textFields.some((value) => value.trim().length > 0) ||
    enumFields.some((value) => value !== "all")
  );
}

/** Deja solo los dígitos de un identificador. */
export function normalizeRegistrationDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Acepta vacío o solo dígitos, respetando el largo máximo cuando se indica. */
export function isRegistrationIdentifierInput(
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

function toTimestamp(value: string): number {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

/**
 * Filtra el conjunto sin mutar la entrada: el estado de la pestaña, CUIL por
 * dígitos exactos, nombre y apellido parciales sin mayúsculas ni tildes y los
 * filtros de curso. El DNI no se filtra en el cliente porque el recurso de
 * inscripción no lo expone.
 */
export function filterRegistrations(
  registrations: readonly Registration[],
  tab: RegistrationStatusTab,
  filters: RegistrationFilters,
): Registration[] {
  const cuil = normalizeRegistrationDigits(filters.studentCuil);
  const firstName = normalizeSearch(filters.firstName);
  const lastName = normalizeSearch(filters.lastName);
  const division = normalizeSearch(filters.division);

  return registrations.filter((registration) => {
    if (tab !== "ALL" && registration.status !== tab) {
      return false;
    }

    if (
      cuil.length > 0 &&
      normalizeRegistrationDigits(registration.student.studentCuil) !== cuil
    ) {
      return false;
    }

    if (
      firstName.length > 0 &&
      !normalizeSearch(registration.student.firstName).includes(firstName)
    ) {
      return false;
    }

    if (
      lastName.length > 0 &&
      !normalizeSearch(registration.student.lastName).includes(lastName)
    ) {
      return false;
    }

    if (
      filters.year !== "all" &&
      String(registration.course.year) !== filters.year
    ) {
      return false;
    }

    if (
      filters.studyYear !== "all" &&
      String(registration.course.studyYear) !== filters.studyYear
    ) {
      return false;
    }

    if (
      division.length > 0 &&
      !normalizeSearch(registration.course.division).includes(division)
    ) {
      return false;
    }

    if (filters.cycle !== "all" && registration.course.cycle !== filters.cycle) {
      return false;
    }

    if (filters.shift !== "all" && registration.course.shift !== filters.shift) {
      return false;
    }

    if (
      filters.speciality !== "all" &&
      registration.course.speciality !== filters.speciality
    ) {
      return false;
    }

    return true;
  });
}

/** Ordena sin mutar la entrada; desempate por identificador. */
export function sortRegistrations(
  registrations: readonly Registration[],
  order: RegistrationSortOrder = "recent",
): Registration[] {
  return [...registrations].sort((left, right) => {
    const leftTime = toTimestamp(left.created_at);
    const rightTime = toTimestamp(right.created_at);
    const diff =
      order === "recent" ? rightTime - leftTime : leftTime - rightTime;

    if (diff !== 0) {
      return diff;
    }

    return left.id.localeCompare(right.id, "es");
  });
}

/** Pagina el conjunto y ajusta la página a `1..última`. */
export function paginateRegistrations(
  registrations: readonly Registration[],
  page: number,
  pageSize = REGISTRATION_PAGE_SIZE,
): RegistrationPage {
  const size =
    Number.isSafeInteger(pageSize) && pageSize > 0
      ? pageSize
      : REGISTRATION_PAGE_SIZE;
  const total = registrations.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const requestedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * size;
  const items = registrations.slice(startIndex, startIndex + size);

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
