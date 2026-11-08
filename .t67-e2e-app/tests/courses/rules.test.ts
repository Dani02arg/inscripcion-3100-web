import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canDeactivateCourse,
  canDeleteCourse,
  getDeactivateDisabledReason,
  getDeleteDisabledReason,
  getEditDisabledReason,
  isCourseEditable,
  isPastYear,
} from "../../app/lib/courses/rules.ts";
import type { Course } from "../../app/lib/courses/types.ts";

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    code: "2026-1-1-BAS-INF-M",
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: 30,
    currentCapacity: 0,
    availablePlaces: 30,
    status: "active",
    ...overrides,
  };
}

test("reconoce años pasados, actuales y futuros", () => {
  assert.equal(isPastYear(2025, 2026), true);
  assert.equal(isPastYear(2026, 2026), false);
  assert.equal(isPastYear(2027, 2026), false);
});

test("solo permite editar cursos actuales o futuros", () => {
  assert.equal(isCourseEditable(makeCourse({ year: 2025 }), 2026), false);
  assert.equal(isCourseEditable(makeCourse({ year: 2026 }), 2026), true);
  assert.equal(isCourseEditable(makeCourse({ year: 2027 }), 2026), true);
});

test("solo permite eliminar y desactivar cursos sin inscriptos", () => {
  const empty = makeCourse({ currentCapacity: 0 });
  const occupied = makeCourse({ currentCapacity: 1 });

  assert.equal(canDeleteCourse(empty), true);
  assert.equal(canDeleteCourse(occupied), false);
  assert.equal(canDeactivateCourse(empty), true);
  assert.equal(canDeactivateCourse(occupied), false);
});

test("devuelve los motivos de acciones deshabilitadas", () => {
  const past = makeCourse({ year: 2025 });
  const occupied = makeCourse({ currentCapacity: 3 });

  assert.equal(getEditDisabledReason(past, 2026), "Solo se pueden editar cursos del año actual o futuros.");
  assert.equal(getEditDisabledReason(makeCourse({ year: 2026 }), 2026), null);
  assert.equal(
    getDeleteDisabledReason(occupied),
    "No disponible: el curso tiene inscriptos.",
  );
  assert.equal(getDeleteDisabledReason(makeCourse()), null);
  assert.equal(
    getDeactivateDisabledReason(occupied),
    "No disponible: el curso tiene inscriptos.",
  );
  assert.equal(getDeactivateDisabledReason(makeCourse()), null);
});
