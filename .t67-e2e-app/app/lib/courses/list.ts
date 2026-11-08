import {
  getCycleLabel,
  getCycleOrder,
  getShiftLabel,
  getShiftOrder,
  getSpecialityLabel,
  getSpecialityOrder,
  getStatusLabel,
} from "./labels.ts";
import type {
  Course,
  CourseFilters,
  CoursePage,
  CourseSummary,
} from "./types.ts";

export const COURSE_PAGE_SIZE = 10;

/** Normaliza texto para búsqueda: sin mayúsculas, acentos ni espacios sobrantes. */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Construye el texto normalizado por el que se busca un curso. */
export function buildCourseSearchText(course: Course): string {
  const parts = [
    course.code ?? "",
    String(course.year),
    String(course.studyYear),
    course.division,
    getCycleLabel(course.cycle),
    getSpecialityLabel(course.speciality),
    getShiftLabel(course.shift),
    getStatusLabel(course.status),
  ];

  return normalizeSearch(
    parts.filter((part) => part.trim().length > 0).join(" "),
  );
}

/** Años presentes en el conjunto completo, de mayor a menor. */
export function getCourseYears(courses: readonly Course[]): number[] {
  return [...new Set(courses.map((course) => course.year))].sort(
    (left, right) => right - left,
  );
}

/** Filtra por año, ciclo, especialidad, turno y búsqueda combinados. */
export function filterCourses(
  courses: readonly Course[],
  filters: CourseFilters,
): Course[] {
  const query = normalizeSearch(filters.query);

  return courses.filter((course) => {
    if (filters.year !== "all" && course.year !== filters.year) {
      return false;
    }

    if (filters.cycle !== "all" && course.cycle !== filters.cycle) {
      return false;
    }

    if (
      filters.speciality !== "all" &&
      course.speciality !== filters.speciality
    ) {
      return false;
    }

    if (filters.shift !== "all" && course.shift !== filters.shift) {
      return false;
    }

    if (query.length > 0 && !buildCourseSearchText(course).includes(query)) {
      return false;
    }

    return true;
  });
}

/** Filtros iniciales: año actual si existe; si no, «Todos los años». */
export function getDefaultFilters(
  currentYear: number,
  years: readonly number[],
): CourseFilters {
  return {
    query: "",
    year: years.includes(currentYear) ? currentYear : "all",
    cycle: "all",
    speciality: "all",
    shift: "all",
  };
}

/** Restablece los filtros a los valores por defecto. */
export function clearFilters(
  currentYear: number,
  years: readonly number[],
): CourseFilters {
  return getDefaultFilters(currentYear, years);
}

function parseDivisionNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function compareDivision(left: string, right: string): number {
  const leftNumber = parseDivisionNumber(left);
  const rightNumber = parseDivisionNumber(right);

  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right, "es", { sensitivity: "base" });
}

function compareCourses(left: Course, right: Course): number {
  if (left.year !== right.year) {
    return right.year - left.year;
  }

  if (left.studyYear !== right.studyYear) {
    return left.studyYear - right.studyYear;
  }

  const division = compareDivision(left.division, right.division);
  if (division !== 0) {
    return division;
  }

  const shift = getShiftOrder(left.shift) - getShiftOrder(right.shift);
  if (shift !== 0) {
    return shift;
  }

  const cycle = getCycleOrder(left.cycle) - getCycleOrder(right.cycle);
  if (cycle !== 0) {
    return cycle;
  }

  const speciality =
    getSpecialityOrder(left.speciality) - getSpecialityOrder(right.speciality);
  if (speciality !== 0) {
    return speciality;
  }

  return left.id.localeCompare(right.id, "es");
}

/** Ordena sin mutar la entrada según las reglas del listado. */
export function sortCourses(courses: readonly Course[]): Course[] {
  return [...courses].sort(compareCourses);
}

/** Pagina el conjunto ya ordenado y ajusta la página a `1..última`. */
export function paginateCourses(
  courses: readonly Course[],
  page: number,
  pageSize = COURSE_PAGE_SIZE,
): CoursePage {
  const size =
    Number.isSafeInteger(pageSize) && pageSize > 0
      ? pageSize
      : COURSE_PAGE_SIZE;
  const total = courses.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const requestedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * size;
  const items = courses.slice(startIndex, startIndex + size);

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

/** Resume cantidad total, activos y suma de capacidad máxima. */
export function summarizeCourses(courses: readonly Course[]): CourseSummary {
  let maxCapacityTotal = 0;
  let validCapacity = true;
  let active = 0;

  for (const course of courses) {
    if (course.status === "active") {
      active += 1;
    }

    if (
      !Number.isSafeInteger(course.maxCapacity) ||
      course.maxCapacity <= 0
    ) {
      validCapacity = false;
      continue;
    }

    maxCapacityTotal += course.maxCapacity;

    if (!Number.isSafeInteger(maxCapacityTotal)) {
      validCapacity = false;
    }
  }

  return {
    total: courses.length,
    active,
    maxCapacityTotal: validCapacity ? maxCapacityTotal : null,
  };
}
