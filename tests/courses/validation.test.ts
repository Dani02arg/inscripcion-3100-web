import assert from "node:assert/strict";
import { test } from "node:test";

import { COURSE_EDIT_PAST_YEAR_REASON } from "../../app/lib/courses/types.ts";
import type { CourseFormInput } from "../../app/lib/courses/types.ts";
import {
  COURSE_GENERAL_ERROR_MESSAGE,
  COURSE_VALIDATION_MESSAGES,
  buildCoursePayload,
  mapCourseFieldErrors,
  readCourseFormData,
  translateCourseFieldErrors,
  validateCourseInput,
} from "../../app/lib/validation/course.ts";

function makeInput(overrides: Partial<CourseFormInput> = {}): CourseFormInput {
  return {
    year: "2026",
    studyYear: "1",
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: "30",
    ...overrides,
  };
}

test("valida un curso actual y devuelve el payload exacto", () => {
  const result = validateCourseInput(makeInput(), 0, 2026);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.payload, {
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: 30,
  });
  assert.deepEqual(Object.keys(result.payload ?? {}), [
    "year",
    "studyYear",
    "division",
    "cycle",
    "speciality",
    "shift",
    "maxCapacity",
  ]);
});

test("acepta año actual y futuro, y rechaza el pasado", () => {
  assert.equal(validateCourseInput(makeInput({ year: "2026" }), 0, 2026).valid, true);
  assert.equal(validateCourseInput(makeInput({ year: "2027" }), 0, 2026).valid, true);

  for (const year of ["2025", "1999"]) {
    const result = validateCourseInput(makeInput({ year }), 0, 2026);
    assert.equal(result.valid, false);
    assert.equal(result.errors.year, COURSE_VALIDATION_MESSAGES.yearPast);
  }
});

test("rechaza años con formato inválido", () => {
  for (const year of ["", "26", "202", "20260", "abcd"]) {
    const result = validateCourseInput(makeInput({ year }), 0, 2026);
    assert.equal(result.valid, false);
    assert.equal(result.errors.year, COURSE_VALIDATION_MESSAGES.year);
  }
});

test("bloquea la edición de un curso de año pasado", () => {
  const result = validateCourseInput(
    makeInput({ year: "2026" }),
    0,
    2026,
    { originalYear: 2025 },
  );

  assert.equal(result.valid, false);
  assert.equal(result.errors.year, COURSE_EDIT_PAST_YEAR_REASON);
});

test("valida el año de cursada entre 1 y 6", () => {
  for (const studyYear of ["1", "6"]) {
    assert.equal(
      validateCourseInput(makeInput({ studyYear }), 0, 2026).valid,
      true,
    );
  }

  for (const studyYear of ["0", "7", "-1", "1.5", ""]) {
    const result = validateCourseInput(makeInput({ studyYear }), 0, 2026);
    assert.equal(result.valid, false);
    assert.equal(result.errors.studyYear, COURSE_VALIDATION_MESSAGES.studyYear);
  }
});

test("recorta la división y exige entre 1 y 10 caracteres", () => {
  const result = validateCourseInput(
    makeInput({ division: "  1  " }),
    0,
    2026,
  );
  assert.equal(result.valid, true);
  assert.equal(result.payload?.division, "1");

  assert.equal(
    validateCourseInput(makeInput({ division: "1234567890" }), 0, 2026).valid,
    true,
  );

  for (const division of ["", "   ", "12345678901"]) {
    const invalid = validateCourseInput(makeInput({ division }), 0, 2026);
    assert.equal(invalid.valid, false);
    assert.equal(invalid.errors.division, COURSE_VALIDATION_MESSAGES.division);
  }
});

test("valida ciclo, especialidad y turno del contrato", () => {
  for (const input of [
    makeInput({ cycle: "unknown" }),
    makeInput({ speciality: "unknown" }),
    makeInput({ shift: "unknown" }),
  ]) {
    const result = validateCourseInput(input, 0, 2026);
    assert.equal(result.valid, false);
  }

  assert.equal(
    validateCourseInput(
      makeInput({
        cycle: "superior",
        speciality: "electronics",
        shift: "night",
      }),
      0,
      2026,
    ).valid,
    true,
  );
});

test("exige capacidad máxima entera y mayor que cero", () => {
  assert.equal(validateCourseInput(makeInput({ maxCapacity: "1" }), 0, 2026).valid, true);

  for (const maxCapacity of ["", "0", "-1", "1.5", "abc"]) {
    const result = validateCourseInput(makeInput({ maxCapacity }), 0, 2026);
    assert.equal(result.valid, false);
    assert.equal(
      result.errors.maxCapacity,
      COURSE_VALIDATION_MESSAGES.maxCapacity,
    );
  }
});

test("rechaza capacidad máxima menor que la capacidad actual", () => {
  const result = validateCourseInput(makeInput({ maxCapacity: "9" }), 10, 2026);

  assert.equal(result.valid, false);
  assert.equal(
    result.errors.maxCapacity,
    COURSE_VALIDATION_MESSAGES.maxCapacityBelowCurrent,
  );

  assert.equal(
    validateCourseInput(makeInput({ maxCapacity: "10" }), 10, 2026).valid,
    true,
  );
});

test("buildCoursePayload devuelve null con datos estructuralmente inválidos", () => {
  assert.equal(buildCoursePayload(makeInput({ year: "26" })), null);
  assert.equal(buildCoursePayload(makeInput({ studyYear: "7" })), null);
  assert.equal(buildCoursePayload(makeInput({ division: "   " })), null);
  assert.equal(buildCoursePayload(makeInput({ cycle: "unknown" })), null);
  assert.equal(buildCoursePayload(makeInput({ maxCapacity: "0" })), null);
});

test("lee los siete campos del formulario y normaliza ausentes", () => {
  const formData = new FormData();
  formData.set("year", "2026");
  formData.set("studyYear", "2");
  formData.set("division", "A");
  formData.set("cycle", "superior");
  formData.set("speciality", "electronics");
  formData.set("shift", "night");
  formData.set("maxCapacity", "25");

  assert.deepEqual(readCourseFormData(formData), {
    year: "2026",
    studyYear: "2",
    division: "A",
    cycle: "superior",
    speciality: "electronics",
    shift: "night",
    maxCapacity: "25",
  });

  const empty = new FormData();
  assert.deepEqual(readCourseFormData(empty), {
    year: "",
    studyYear: "",
    division: "",
    cycle: "",
    speciality: "",
    shift: "",
    maxCapacity: "",
  });
});

test("mapea solo los campos conocidos y toma el primer mensaje", () => {
  const errors = mapCourseFieldErrors({
    year: ["The year field is required.", "Otro mensaje"],
    division: "The division field is required.",
    unknown: ["No corresponde"],
    maxCapacity: [],
    cycle: 5,
  });

  assert.deepEqual(errors, {
    year: "The year field is required.",
    division: "The division field is required.",
  });
});

test("mapea errores anidados y descarta estructuras no válidas", () => {
  assert.deepEqual(
    mapCourseFieldErrors({
      errors: {
        studyYear: ["The study year must be between 1 and 6."],
        extra: ["descartar"],
      },
    }),
    { studyYear: "The study year must be between 1 and 6." },
  );
  assert.deepEqual(mapCourseFieldErrors(null), {});
  assert.deepEqual(mapCourseFieldErrors("texto"), {});
  assert.deepEqual(mapCourseFieldErrors([]), {});
});

test("traduce mensajes conocidos de Laravel por campo", () => {
  const result = translateCourseFieldErrors({
    year: "The year field is required.",
    studyYear: "The study year must be between 1 and 6.",
    division: "The division may not be greater than 10 characters.",
    cycle: "The selected cycle is invalid.",
    speciality: "The selected speciality is invalid.",
    shift: "The shift field is required.",
    maxCapacity: "The max capacity must be an integer.",
  });

  assert.deepEqual(result.errors, {
    year: COURSE_VALIDATION_MESSAGES.year,
    studyYear: COURSE_VALIDATION_MESSAGES.studyYear,
    division: COURSE_VALIDATION_MESSAGES.division,
    cycle: COURSE_VALIDATION_MESSAGES.cycle,
    speciality: COURSE_VALIDATION_MESSAGES.speciality,
    shift: COURSE_VALIDATION_MESSAGES.shift,
    maxCapacity: COURSE_VALIDATION_MESSAGES.maxCapacity,
  });
  assert.equal(result.generalMessage, null);
});

test("traduce la capacidad menor a la actual y deriva desconocidos al aviso general", () => {
  const current = translateCourseFieldErrors({
    maxCapacity:
      "The max capacity must be greater than or equal to the current capacity.",
  });
  assert.equal(
    current.errors.maxCapacity,
    COURSE_VALIDATION_MESSAGES.maxCapacityBelowCurrent,
  );
  assert.equal(current.generalMessage, null);

  const unknown = translateCourseFieldErrors({
    year: "Backend exploded",
    division: "The division field is required.",
  });
  assert.equal(unknown.errors.year, undefined);
  assert.equal(unknown.errors.division, COURSE_VALIDATION_MESSAGES.division);
  assert.equal(unknown.generalMessage, COURSE_GENERAL_ERROR_MESSAGE);
});

test("traducir un mapa vacío no genera aviso general", () => {
  assert.deepEqual(translateCourseFieldErrors({}), {
    errors: {},
    generalMessage: null,
  });
});