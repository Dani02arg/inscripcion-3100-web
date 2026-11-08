import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_ALL_YEARS_LABEL,
  COURSE_CYCLE_FILTER_OPTIONS,
  COURSE_CYCLE_LABELS,
  COURSE_CYCLE_OPTIONS,
  COURSE_FILTER_ALL_LABEL,
  COURSE_SHIFT_FILTER_OPTIONS,
  COURSE_SHIFT_LABELS,
  COURSE_SHIFT_OPTIONS,
  COURSE_SHIFT_ORDER,
  COURSE_SPECIALITY_FILTER_OPTIONS,
  COURSE_SPECIALITY_LABELS,
  COURSE_SPECIALITY_OPTIONS,
  COURSE_STATUS_LABELS,
  COURSE_STATUS_OPTIONS,
  COURSE_UNKNOWN_LABEL,
  buildCourseRowLabel,
  getCycleLabel,
  getCycleOrder,
  getShiftLabel,
  getShiftOrder,
  getSpecialityLabel,
  getSpecialityOrder,
  getStatusLabel,
  isCourseCycle,
  isCourseShift,
  isCourseSpeciality,
  isCourseStatus,
} from "../../app/lib/courses/labels.ts";
import type { Course } from "../../app/lib/courses/types.ts";

test("construye la descripción accesible de la fila sin código", () => {
  const course: Course = {
    id: "course-1",
    code: "2026-1-1-BAS-INF-M",
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: 30,
    currentCapacity: 12,
    availablePlaces: 18,
    status: "active",
  };

  const label = buildCourseRowLabel(course);

  assert.equal(
    label,
    "Curso, año académico 2026, año de cursada 1, división 1, ciclo Básico, especialidad Informática, turno Mañana, estado Activo",
  );
  assert.equal(label.includes("2026-1-1-BAS-INF-M"), false);
});

test("traduce ciclo, especialidad, turno y estado al español", () => {
  assert.equal(getCycleLabel("basic"), "Básico");
  assert.equal(getCycleLabel("superior"), "Superior");
  assert.equal(getSpecialityLabel("basic"), "Básica");
  assert.equal(getSpecialityLabel("informatics"), "Informática");
  assert.equal(getSpecialityLabel("electronics"), "Electrónica");
  assert.equal(getShiftLabel("morning"), "Mañana");
  assert.equal(getShiftLabel("afternoon"), "Tarde");
  assert.equal(getShiftLabel("night"), "Noche");
  assert.equal(getStatusLabel("active"), "Activo");
  assert.equal(getStatusLabel("inactive"), "Inactivo");
});

test("usa No disponible como fallback para valores desconocidos", () => {
  for (const value of ["", "unknown", "Basic", "mañana"]) {
    assert.equal(getCycleLabel(value), COURSE_UNKNOWN_LABEL);
    assert.equal(getSpecialityLabel(value), COURSE_UNKNOWN_LABEL);
    assert.equal(getShiftLabel(value), COURSE_UNKNOWN_LABEL);
    assert.equal(getStatusLabel(value), COURSE_UNKNOWN_LABEL);
  }
});

test("expone las etiquetas y opciones del contrato", () => {
  assert.deepEqual(COURSE_CYCLE_OPTIONS, [
    { value: "basic", label: "Básico" },
    { value: "superior", label: "Superior" },
  ]);
  assert.deepEqual(COURSE_SPECIALITY_OPTIONS, [
    { value: "basic", label: "Básica" },
    { value: "informatics", label: "Informática" },
    { value: "electronics", label: "Electrónica" },
  ]);
  assert.deepEqual(COURSE_SHIFT_OPTIONS, [
    { value: "morning", label: "Mañana" },
    { value: "afternoon", label: "Tarde" },
    { value: "night", label: "Noche" },
  ]);
  assert.deepEqual(COURSE_STATUS_OPTIONS, [
    { value: "active", label: "Activo" },
    { value: "inactive", label: "Inactivo" },
  ]);
  assert.deepEqual(COURSE_CYCLE_LABELS, {
    basic: "Básico",
    superior: "Superior",
  });
  assert.deepEqual(COURSE_SPECIALITY_LABELS, {
    basic: "Básica",
    informatics: "Informática",
    electronics: "Electrónica",
  });
  assert.deepEqual(COURSE_SHIFT_LABELS, {
    morning: "Mañana",
    afternoon: "Tarde",
    night: "Noche",
  });
  assert.deepEqual(COURSE_STATUS_LABELS, {
    active: "Activo",
    inactive: "Inactivo",
  });
});

test("las opciones de filtro incluyen Todas como primera opción", () => {
  assert.deepEqual(COURSE_CYCLE_FILTER_OPTIONS[0], {
    value: "all",
    label: COURSE_FILTER_ALL_LABEL,
  });
  assert.deepEqual(COURSE_SPECIALITY_FILTER_OPTIONS[0], {
    value: "all",
    label: COURSE_FILTER_ALL_LABEL,
  });
  assert.deepEqual(COURSE_SHIFT_FILTER_OPTIONS[0], {
    value: "all",
    label: COURSE_FILTER_ALL_LABEL,
  });
  assert.equal(COURSE_ALL_YEARS_LABEL, "Todos los años");
});

test("ordena los turnos como Mañana, Tarde y Noche", () => {
  assert.deepEqual(
    COURSE_SHIFT_ORDER.map((shift) => COURSE_SHIFT_LABELS[shift]),
    ["Mañana", "Tarde", "Noche"],
  );
  assert.ok(getShiftOrder("morning") < getShiftOrder("afternoon"));
  assert.ok(getShiftOrder("afternoon") < getShiftOrder("night"));
  assert.equal(getShiftOrder("unknown"), Number.MAX_SAFE_INTEGER);
});

test("ordena ciclo y especialidad según el contrato", () => {
  assert.ok(getCycleOrder("basic") < getCycleOrder("superior"));
  assert.ok(getSpecialityOrder("basic") < getSpecialityOrder("informatics"));
  assert.ok(getSpecialityOrder("informatics") < getSpecialityOrder("electronics"));
  assert.equal(getCycleOrder("unknown"), Number.MAX_SAFE_INTEGER);
  assert.equal(getSpecialityOrder("unknown"), Number.MAX_SAFE_INTEGER);
});

test("reconoce solo los valores conocidos", () => {
  assert.equal(isCourseCycle("basic"), true);
  assert.equal(isCourseCycle("unknown"), false);
  assert.equal(isCourseSpeciality("informatics"), true);
  assert.equal(isCourseSpeciality("unknown"), false);
  assert.equal(isCourseShift("night"), true);
  assert.equal(isCourseShift("unknown"), false);
  assert.equal(isCourseStatus("active"), true);
  assert.equal(isCourseStatus("unknown"), false);
});
