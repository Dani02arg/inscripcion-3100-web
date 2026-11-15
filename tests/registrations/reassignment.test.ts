import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getAvailableCoursesForYear,
  isSelectorEmpty,
} from "../../app/lib/registrations/reassignment.ts";
import type { AvailableCourse } from "../../app/lib/registrations/types.ts";

function makeCourse(
  overrides: Partial<AvailableCourse> & { readonly id: string },
): AvailableCourse {
  return {
    code: "2026-1-1-BAS-INF-M",
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    shift: "morning",
    speciality: "informatics",
    availablePlaces: 15,
    ...overrides,
  };
}

test("getAvailableCoursesForYear filtra por año y cupo disponible", () => {
  const courses = [
    makeCourse({ id: "a", year: 2026, availablePlaces: 5 }),
    makeCourse({ id: "b", year: 2025, availablePlaces: 5 }),
    makeCourse({ id: "c", year: 2026, availablePlaces: 0 }),
  ];

  assert.deepEqual(
    getAvailableCoursesForYear(courses, 2026).map((course) => course.id),
    ["a"],
  );
});

test("isSelectorEmpty indica si no hay opciones", () => {
  assert.equal(isSelectorEmpty([]), true);
  assert.equal(isSelectorEmpty([makeCourse({ id: "a" })]), false);
});
