import {
  isCourseCycle,
  isCourseShift,
  isCourseSpeciality,
} from "./labels.ts";
import { getDefaultFilters } from "./list.ts";
import type { CourseFilters } from "./types.ts";

export const COURSES_PATH = "/dashboard/courses";

export const COURSE_FILTER_PARAM_KEYS = [
  "q",
  "year",
  "cycle",
  "speciality",
  "shift",
  "page",
] as const;

export interface CourseUrlState {
  readonly filters: CourseFilters;
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

/** Lee filtros y página de la URL, ignorando valores inválidos. */
export function parseCourseFilters(
  input: URLSearchParams | string,
  currentYear: number,
  years: readonly number[],
): CourseUrlState {
  const params = toSearchParams(input);
  const defaults = getDefaultFilters(currentYear, years);

  const rawYear = params.get("year");
  let year = defaults.year;

  if (rawYear === "all") {
    year = "all";
  } else if (rawYear !== null) {
    const parsedYear = Number(rawYear);

    if (Number.isSafeInteger(parsedYear) && years.includes(parsedYear)) {
      year = parsedYear;
    }
  }

  const rawCycle = params.get("cycle");
  const rawSpeciality = params.get("speciality");
  const rawShift = params.get("shift");

  return {
    filters: {
      query: (params.get("q") ?? "").trim(),
      year,
      cycle: rawCycle !== null && isCourseCycle(rawCycle) ? rawCycle : "all",
      speciality:
        rawSpeciality !== null && isCourseSpeciality(rawSpeciality)
          ? rawSpeciality
          : "all",
      shift: rawShift !== null && isCourseShift(rawShift) ? rawShift : "all",
    },
    page: parsePage(params.get("page")),
  };
}

/** Escribe filtros y página en una query string, conservando otros parámetros. */
export function serializeCourseFilters(
  filters: CourseFilters,
  page: number,
  existing?: URLSearchParams,
): string {
  const params = new URLSearchParams(existing);

  for (const key of COURSE_FILTER_PARAM_KEYS) {
    params.delete(key);
  }

  const query = filters.query.trim();
  if (query.length > 0) {
    params.set("q", query);
  }

  params.set("year", filters.year === "all" ? "all" : String(filters.year));

  if (filters.cycle !== "all") {
    params.set("cycle", filters.cycle);
  }

  if (filters.speciality !== "all") {
    params.set("speciality", filters.speciality);
  }

  if (filters.shift !== "all") {
    params.set("shift", filters.shift);
  }

  if (Number.isSafeInteger(page) && page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

/** Solo acepta rutas internas del listado, sin `//`, backslashes ni externos. */
export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value) {
    return COURSES_PATH;
  }

  const lower = value.toLowerCase();

  if (
    !value.startsWith(COURSES_PATH) ||
    lower.includes("//") ||
    lower.includes("%2f%2f") ||
    value.includes("\\")
  ) {
    return COURSES_PATH;
  }

  const pathname = value.split("?", 1)[0] ?? "";

  if (pathname !== COURSES_PATH && pathname !== `${COURSES_PATH}/`) {
    return COURSES_PATH;
  }

  return value;
}
