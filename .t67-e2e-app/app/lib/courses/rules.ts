import {
  COURSE_DELETE_DISABLED_REASON,
  COURSE_EDIT_PAST_YEAR_REASON,
} from "./types.ts";
import type { Course } from "./types.ts";

/** Indica si un año es anterior al año actual. */
export function isPastYear(year: number, currentYear: number): boolean {
  return year < currentYear;
}

/** Solo los cursos del año actual o futuro se pueden editar. */
export function isCourseEditable(
  course: Course,
  currentYear: number,
): boolean {
  return !isPastYear(course.year, currentYear);
}

/** Solo los cursos sin inscriptos se pueden eliminar. */
export function canDeleteCourse(course: Course): boolean {
  return course.currentCapacity === 0;
}

/** Solo los cursos sin inscriptos se pueden desactivar. */
export function canDeactivateCourse(course: Course): boolean {
  return course.currentCapacity === 0;
}

export function getEditDisabledReason(
  course: Course,
  currentYear: number,
): string | null {
  return isCourseEditable(course, currentYear)
    ? null
    : COURSE_EDIT_PAST_YEAR_REASON;
}

export function getDeleteDisabledReason(course: Course): string | null {
  return canDeleteCourse(course)
    ? null
    : COURSE_DELETE_DISABLED_REASON;
}

export function getDeactivateDisabledReason(course: Course): string | null {
  return canDeactivateCourse(course)
    ? null
    : COURSE_DELETE_DISABLED_REASON;
}
