import {
  COURSE_CYCLES,
  COURSE_SHIFTS,
  COURSE_SPECIALITIES,
  COURSE_STATUSES,
} from "./types.ts";
import type {
  Course,
  CourseCycle,
  CourseShift,
  CourseSpeciality,
  CourseStatus,
} from "./types.ts";

export const COURSE_UNKNOWN_LABEL = "No disponible";
export const COURSE_FILTER_ALL_LABEL = "Todas";
export const COURSE_ALL_YEARS_LABEL = "Todos los años";

export const COURSE_CYCLE_LABELS: Record<CourseCycle, string> = {
  basic: "Básico",
  superior: "Superior",
};

export const COURSE_SPECIALITY_LABELS: Record<CourseSpeciality, string> = {
  basic: "Básica",
  informatics: "Informática",
  electronics: "Electrónica",
};

export const COURSE_SHIFT_LABELS: Record<CourseShift, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  night: "Noche",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

export const COURSE_CYCLE_ORDER: readonly CourseCycle[] = [
  "basic",
  "superior",
];

export const COURSE_SPECIALITY_ORDER: readonly CourseSpeciality[] = [
  "basic",
  "informatics",
  "electronics",
];

export const COURSE_SHIFT_ORDER: readonly CourseShift[] = [
  "morning",
  "afternoon",
  "night",
];

export interface CourseOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface CourseFilterOption<T extends string> {
  readonly value: T | "all";
  readonly label: string;
}

export const COURSE_CYCLE_OPTIONS: readonly CourseOption<CourseCycle>[] =
  COURSE_CYCLES.map((value) => ({
    value,
    label: COURSE_CYCLE_LABELS[value],
  }));

export const COURSE_SPECIALITY_OPTIONS: readonly CourseOption<CourseSpeciality>[] =
  COURSE_SPECIALITIES.map((value) => ({
    value,
    label: COURSE_SPECIALITY_LABELS[value],
  }));

export const COURSE_SHIFT_OPTIONS: readonly CourseOption<CourseShift>[] =
  COURSE_SHIFTS.map((value) => ({
    value,
    label: COURSE_SHIFT_LABELS[value],
  }));

export const COURSE_STATUS_OPTIONS: readonly CourseOption<CourseStatus>[] =
  COURSE_STATUSES.map((value) => ({
    value,
    label: COURSE_STATUS_LABELS[value],
  }));

export const COURSE_CYCLE_FILTER_OPTIONS: readonly CourseFilterOption<CourseCycle>[] =
  [
    { value: "all", label: COURSE_FILTER_ALL_LABEL },
    ...COURSE_CYCLE_OPTIONS,
  ];

export const COURSE_SPECIALITY_FILTER_OPTIONS: readonly CourseFilterOption<CourseSpeciality>[] =
  [
    { value: "all", label: COURSE_FILTER_ALL_LABEL },
    ...COURSE_SPECIALITY_OPTIONS,
  ];

export const COURSE_SHIFT_FILTER_OPTIONS: readonly CourseFilterOption<CourseShift>[] =
  [
    { value: "all", label: COURSE_FILTER_ALL_LABEL },
    ...COURSE_SHIFT_OPTIONS,
  ];

export function isCourseCycle(value: string): value is CourseCycle {
  return COURSE_CYCLES.some((cycle) => cycle === value);
}

export function isCourseSpeciality(value: string): value is CourseSpeciality {
  return COURSE_SPECIALITIES.some((speciality) => speciality === value);
}

export function isCourseShift(value: string): value is CourseShift {
  return COURSE_SHIFTS.some((shift) => shift === value);
}

export function isCourseStatus(value: string): value is CourseStatus {
  return COURSE_STATUSES.some((status) => status === value);
}

export function getCycleLabel(value: string): string {
  return isCourseCycle(value) ? COURSE_CYCLE_LABELS[value] : COURSE_UNKNOWN_LABEL;
}

export function getSpecialityLabel(value: string): string {
  return isCourseSpeciality(value)
    ? COURSE_SPECIALITY_LABELS[value]
    : COURSE_UNKNOWN_LABEL;
}

export function getShiftLabel(value: string): string {
  return isCourseShift(value) ? COURSE_SHIFT_LABELS[value] : COURSE_UNKNOWN_LABEL;
}

export function getStatusLabel(value: string): string {
  return isCourseStatus(value) ? COURSE_STATUS_LABELS[value] : COURSE_UNKNOWN_LABEL;
}

export function buildCourseRowLabel(course: Course): string {
  return [
    "Curso",
    `año académico ${course.year}`,
    `año de cursada ${course.studyYear}`,
    `división ${course.division}`,
    `ciclo ${getCycleLabel(course.cycle)}`,
    `especialidad ${getSpecialityLabel(course.speciality)}`,
    `turno ${getShiftLabel(course.shift)}`,
    `estado ${getStatusLabel(course.status)}`,
  ].join(", ");
}

export function getCycleOrder(value: string): number {
  if (!isCourseCycle(value)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return COURSE_CYCLE_ORDER.indexOf(value);
}

export function getSpecialityOrder(value: string): number {
  if (!isCourseSpeciality(value)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return COURSE_SPECIALITY_ORDER.indexOf(value);
}

export function getShiftOrder(value: string): number {
  if (!isCourseShift(value)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return COURSE_SHIFT_ORDER.indexOf(value);
}
