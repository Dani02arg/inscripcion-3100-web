import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENTS_LOAD_ERROR_MESSAGE,
  STUDENT_API_NOT_CONFIGURED_MESSAGE,
  STUDENT_CONNECTION_ERROR_MESSAGE,
  STUDENT_NOT_FOUND_MESSAGE,
  STUDENT_OPERATION_ERROR_MESSAGE,
  STUDENT_TIMEOUT_ERROR_MESSAGE,
  STUDENT_VALIDATION_MESSAGE,
  getStudentDetail,
  listMyStudents,
  listStudentsPage,
  parseMyStudentsResponse,
  parseStudent,
  parseStudentDetailResponse,
  parseStudentListMeta,
  parseStudentListResponse,
  parseStudentMutationResponse,
  parseStudentTutor,
  parseStudentTutorResponse,
  registerStudent,
  updateStudent,
} from "../../app/lib/api/students.ts";
import { STUDENT_GENERAL_ERROR_MESSAGE } from "../../app/lib/validation/students.ts";

function student(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "uuid-1",
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: "lucas@example.com",
    studentPhone: "3874112233",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "Salta Capital",
    address: "Av. San Martin 123",
    created_at: "2026-10-24T18:50:01+00:00",
    updated_at: "2026-10-24T18:50:01+00:00",
    ...overrides,
  };
}

function tutor(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    name: "Andrés",
    lastname: "Pérez",
    email: "andres@example.com",
    user_phone: "3875123159",
    ...overrides,
  };
}

function meta(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 1,
    ...overrides,
  };
}

test("parsea un alumno completo y normaliza el identificador numérico", () => {
  assert.deepEqual(parseStudent(student()), {
    id: "uuid-1",
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: "lucas@example.com",
    studentPhone: "3874112233",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "Salta Capital",
    address: "Av. San Martin 123",
    created_at: "2026-10-24T18:50:01+00:00",
    updated_at: "2026-10-24T18:50:01+00:00",
  });

  assert.equal(parseStudent(student({ id: 123 }))?.id, "123");
});

test("los opcionales ausentes o vacíos quedan en nulo", () => {
  const parsed = parseStudent(
    student({
      studentEmail: null,
      studentPhone: "",
      birthplace: "   ",
      address: null,
      created_at: undefined,
      updated_at: null,
    }),
  );

  assert.ok(parsed);
  assert.equal(parsed.studentEmail, null);
  assert.equal(parsed.studentPhone, null);
  assert.equal(parsed.birthplace, null);
  assert.equal(parsed.address, null);
  assert.equal(parsed.created_at, undefined);
  assert.equal(parsed.updated_at, undefined);
});

test("un alumno sin campos obligatorios es inválido", () => {
  for (const field of [
    "id",
    "studentDni",
    "studentCuil",
    "firstName",
    "lastName",
    "birthdate",
    "gender",
  ]) {
    assert.equal(parseStudent(student({ [field]: undefined })), null);
  }

  assert.equal(parseStudent(null), null);
  assert.equal(parseStudent([]), null);
  assert.equal(parseStudent("texto"), null);
});

test("un género fuera de los documentados invalida al alumno", () => {
  for (const gender of ["masculino", "DESCONOCIDO", "", null, 1]) {
    assert.equal(parseStudent(student({ gender })), null);
  }
});

test("parsea y recorta los datos del tutor responsable", () => {
  assert.deepEqual(parseStudentTutor(tutor()), {
    name: "Andrés",
    lastname: "Pérez",
    email: "andres@example.com",
    user_phone: "3875123159",
  });

  const withoutPhone = parseStudentTutor(
    tutor({ name: " Andrés ", user_phone: null }),
  );
  assert.equal(withoutPhone?.name, "Andrés");
  assert.equal(withoutPhone?.user_phone, null);

  for (const field of ["name", "lastname", "email"]) {
    assert.equal(parseStudentTutor(tutor({ [field]: "" })), null);
  }
});

test("los metadatos de paginación válidos se normalizan", () => {
  assert.deepEqual(parseStudentListMeta(meta()), {
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 1,
  });

  assert.deepEqual(
    parseStudentListMeta(
      meta({ current_page: 2, last_page: 3, per_page: 10, total: 21 }),
    ),
    {
      currentPage: 2,
      lastPage: 3,
      perPage: 10,
      total: 21,
    },
  );
});

test("los metadatos inválidos o inconsistentes se rechazan", () => {
  for (const value of [
    null,
    undefined,
    "texto",
    {},
    meta({ current_page: 0 }),
    meta({ last_page: 0 }),
    meta({ per_page: 0 }),
    meta({ total: -1 }),
    meta({ current_page: 3, last_page: 2 }),
    meta({ total: "1" }),
  ]) {
    assert.equal(parseStudentListMeta(value), null);
  }
});

test("el listado general exige data y metadatos válidos", () => {
  const success = parseStudentListResponse(200, {
    data: [student()],
    meta: meta(),
  });

  assert.equal(success.ok, true);

  if (success.ok) {
    assert.equal(success.students.length, 1);
    assert.equal(success.meta.total, 1);
  }

  assert.equal(parseStudentListResponse(401, null).ok, false);
  assert.equal(parseStudentListResponse(403, null).ok, false);
  assert.equal(parseStudentListResponse(500, null).ok, false);
  assert.equal(
    parseStudentListResponse(200, { data: [student()] }).ok,
    false,
  );
  assert.equal(
    parseStudentListResponse(200, {
      data: [student()],
      meta: meta({ total: -1 }),
    }).ok,
    false,
  );
  assert.equal(
    parseStudentListResponse(200, { data: [{}], meta: meta() }).ok,
    false,
  );
});

test("el listado propio acepta arreglos y sintetiza metadatos", () => {
  const success = parseMyStudentsResponse(200, {
    data: [student({ id: "a" }), student({ id: "b" })],
  });

  assert.equal(success.ok, true);

  if (success.ok) {
    assert.equal(success.students.length, 2);
    assert.equal(success.meta.total, 2);
    assert.equal(success.meta.currentPage, 1);
    assert.equal(success.meta.lastPage, 1);
  }

  const empty = parseMyStudentsResponse(200, { data: [] });
  assert.equal(empty.ok, true);

  if (empty.ok) {
    assert.deepEqual(empty.students, []);
    assert.equal(empty.meta.total, 0);
  }

  assert.equal(parseMyStudentsResponse(401, null).ok, false);
  assert.equal(parseMyStudentsResponse(403, null).ok, false);
  assert.equal(parseMyStudentsResponse(200, { data: [{}] }).ok, false);
});

test("el detalle clasifica sesión, permisos, no encontrado y error", () => {
  const success = parseStudentDetailResponse(200, {
    data: student(),
  });
  assert.equal(success.ok, true);

  if (success.ok) {
    assert.equal(success.student.id, "uuid-1");
  }

  const unauthorized = parseStudentDetailResponse(401, null);
  const forbidden = parseStudentDetailResponse(403, null);
  const notFound = parseStudentDetailResponse(404, null);
  const failed = parseStudentDetailResponse(500, null);

  assert.equal(unauthorized.ok, false);
  assert.equal(forbidden.ok, false);
  assert.equal(notFound.ok, false);
  assert.equal(failed.ok, false);

  if (!notFound.ok) {
    assert.equal(notFound.kind, "not_found");
    assert.equal(notFound.message, STUDENT_NOT_FOUND_MESSAGE);
  }

  if (!failed.ok) {
    assert.equal(failed.message, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  assert.equal(
    parseStudentDetailResponse(200, { data: {} }).ok,
    false,
  );
});

test("el tutor responsable clasifica no encontrado y datos inválidos", () => {
  const success = parseStudentTutorResponse(200, {
    data: tutor(),
  });
  assert.equal(success.ok, true);

  if (success.ok) {
    assert.equal(success.tutor.email, "andres@example.com");
  }

  const notFound = parseStudentTutorResponse(404, null);
  assert.equal(notFound.ok, false);

  if (!notFound.ok) {
    assert.equal(notFound.kind, "not_found");
  }

  assert.equal(
    parseStudentTutorResponse(200, { data: {} }).ok,
    false,
  );
  assert.equal(parseStudentTutorResponse(500, null).ok, false);
});

test("el alta exitosa devuelve el alumno y el mensaje correspondiente", () => {
  const result = parseStudentMutationResponse(
    201,
    { data: student() },
    201,
  );

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.message, "Alumno registrado correctamente");
    assert.equal(result.student?.id, "uuid-1");
  }
});

test("la edición exitosa devuelve el alumno actualizado", () => {
  const result = parseStudentMutationResponse(
    200,
    { data: student({ firstName: "Lucas Andrés" }) },
    200,
  );

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.message, "Alumno actualizado correctamente");
    assert.equal(result.student?.firstName, "Lucas Andrés");
  }
});

test("las escrituras clasifican sesión, permisos y no encontrado", () => {
  const unauthorized = parseStudentMutationResponse(401, null, 201);
  const forbidden = parseStudentMutationResponse(403, null, 201);
  const notFound = parseStudentMutationResponse(404, null, 200);

  assert.equal(unauthorized.ok, false);
  assert.equal(forbidden.ok, false);
  assert.equal(notFound.ok, false);

  if (!unauthorized.ok) {
    assert.equal(unauthorized.kind, "unauthorized");
  }

  if (!forbidden.ok) {
    assert.equal(forbidden.kind, "forbidden");
  }

  if (!notFound.ok) {
    assert.equal(notFound.kind, "not_found");
    assert.equal(notFound.message, STUDENT_NOT_FOUND_MESSAGE);
  }
});

test("un 422 traduce los errores conocidos y los conserva por campo", () => {
  const result = parseStudentMutationResponse(
    422,
    {
      errors: {
        studentDni: ["The student dni has already been taken."],
      },
    },
    201,
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(result.message, STUDENT_VALIDATION_MESSAGE);
    assert.equal(
      result.fieldErrors?.studentDni,
      "El DNI ya está registrado.",
    );
  }
});

test("un 422 con claves o mensajes desconocidos deriva a aviso general", () => {
  const unknownKey = parseStudentMutationResponse(
    422,
    { errors: { hack: ["No corresponde."] } },
    201,
  );
  const unknownMessage = parseStudentMutationResponse(
    422,
    { errors: { studentDni: ["Something went wrong."] } },
    201,
  );

  assert.equal(unknownKey.ok, false);
  assert.equal(unknownMessage.ok, false);

  if (!unknownKey.ok) {
    assert.equal(unknownKey.message, STUDENT_GENERAL_ERROR_MESSAGE);
    assert.deepEqual(unknownKey.fieldErrors, {});
  }

  if (!unknownMessage.ok) {
    assert.equal(
      unknownMessage.message,
      STUDENT_GENERAL_ERROR_MESSAGE,
    );
    assert.deepEqual(unknownMessage.fieldErrors, {});
  }
});

test("una respuesta exitosa inválida no se acepta", () => {
  assert.equal(
    parseStudentMutationResponse(201, { data: {} }, 201).ok,
    false,
  );
  assert.equal(
    parseStudentMutationResponse(201, null, 201).ok,
    false,
  );
  assert.equal(
    parseStudentMutationResponse(200, { data: student() }, 201).ok,
    false,
  );

  const failed = parseStudentMutationResponse(500, null, 201);
  assert.equal(failed.ok, false);

  if (!failed.ok) {
    assert.equal(
      failed.message,
      STUDENT_OPERATION_ERROR_MESSAGE,
    );
  }
});

interface MutationFetchCall {
  readonly url: string;
  readonly init?: RequestInit;
}

function makeMutationFetch(
  body: unknown,
  status = 200,
): {
  readonly fetchImpl: typeof fetch;
  readonly calls: MutationFetchCall[];
} {
  const calls: MutationFetchCall[] = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    calls.push({ url, init });

    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { fetchImpl, calls };
}

const MUTATION_OPTIONS = { baseUrl: "http://api.test" };

test("el alta envía POST y acepta 201 con alumno válido", async () => {
  const payload = {
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: "lucas@example.com",
    studentPhone: "3874112233",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "Salta Capital",
    address: "Av. San Martin 123",
  };
  const { fetchImpl, calls } = makeMutationFetch(
    { data: student() },
    201,
  );

  const result = await registerStudent("token-1", payload, {
    ...MUTATION_OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.message, "Alumno registrado correctamente");
    assert.equal(result.student?.id, "uuid-1");
  }

  assert.equal(calls.length, 1);
  assert.ok(calls[0]?.url.endsWith("/api/students"));

  const init = calls[0]?.init;
  assert.ok(init);
  assert.equal(init.method, "POST");
  assert.equal(init.body, JSON.stringify(payload));
  assert.equal(init.credentials, "omit");
  assert.equal(init.cache, "no-store");
  assert.equal(init.redirect, "manual");

  const headers = new Headers(init.headers);
  assert.equal(headers.get("Authorization"), "Bearer token-1");
  assert.equal(headers.get("Content-Type"), "application/json");
});

test("la edición envía PUT con solo campos editables y acepta 200", async () => {
  const payload = {
    firstName: "Lucas Andrés",
    lastName: "Pérez",
    studentEmail: null,
    studentPhone: null,
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: null,
    address: "Nueva 456",
  };
  const { fetchImpl, calls } = makeMutationFetch(
    { data: student({ firstName: "Lucas Andrés", address: "Nueva 456" }) },
    200,
  );

  const result = await updateStudent(
    "token-1",
    "uuid-1",
    payload,
    { ...MUTATION_OPTIONS, fetchImpl },
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.message, "Alumno actualizado correctamente");
    assert.equal(result.student?.firstName, "Lucas Andrés");
  }

  assert.equal(calls.length, 1);
  assert.ok(calls[0]?.url.endsWith("/api/students/uuid-1"));

  const init = calls[0]?.init;
  assert.ok(init);
  assert.equal(init.method, "PUT");
  assert.equal(init.body, JSON.stringify(payload));
  assert.equal(init.body.includes("studentDni"), false);
  assert.equal(init.body.includes("studentCuil"), false);
});

test("el alta clasifica 422, 404, 403 y 401 con errores por campo", async () => {
  const payload = { studentDni: "50123456" };
  const cases = [
    {
      status: 422,
      body: {
        errors: {
          studentDni: ["The student dni has already been taken."],
        },
      },
      kind: "validation" as const,
      fieldErrors: { studentDni: "El DNI ya está registrado." },
    },
    { status: 404, body: {}, kind: "not_found" as const },
    { status: 403, body: {}, kind: "forbidden" as const },
    { status: 401, body: {}, kind: "unauthorized" as const },
  ];

  for (const testCase of cases) {
    const { fetchImpl } = makeMutationFetch(testCase.body, testCase.status);
    const result = await registerStudent("token-1", payload, {
      ...MUTATION_OPTIONS,
      fetchImpl,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, testCase.kind);
      if (testCase.kind === "validation") {
        assert.deepEqual(result.fieldErrors, testCase.fieldErrors);
      }
    }
  }
});

test("la edición clasifica 422, 404, 403 y 401 con errores por campo", async () => {
  const payload = { firstName: "Lucas" };
  const cases = [
    {
      status: 422,
      body: {
        errors: {
          studentEmail: ["The student email has already been taken."],
        },
      },
      kind: "validation" as const,
      fieldErrors: { studentEmail: "El correo ya está registrado." },
    },
    { status: 404, body: {}, kind: "not_found" as const },
    { status: 403, body: {}, kind: "forbidden" as const },
    { status: 401, body: {}, kind: "unauthorized" as const },
  ];

  for (const testCase of cases) {
    const { fetchImpl } = makeMutationFetch(testCase.body, testCase.status);
    const result = await updateStudent("token-1", "uuid-1", payload, {
      ...MUTATION_OPTIONS,
      fetchImpl,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, testCase.kind);
      if (testCase.kind === "validation") {
        assert.deepEqual(result.fieldErrors, testCase.fieldErrors);
      }
    }
  }
});

test("las solicitudes distinguen red, tiempo agotado y configuración ausente", async () => {
  const connectionFetch: typeof fetch = async () => {
    throw new Error("sin red");
  };
  const timeoutFetch: typeof fetch = async () => {
    const error = new Error("tiempo agotado");
    error.name = "TimeoutError";
    throw error;
  };
  const abortFetch: typeof fetch = async () => {
    const error = new Error("abortado");
    error.name = "AbortError";
    throw error;
  };
  let called = false;
  const configFetch: typeof fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };

  const connection = await registerStudent("token-1", {}, {
    baseUrl: "http://api.test",
    fetchImpl: connectionFetch,
  });
  const timeout = await updateStudent("token-1", "uuid-1", {}, {
    baseUrl: "http://api.test",
    fetchImpl: timeoutFetch,
  });
  const abort = await getStudentDetail("token-1", "uuid-1", {
    baseUrl: "http://api.test",
    fetchImpl: abortFetch,
  });
  const config = await listMyStudents("token-1", {
    baseUrl: "   ",
    fetchImpl: configFetch,
  });

  assert.equal(connection.ok, false);
  assert.equal(timeout.ok, false);
  assert.equal(abort.ok, false);
  assert.equal(config.ok, false);
  assert.equal(called, false);

  if (!connection.ok) {
    assert.equal(connection.kind, "failed");
    assert.equal(connection.status, null);
    assert.equal(connection.message, STUDENT_CONNECTION_ERROR_MESSAGE);
  }
  if (!timeout.ok) {
    assert.equal(timeout.message, STUDENT_TIMEOUT_ERROR_MESSAGE);
  }
  if (!abort.ok) {
    assert.equal(abort.message, STUDENT_TIMEOUT_ERROR_MESSAGE);
  }
  if (!config.ok) {
    assert.equal(config.message, STUDENT_API_NOT_CONFIGURED_MESSAGE);
  }
});

test("las respuestas respetan la precedencia 401, 403, 404 y 422", () => {
  const unauthorized = parseStudentMutationResponse(
    401,
    { errors: { studentDni: ["taken"] } },
    201,
  );
  const forbidden = parseStudentDetailResponse(403, {
    data: student(),
  });
  const notFound = parseStudentListResponse(404, {
    data: [student()],
    meta: meta(),
  });
  const validation = parseStudentMutationResponse(
    422,
    { errors: { studentDni: ["The student dni has already been taken."] } },
    200,
  );

  assert.equal(unauthorized.ok, false);
  assert.equal(forbidden.ok, false);
  assert.equal(notFound.ok, false);
  assert.equal(validation.ok, false);

  if (!unauthorized.ok) assert.equal(unauthorized.kind, "unauthorized");
  if (!forbidden.ok) assert.equal(forbidden.kind, "forbidden");
  if (!notFound.ok) assert.equal(notFound.kind, "failed");
  if (!validation.ok) assert.equal(validation.kind, "validation");
});

test("todas las solicitudes usan opciones seguras y timeout sin exponer datos", async () => {
  const calls: MutationFetchCall[] = [];
  const timeoutValues: number[] = [];
  const logs: string[] = [];
  const originalTimeout = AbortSignal.timeout;
  const originalConsoleError = console.error;
  const sensitive = [
    "50123456",
    "20501234567",
    "lucas@example.com",
    "3874112233",
    "token-secreto",
  ];

  AbortSignal.timeout = ((ms: number): AbortSignal => {
    timeoutValues.push(ms);
    return originalTimeout(ms);
  }) as typeof AbortSignal.timeout;
  console.error = ((...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  }) as typeof console.error;

  const fetchImpl: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    calls.push({ url, init });
    const path = new URL(url).pathname;

    if (path.endsWith("/students/me")) {
      return new Response(JSON.stringify({ data: [student()] }), { status: 200 });
    }
    if (path.endsWith("/students") && (init?.method ?? "GET") === "GET") {
      return new Response(
        JSON.stringify({ data: [student()], meta: meta() }),
        { status: 200 },
      );
    }
    if (path.endsWith("/tutor")) {
      return new Response(JSON.stringify({ data: tutor() }), { status: 200 });
    }
    if (path.endsWith("/students/uuid-1") && (init?.method ?? "GET") === "GET") {
      return new Response(JSON.stringify({ data: student() }), { status: 200 });
    }
    if (init?.method === "POST") {
      return new Response(JSON.stringify({ data: student() }), { status: 201 });
    }
    if (init?.method === "PUT") {
      return new Response(JSON.stringify({ data: student() }), { status: 200 });
    }

    return new Response("{}", { status: 500 });
  };

  try {
    await listMyStudents("token-secreto", { ...MUTATION_OPTIONS, fetchImpl });
    await listStudentsPage(
      "token-secreto",
      { studentDni: "", studentCuil: "", firstName: "", lastName: "" },
      1,
      { ...MUTATION_OPTIONS, fetchImpl },
    );
    await getStudentDetail("token-secreto", "uuid-1", {
      ...MUTATION_OPTIONS,
      fetchImpl,
    });
    const { getStudentTutor } = await import(
      "../../app/lib/api/students.ts"
    );
    await getStudentTutor("token-secreto", "uuid-1", {
      ...MUTATION_OPTIONS,
      fetchImpl,
    });
    await registerStudent(
      "token-secreto",
      {
        studentDni: "50123456",
        studentCuil: "20501234567",
        firstName: "Lucas",
        lastName: "Pérez",
        studentEmail: "lucas@example.com",
        studentPhone: "3874112233",
        birthdate: "2010-08-20",
        gender: "Masculino",
        birthplace: "Salta",
        address: "Calle 1",
      },
      { ...MUTATION_OPTIONS, fetchImpl },
    );
    await updateStudent(
      "token-secreto",
      "uuid-1",
      {
        firstName: "Lucas",
        lastName: "Pérez",
        studentEmail: "lucas@example.com",
        studentPhone: "3874112233",
        birthdate: "2010-08-20",
        gender: "Masculino",
        birthplace: "Salta",
        address: "Calle 1",
      },
      { ...MUTATION_OPTIONS, fetchImpl },
    );
    await registerStudent(
      "token-secreto",
      { studentDni: "50123456", studentEmail: "lucas@example.com" },
      { baseUrl: "   ", fetchImpl },
    );
  } finally {
    AbortSignal.timeout = originalTimeout;
    console.error = originalConsoleError;
  }

  assert.equal(calls.length, 6);
  assert.deepEqual(timeoutValues, [10000, 10000, 10000, 10000, 10000, 10000]);

  for (const call of calls) {
    const init = call.init;
    assert.ok(init);
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Authorization"), "Bearer token-secreto");
    assert.equal(init.credentials, "omit");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "manual");
    assert.ok(init.signal instanceof AbortSignal);
  }

  const logText = logs.join("\n");
  for (const value of sensitive) {
    assert.equal(logText.includes(value), false);
  }
});
