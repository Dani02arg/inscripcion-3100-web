import type { AvailableCourse } from "./types.ts";

/** Devuelve los cursos disponibles del año indicado, conservando el orden. */
export function getAvailableCoursesForYear(
  courses: readonly AvailableCourse[],
  year: number,
): AvailableCourse[] {
  return courses.filter(
    (course) =>
      course.year === year &&
      Number.isSafeInteger(course.availablePlaces) &&
      course.availablePlaces > 0,
  );
}

/** Indica si el selector de reasignación no tiene opciones. */
export function isSelectorEmpty(courses: readonly AvailableCourse[]): boolean {
  return courses.length === 0;
}
