import assert from "node:assert/strict";
import { test } from "node:test";

import {
  toDictamenActionState,
  toRegistrationDetailState,
  toRegistrationListState,
} from "../../app/lib/registrations/registration-state.ts";
import type { Registration } from "../../app/lib/registrations/types.ts";

function makeRegistration(id: string): Registration {
  return {
    id,
    status: "PENDING",
    studentId: "st-1",
    idCourse: "c-1",
    proposedCourseId: null,
    institutionOfOrigin: null,
    relationship: "Padre",
    photoAuthorization: true,
    healthProblem: false,
    inclusionStudent: false,
    contactImpediment: false,
    legalProceedings: false,
    hasHealthProblemCertificate: false,
    hasInclusionStudentCertificate: false,
    hasContactImpedimentCertificate: false,
    hasLegalProceedingsCertificate: false,
    reassignmentReason: null,
    observations: null,
    pendingSubjects: null,
    missingDocumentation: null,
    student: {
      id: "s-1",
      studentCuil: "20123456789",
      firstName: "Lucas",
      lastName: "Pérez",
    },
    course: {
      id: "c-1",
      code: "2026-1-1-BAS-INF-M",
      year: 2026,
      studyYear: 1,
      division: "1",
      cycle: "basic",
      shift: "morning",
      speciality: "informatics",
    },
    proposedCourse: null,
    created_at: "2026-10-31T15:30:00Z",
    updated_at: "2026-10-31T15:30:00Z",
  };
}

const META = { currentPage: 1, lastPage: 1, perPage: 100, total: 0 };

test("toRegistrationListState distingue listo, vacío y errores", () => {
  assert.deepEqual(toRegistrationListState({ ok: false, kind: "forbidden", status: 403, message: "denegado" }), {
    status: "forbidden",
    message: "denegado",
  });
  assert.deepEqual(toRegistrationListState({ ok: false, kind: "failed", status: 500, message: "fallo" }), {
    status: "error",
    message: "fallo",
  });
  assert.deepEqual(
    toRegistrationListState({ ok: true, registrations: [], meta: META, message: "" }),
    { status: "empty" },
  );

  const reg = makeRegistration("r1");
  assert.deepEqual(
    toRegistrationListState({ ok: true, registrations: [reg], meta: { ...META, total: 1 }, message: "" }),
    { status: "ready", registrations: [reg] },
  );
});

test("toRegistrationDetailState conserva el tutor y distingue no encontrado", () => {
  const reg = makeRegistration("r1");

  assert.deepEqual(
    toRegistrationDetailState({ ok: false, kind: "not_found", status: 404, message: "no existe" }),
    { status: "not_found" },
  );
  assert.deepEqual(
    toRegistrationDetailState({ ok: false, kind: "forbidden", status: 403, message: "denegado" }),
    { status: "forbidden", message: "denegado" },
  );

  const tutor = { name: "Andrés", lastname: "Pérez", email: "a@b.c", user_phone: null };
  assert.deepEqual(
    toRegistrationDetailState({ ok: true, registration: reg, tutor: null, message: "" }, tutor),
    { status: "ready", registration: reg, tutor },
  );
  assert.deepEqual(
    toRegistrationDetailState({ ok: true, registration: reg, tutor: null, message: "" }),
    { status: "ready", registration: reg, tutor: null },
  );
});

test("toDictamenActionState traduce cada resultado", () => {
  assert.deepEqual(toDictamenActionState({ ok: true, message: "ok" }), {
    status: "success",
    message: "ok",
  });

  assert.deepEqual(
    toDictamenActionState({
      ok: false,
      kind: "validation",
      status: 422,
      message: "revisá",
      fieldErrors: { observations: "falta" },
    }),
    { status: "validation", message: "revisá", fieldErrors: { observations: "falta" } },
  );

  assert.deepEqual(
    toDictamenActionState({ ok: false, kind: "conflict", status: 409, message: "cambió" }),
    { status: "conflict", message: "cambió" },
  );

  assert.deepEqual(
    toDictamenActionState({ ok: false, kind: "forbidden", status: 403, message: "no" }),
    { status: "forbidden", message: "no" },
  );

  assert.deepEqual(
    toDictamenActionState({ ok: false, kind: "not_found", status: 404, message: "nf" }),
    { status: "not_found", message: "nf" },
  );

  assert.deepEqual(
    toDictamenActionState({ ok: false, kind: "failed", status: 500, message: "err" }),
    { status: "error", message: "err" },
  );
});
