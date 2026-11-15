import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_COURSE_REQUIRED_MESSAGE,
  REGISTRATION_GENERAL_ERROR_MESSAGE,
  REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE,
  REGISTRATION_REASON_REQUIRED_MESSAGE,
  buildApprovePayload,
  buildObservePayload,
  buildReassignPayload,
  buildRejectPayload,
  mapDictamenFieldErrors,
  translateDictamenFieldErrors,
  validateObservations,
  validateReassignment,
} from "../../app/lib/validation/registrations.ts";

test("validateObservations exige texto no vacío", () => {
  assert.equal(validateObservations("Falta el certificado"), null);
  assert.equal(
    validateObservations(""),
    REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE,
  );
  assert.equal(
    validateObservations("   "),
    REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE,
  );
});

test("validateReassignment exige curso de destino y motivo", () => {
  assert.deepEqual(
    validateReassignment({ newCourseId: "c-1", reassignmentReason: "Sin cupo" }),
    {},
  );
  assert.deepEqual(
    validateReassignment({ newCourseId: "", reassignmentReason: "" }),
    {
      newCourseId: REGISTRATION_COURSE_REQUIRED_MESSAGE,
      reassignmentReason: REGISTRATION_REASON_REQUIRED_MESSAGE,
    },
  );
  assert.deepEqual(
    validateReassignment({ newCourseId: "c-1", reassignmentReason: "" }),
    { reassignmentReason: REGISTRATION_REASON_REQUIRED_MESSAGE },
  );
});

test("los payloads de aprobar y rechazar omiten los campos vacíos", () => {
  assert.deepEqual(
    buildApprovePayload({
      observations: "",
      pendingSubjects: "",
      missingDocumentation: "",
    }),
    {},
  );
  assert.deepEqual(
    buildRejectPayload({
      observations: "No cumple",
      pendingSubjects: "Matemática, Lengua",
      missingDocumentation: "Analítico",
    }),
    {
      observations: "No cumple",
      pendingSubjects: ["Matemática", "Lengua"],
      missingDocumentation: "Analítico",
    },
  );
});

test("buildObservePayload envía solo las observaciones", () => {
  assert.deepEqual(buildObservePayload({ observations: "Falta certificado" }), {
    observations: "Falta certificado",
  });
});

test("buildReassignPayload envía curso, motivo y opcionales", () => {
  assert.deepEqual(
    buildReassignPayload({
      newCourseId: "c-2",
      reassignmentReason: "Sin cupo",
      observations: "",
      pendingSubjects: "Lengua",
      missingDocumentation: "",
    }),
    {
      newCourseId: "c-2",
      reassignmentReason: "Sin cupo",
      pendingSubjects: ["Lengua"],
    },
  );
});

test("mapDictamenFieldErrors mapea solo los campos conocidos", () => {
  assert.deepEqual(
    mapDictamenFieldErrors({
      errors: {
        observations: ["Falta texto"],
        newCourseId: ["Curso inválido"],
        unknown: ["ignorado"],
      },
    }),
    {
      observations: "Falta texto",
      newCourseId: "Curso inválido",
    },
  );
});

test("translateDictamenFieldErrors traduce los mensajes conocidos", () => {
  const result = translateDictamenFieldErrors({
    observations: "The observations field is required.",
    reassignmentReason: "The reassignment reason field is required.",
  });

  assert.deepEqual(result.errors, {
    observations: REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE,
    reassignmentReason: REGISTRATION_REASON_REQUIRED_MESSAGE,
  });
  assert.equal(result.generalMessage, null);
});

test("translateDictamenFieldErrors reconoce el curso lleno", () => {
  const result = translateDictamenFieldErrors({
    course: "El cupo del curso solicitado está lleno.",
  });

  assert.equal(
    result.errors.course,
    "El cupo del curso solicitado está lleno. Debe proponer una reasignación a otro curso.",
  );
});

test("translateDictamenFieldErrors deriva mensajes desconocidos al aviso general", () => {
  const result = translateDictamenFieldErrors({
    observations: "Algo totalmente desconocido",
  });

  assert.equal(result.errors.observations, undefined);
  assert.equal(result.generalMessage, REGISTRATION_GENERAL_ERROR_MESSAGE);
});
