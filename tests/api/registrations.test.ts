import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_API_NOT_CONFIGURED_MESSAGE,
  REGISTRATION_CONFLICT_MESSAGE,
  REGISTRATION_CONNECTION_ERROR_MESSAGE,
  REGISTRATION_NOT_FOUND_MESSAGE,
  REGISTRATION_TIMEOUT_ERROR_MESSAGE,
  approveRegistration,
  getPendingRegistrationsTotal,
  listAllRegistrations,
  observeRegistration,
  parseDictamenResponse,
  parsePendingTotal,
  parseRegistration,
  parseRegistrationDetailResponse,
  parseRegistrationListMeta,
  parseRegistrationListResponse,
  proposeReassignment,
  rejectRegistration,
} from "../../app/lib/api/registrations.ts";

type MockResponse = {
  readonly status: number;
  readonly ok: boolean;
  readonly json: () => Promise<unknown>;
};

type MockFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<MockResponse>;

function jsonFetch(status: number, body: unknown): MockFetch {
  return async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

function sequenceFetch(
  responses: readonly { readonly status: number; readonly body: unknown }[],
): MockFetch {
  let index = 0;
  return async () => {
    const current = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return {
      status: current.status,
      ok: current.status >= 200 && current.status < 300,
      json: async () => current.body,
    };
  };
}

function throwingFetch(name: string): MockFetch {
  return async () => {
    throw { name };
  };
}

function registration(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "uuid-1",
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
    created_at: "2026-10-31T15:30:00+00:00",
    updated_at: "2026-10-31T15:30:00+00:00",
    ...overrides,
  };
}

function meta(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 1,
    ...overrides,
  };
}

test("parseRegistration valida una inscripción completa y opcionales nulos", () => {
  const parsed = parseRegistration(registration());

  assert.ok(parsed);
  assert.equal(parsed.id, "uuid-1");
  assert.equal(parsed.status, "PENDING");
  assert.equal(parsed.student.studentCuil, "20123456789");
  assert.equal(parsed.course.code, "2026-1-1-BAS-INF-M");
  assert.equal(parsed.proposedCourseId, null);
  assert.equal(parsed.proposedCourse, null);
  assert.equal(parsed.pendingSubjects, null);
  assert.equal(parsed.observations, null);
});

test("parseRegistration normaliza las materias y el curso propuesto", () => {
  const parsed = parseRegistration(
    registration({
      pendingSubjects: ["Matemática", "Lengua"],
      proposedCourseId: "c-9",
    }),
  );

  assert.ok(parsed);
  assert.deepEqual(parsed.pendingSubjects, ["Matemática", "Lengua"]);
  assert.equal(parsed.proposedCourseId, "c-9");
});

test("parseRegistration rechaza campos obligatorios ausentes", () => {
  for (const field of [
    "id",
    "status",
    "studentId",
    "idCourse",
    "relationship",
    "student",
    "course",
    "created_at",
    "updated_at",
    "photoAuthorization",
  ]) {
    const broken = registration({ [field]: undefined });
    assert.equal(parseRegistration(broken), null, field);
  }

  assert.equal(parseRegistration(registration({ status: "DESCONOCIDO" })), null);
  assert.equal(parseRegistration(null), null);
  assert.equal(parseRegistration([]), null);
});

test("parseRegistrationListMeta valida los metadatos", () => {
  assert.deepEqual(
    parseRegistrationListMeta({ current_page: 2, last_page: 3, per_page: 10, total: 25 }),
    { currentPage: 2, lastPage: 3, perPage: 10, total: 25 },
  );
  assert.equal(parseRegistrationListMeta(null), null);
  assert.equal(
    parseRegistrationListMeta({ current_page: 3, last_page: 2, per_page: 10, total: 0 }),
    null,
  );
  assert.equal(
    parseRegistrationListMeta({ current_page: "2", last_page: 3, per_page: 10, total: 25 }),
    null,
  );
});

test("parseRegistrationListResponse clasifica éxito y errores", () => {
  const ok = parseRegistrationListResponse(200, {
    data: [registration()],
    meta: meta(),
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.meta.total, 1);
    assert.equal(ok.registrations.length, 1);
  }

  assert.deepEqual(parseRegistrationListResponse(401, null), {
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Tu sesión expiró. Iniciá sesión nuevamente.",
  });

  assert.equal(parseRegistrationListResponse(500, null).ok, false);
  assert.equal(
    parseRegistrationListResponse(200, { data: [], meta: null }).ok,
    false,
  );
});

test("parseRegistrationListResponse rechaza cuerpos inválidos", () => {
  // Cuerpo que no es un registro.
  const nonRecord = parseRegistrationListResponse(200, "no-es-un-objeto");
  assert.equal(nonRecord.ok, false);
  if (!nonRecord.ok) {
    assert.equal(nonRecord.kind, "failed");
  }

  // `data` que no es un arreglo.
  const dataNotArray = parseRegistrationListResponse(200, {
    data: "no-es-un-arreglo",
    meta: meta(),
  });
  assert.equal(dataNotArray.ok, false);
  if (!dataNotArray.ok) {
    assert.equal(dataNotArray.kind, "failed");
  }

  // Un elemento del arreglo que no es una inscripción válida.
  const invalidItem = parseRegistrationListResponse(200, {
    data: [registration(), null],
    meta: meta(),
  });
  assert.equal(invalidItem.ok, false);
  if (!invalidItem.ok) {
    assert.equal(invalidItem.kind, "failed");
  }

  // Detalle con `data` que no es un registro.
  const detailNotRecord = parseRegistrationDetailResponse(200, {
    data: "no-es-un-registro",
  });
  assert.equal(detailNotRecord.ok, false);
  if (!detailNotRecord.ok) {
    assert.equal(detailNotRecord.kind, "failed");
  }
});

test("parseRegistrationDetailResponse distingue no encontrado", () => {
  const ok = parseRegistrationDetailResponse(200, { data: registration() });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.registration.id, "uuid-1");
    assert.equal(ok.tutor, null);
  }

  assert.deepEqual(parseRegistrationDetailResponse(404, null), {
    ok: false,
    kind: "not_found",
    status: 404,
    message: REGISTRATION_NOT_FOUND_MESSAGE,
  });
});

test("parseDictamenResponse clasifica éxito, conflicto y validación", () => {
  const ok = parseDictamenResponse(200, {
    data: registration({ status: "APPROVED" }),
  });
  assert.equal(ok.ok, true);

  assert.deepEqual(parseDictamenResponse(409, null), {
    ok: false,
    kind: "conflict",
    status: 409,
    message: REGISTRATION_CONFLICT_MESSAGE,
  });

  const validation = parseDictamenResponse(422, {
    errors: { observations: ["The observations field is required."] },
  });
  assert.equal(validation.ok, false);
  if (!validation.ok && validation.kind === "validation") {
    assert.equal(
      validation.fieldErrors?.observations,
      "Debe detallar qué falta o está mal en la solicitud.",
    );
  }

  assert.equal(parseDictamenResponse(500, null).ok, false);
});

test("parsePendingTotal extrae el total del listado", () => {
  assert.equal(
    parsePendingTotal(200, { data: [], meta: meta({ total: 7 }) }),
    7,
  );
  assert.equal(parsePendingTotal(500, null), null);
});

test("listAllRegistrations recorre varias páginas sin datos parciales", async () => {
  const fetchImpl = sequenceFetch([
    { status: 200, body: { data: [registration({ id: "a" })], meta: meta({ last_page: 2, total: 2 }) } },
    { status: 200, body: { data: [registration({ id: "b" })], meta: meta({ current_page: 2, last_page: 2, total: 2 }) } },
  ]);

  const result = await listAllRegistrations("token", {
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.registrations.map((r) => r.id), ["a", "b"]);
    assert.equal(result.meta.total, 2);
  }
});

test("listAllRegistrations falla atómicamente si una página falla", async () => {
  const fetchImpl = sequenceFetch([
    { status: 200, body: { data: [registration({ id: "a" })], meta: meta({ last_page: 2, total: 2 }) } },
    { status: 500, body: null },
  ]);

  const result = await listAllRegistrations("token", {
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(result.ok, false);
});

test("los dictámenes escriben con PUT y clasifican la respuesta", async () => {
  const fetchImpl = jsonFetch(200, {
    data: registration({ status: "APPROVED" }),
  });

  const result = await approveRegistration("token", "uuid-1", {}, {
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.registration?.status, "APPROVED");
  }

  const rejected = await rejectRegistration(
    "token",
    "uuid-1",
    {},
    {
      baseUrl: "http://localhost:8000",
      fetchImpl: jsonFetch(409, null) as unknown as typeof fetch,
    },
  );
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.kind, "conflict");
  }
});

test("un dictamen con 422 devuelve validación con errores por campo", async () => {
  const result = await observeRegistration(
    "token",
    "uuid-1",
    {},
    {
      baseUrl: "http://localhost:8000",
      fetchImpl: jsonFetch(422, {
        errors: { observations: ["The observations field is required."] },
      }) as unknown as typeof fetch,
    },
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
  }
});

test("los errores de red y tiempo agotado se clasifican", async () => {
  const timeout = await proposeReassignment(
    "token",
    "uuid-1",
    {},
    {
      baseUrl: "http://localhost:8000",
      fetchImpl: throwingFetch("TimeoutError") as unknown as typeof fetch,
    },
  );
  assert.equal(timeout.ok, false);
  if (!timeout.ok) {
    assert.equal(timeout.message, REGISTRATION_TIMEOUT_ERROR_MESSAGE);
  }

  const connection = await proposeReassignment(
    "token",
    "uuid-1",
    {},
    {
      baseUrl: "http://localhost:8000",
      fetchImpl: throwingFetch("TypeError") as unknown as typeof fetch,
    },
  );
  assert.equal(connection.ok, false);
  if (!connection.ok) {
    assert.equal(connection.message, REGISTRATION_CONNECTION_ERROR_MESSAGE);
  }
});

test("getPendingRegistrationsTotal lee el total de pendientes", async () => {
  const fetchImpl = jsonFetch(200, {
    data: [],
    meta: meta({ total: 12 }),
  });

  const total = await getPendingRegistrationsTotal("token", {
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(total, 12);
});

test("sin configuración devuelve el aviso de servicio no disponible", async () => {
  const result = await listAllRegistrations("token", {
    baseUrl: "",
    fetchImpl: jsonFetch(200, { data: [], meta: meta() }) as unknown as typeof fetch,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, REGISTRATION_API_NOT_CONFIGURED_MESSAGE);
  }
});
