import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ALL_FILTER_VALUE,
  INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS,
  NO_SPECIFIC_OPTIONS_MESSAGE,
} from "../../app/lib/reports/constants.ts";
import {
  buildEnrolledStudentsAppliedFilters,
  canApplyEnrolledStudentsFilters,
  clearEnrolledStudentsFilterInputs,
  getEnrolledStudentsFiltersState,
  getInitialEnrolledStudentsFilterInputs,
  serializeEnrolledStudentsAppliedFilters,
} from "../../app/lib/reports/filters.ts";
import type { EnrolledStudentsFilterInputs } from "../../app/lib/reports/types.ts";

const availableYears = [2024, 2025, 2026] as const;

test("estado inicial y limpieza restablecen todos los criterios a «Todos/Todas»", () => {
  const initial = getInitialEnrolledStudentsFilterInputs();
  const cleared = clearEnrolledStudentsFilterInputs();

  assert.deepEqual(initial, INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS);
  assert.deepEqual(cleared, INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS);
  assert.equal(initial.year, ALL_FILTER_VALUE);
  assert.equal(initial.studyYear, ALL_FILTER_VALUE);
  assert.equal(initial.shift, ALL_FILTER_VALUE);
  assert.equal(initial.speciality, ALL_FILTER_VALUE);
});

test("todos en «Todos/Todas» con opciones disponibles permite generar y omite restricciones", () => {
  const inputs = getInitialEnrolledStudentsFilterInputs();
  const state = getEnrolledStudentsFiltersState(inputs, {
    year: availableYears,
  });

  assert.equal(state.year.status, "valid");
  assert.equal(state.studyYear.status, "valid");
  assert.equal(state.shift.status, "valid");
  assert.equal(state.speciality.status, "valid");
  assert.equal(canApplyEnrolledStudentsFilters(state, false), true);

  const result = buildEnrolledStudentsAppliedFilters(inputs, {
    year: availableYears,
  });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("se esperaba resultado válido");

  assert.deepEqual(result.applied, {
    year: null,
    studyYear: null,
    shift: null,
    speciality: null,
  });
  assert.deepEqual(serializeEnrolledStudentsAppliedFilters(result.applied), {});
});

test("combinación de filtros válidos construye filtros aplicados y serializa solo criterios restrictivos", () => {
  const inputs: EnrolledStudentsFilterInputs = {
    year: "2025",
    studyYear: "3",
    shift: "morning",
    speciality: "informatics",
  };

  const state = getEnrolledStudentsFiltersState(inputs, {
    year: availableYears,
  });
  assert.equal(canApplyEnrolledStudentsFilters(state, false), true);

  const result = buildEnrolledStudentsAppliedFilters(inputs, {
    year: availableYears,
  });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("se esperaba resultado válido");

  assert.deepEqual(result.applied, {
    year: 2025,
    studyYear: 3,
    shift: "morning",
    speciality: "informatics",
  });
  assert.deepEqual(serializeEnrolledStudentsAppliedFilters(result.applied), {
    year: "2025",
    studyYear: "3",
    shift: "morning",
    speciality: "informatics",
  });
});

test("combinación parcial conserva «Todos/Todas» como ausencia de restricción", () => {
  const inputs: EnrolledStudentsFilterInputs = {
    year: "2026",
    studyYear: ALL_FILTER_VALUE,
    shift: "night",
    speciality: ALL_FILTER_VALUE,
  };

  const result = buildEnrolledStudentsAppliedFilters(inputs, {
    year: availableYears,
  });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("se esperaba resultado válido");

  assert.deepEqual(result.applied, {
    year: 2026,
    studyYear: null,
    shift: "night",
    speciality: null,
  });
  assert.deepEqual(serializeEnrolledStudentsAppliedFilters(result.applied), {
    year: "2026",
    shift: "night",
  });
});

test("ausencia de opciones específicas de año lectivo es informativa y no bloqueante con «Todos/Todas»", () => {
  const inputs = getInitialEnrolledStudentsFilterInputs();
  const state = getEnrolledStudentsFiltersState(inputs, { year: [] });

  assert.equal(state.year.status, "informative-no-options");
  if (state.year.status !== "informative-no-options") {
    assert.fail("se esperaba estado informativo sin opciones");
  }
  assert.equal(state.year.message, NO_SPECIFIC_OPTIONS_MESSAGE);
  assert.equal(canApplyEnrolledStudentsFilters(state, false), true);

  const result = buildEnrolledStudentsAppliedFilters(inputs, { year: [] });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("se esperaba resultado válido");
  assert.deepEqual(result.applied, {
    year: null,
    studyYear: null,
    shift: null,
    speciality: null,
  });
  assert.equal(result.errors.generalMessage, null);
});

test("criterio de año lectivo inválido bloquea la generación", () => {
  const invalidInputs: EnrolledStudentsFilterInputs = {
    year: "20ab",
    studyYear: ALL_FILTER_VALUE,
    shift: ALL_FILTER_VALUE,
    speciality: ALL_FILTER_VALUE,
  };
  const state = getEnrolledStudentsFiltersState(invalidInputs, {
    year: availableYears,
  });

  assert.equal(state.year.status, "invalid");
  assert.equal(canApplyEnrolledStudentsFilters(state, false), false);

  const result = buildEnrolledStudentsAppliedFilters(invalidInputs, {
    year: availableYears,
  });
  assert.equal(result.ok, false);
  if (result.ok) assert.fail("se esperaba resultado inválido");
  assert.ok(result.errors.fieldErrors.year);
  assert.ok(result.errors.generalMessage);

  const notAvailable: EnrolledStudentsFilterInputs = {
    ...invalidInputs,
    year: "2030",
  };
  const notAvailableState = getEnrolledStudentsFiltersState(notAvailable, {
    year: availableYears,
  });
  assert.equal(notAvailableState.year.status, "invalid");
  assert.equal(canApplyEnrolledStudentsFilters(notAvailableState, false), false);
});

test("criterios fijos inválidos bloquean la generación", () => {
  const invalidStudyYear = {
    ...getInitialEnrolledStudentsFilterInputs(),
    studyYear: "7",
  } as unknown as EnrolledStudentsFilterInputs;
  const invalidShift = {
    ...getInitialEnrolledStudentsFilterInputs(),
    shift: "evening",
  } as unknown as EnrolledStudentsFilterInputs;
  const invalidSpeciality = {
    ...getInitialEnrolledStudentsFilterInputs(),
    speciality: "arts",
  } as unknown as EnrolledStudentsFilterInputs;

  for (const inputs of [invalidStudyYear, invalidShift, invalidSpeciality]) {
    const state = getEnrolledStudentsFiltersState(inputs, {
      year: availableYears,
    });
    assert.equal(canApplyEnrolledStudentsFilters(state, false), false);
    const result = buildEnrolledStudentsAppliedFilters(inputs, {
      year: availableYears,
    });
    assert.equal(result.ok, false);
  }
});

test("criterio no determinable bloquea la generación", () => {
  const inputs = getInitialEnrolledStudentsFilterInputs();
  const state = getEnrolledStudentsFiltersState(inputs, { year: null });

  assert.equal(state.year.status, "indeterminate");
  assert.equal(canApplyEnrolledStudentsFilters(state, false), false);

  const result = buildEnrolledStudentsAppliedFilters(inputs, { year: null });
  assert.equal(result.ok, false);
  if (result.ok) assert.fail("se esperaba resultado no determinable");
  assert.ok(result.errors.fieldErrors.year);
  assert.ok(result.errors.generalMessage);
});

test("la generación en curso deshabilita la aplicación aunque los criterios sean válidos", () => {
  const inputs = getInitialEnrolledStudentsFilterInputs();
  const state = getEnrolledStudentsFiltersState(inputs, {
    year: availableYears,
  });

  assert.equal(canApplyEnrolledStudentsFilters(state, true), false);
});
