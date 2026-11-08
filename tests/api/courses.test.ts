import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_DELETE_BLOCKED_MESSAGE,
  COURSE_NOT_FOUND_MESSAGE,
  COURSE_OPERATION_ERROR_MESSAGE,
  COURSE_REPORT_ERROR_MESSAGE,
  COURSES_LOAD_ERROR_MESSAGE,
  COURSES_MAX_PAGES,
  COURSES_PAGE_SIZE,
  cloneCourse,
  cloneCoursesByYear,
  createCourse,
  deleteCourse,
  getCourse,
  getCourseReport,
  listAllCourses,
  listCoursesPage,
  parseCloneCourseResponse,
  parseCloneYearResponse,
  parseCourse,
  parseCourseListResponse,
  parseCourseMutationResponse,
  parseCourseReportResponse,
  parseCourseResponse,
  parseDeleteResponse,
  setCourseStatus,
  updateCourse,
} from "../../app/lib/api/courses.ts";
import type { CoursePayload } from "../../app/lib/courses/types.ts";
import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../../app/lib/auth/types.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const validCourse = {
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

const validMeta = {
  current_page: 1,
  last_page: 2,
  per_page: 15,
  total: 16,
};

const validPayload: CoursePayload = {
  year: 2026,
  studyYear: 1,
  division: "1",
  cycle: "basic",
  speciality: "informatics",
  shift: "morning",
  maxCapacity: 30,
};

test("parsea un curso completo y normaliza el id numérico", () => {
  const course = parseCourse({ ...validCourse, id: 7 });

  assert.ok(course);
  assert.equal(course.id, "7");
  assert.equal(course.code, "2026-1-1-BAS-INF-M");
  assert.equal(course.availablePlaces, 18);
  assert.equal(course.status, "active");
});

test("acepta código ausente, vacío o nulo", () => {
  for (const code of [undefined, null, ""]) {
    const course = parseCourse({ ...validCourse, code });
    assert.ok(course);
    assert.equal(course.code, null);
  }
});

test("conserva enums desconocidos como texto", () => {
  const course = parseCourse({
    ...validCourse,
    cycle: "hybrid",
    speciality: "robotics",
    shift: "evening",
    status: "archived",
  });

  assert.ok(course);
  assert.equal(course.cycle, "hybrid");
  assert.equal(course.speciality, "robotics");
  assert.equal(course.shift, "evening");
  assert.equal(course.status, "archived");
});

test("deriva availablePlaces si falta y lo deja no disponible si es negativo", () => {
  const derived = parseCourse({
    ...validCourse,
    availablePlaces: undefined,
  });
  assert.equal(derived?.availablePlaces, 18);

  const inconsistent = parseCourse({
    ...validCourse,
    currentCapacity: 40,
    maxCapacity: 30,
    availablePlaces: undefined,
  });
  assert.equal(inconsistent?.availablePlaces, null);
});

test("rechaza cursos con campos obligatorios inválidos", () => {
  for (const invalid of [
    null,
    {},
    { ...validCourse, id: null },
    { ...validCourse, code: 12 },
    { ...validCourse, year: "2026" },
    { ...validCourse, year: 0 },
    { ...validCourse, studyYear: 0 },
    { ...validCourse, studyYear: 7 },
    { ...validCourse, division: "   " },
    { ...validCourse, cycle: "" },
    { ...validCourse, speciality: 1 },
    { ...validCourse, shift: null },
    { ...validCourse, maxCapacity: 0 },
    { ...validCourse, currentCapacity: -1 },
    { ...validCourse, status: "" },
  ]) {
    assert.equal(parseCourse(invalid), null);
  }
});

test("parsea una lista paginada válida", () => {
  const result = parseCourseListResponse(200, {
    data: [validCourse, { ...validCourse, id: "course-2" }],
    meta: validMeta,
    message: "Listado de cursos.",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.courses.length, 2);
    assert.deepEqual(result.meta, {
      currentPage: 1,
      lastPage: 2,
      perPage: 15,
      total: 16,
    });
    assert.equal(result.message, "Listado de cursos.");
  }
});

test("acepta una lista vacía con meta válida", () => {
  const result = parseCourseListResponse(200, {
    data: [],
    meta: { ...validMeta, last_page: 1, total: 0 },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.courses, []);
  }
});

test("clasifica 401 y 403 con sus mensajes", () => {
  const unauthorized = parseCourseListResponse(401, null);
  assert.equal(unauthorized.ok, false);
  if (!unauthorized.ok) {
    assert.equal(unauthorized.kind, "unauthorized");
    assert.equal(unauthorized.message, SESSION_EXPIRED_MESSAGE);
  }

  const forbidden = parseCourseListResponse(403, null);
  assert.equal(forbidden.ok, false);
  if (!forbidden.ok) {
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(forbidden.message, ACCESS_DENIED_MESSAGE);
  }
});

test("un error de servidor devuelve fallo genérico", () => {
  const result = parseCourseListResponse(500, { message: "boom" });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.message, COURSES_LOAD_ERROR_MESSAGE);
  }
});

test("rechaza cuerpos inválidos o con errores en 2xx", () => {
  for (const body of [
    null,
    {},
    { data: [] },
    { data: [], meta: { ...validMeta, last_page: 0 } },
    { data: [], meta: { ...validMeta, total: -1 } },
    { data: [validCourse], meta: validMeta, errors: ["algo"] },
    { data: [{ ...validCourse, year: "2026" }], meta: validMeta },
  ]) {
    const result = parseCourseListResponse(200, body);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, "failed");
      assert.equal(result.message, COURSES_LOAD_ERROR_MESSAGE);
    }
  }
});

test("parsea el reporte con total y filas incompletas", () => {
  const result = parseCourseReportResponse(200, {
    header: { totalInscriptions: 2 },
    list: [
      {
        lastname: "Pérez",
        name: "Ana",
        dni: "12345678",
        phone: "1122334455",
        email: "ana@example.com",
      },
      { lastname: "Gómez", name: null },
    ],
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.report.totalInscriptions, 2);
    assert.equal(result.report.rows.length, 2);
    assert.equal(result.report.rows[1]?.lastname, "Gómez");
    assert.equal(result.report.rows[1]?.name, null);
    assert.equal(result.report.rows[1]?.dni, null);
    assert.equal(result.report.rows[1]?.phone, null);
    assert.equal(result.report.rows[1]?.email, null);
  }
});

test("acepta reporte vacío y total no disponible", () => {
  const result = parseCourseReportResponse(200, { list: [] });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.report, { totalInscriptions: null, rows: [] });
  }
});

test("clasifica errores del reporte", () => {
  for (const [status, expected] of [
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [500, "failed"],
  ] as const) {
    const result = parseCourseReportResponse(status, null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, expected);
      if (status === 404) {
        assert.equal(result.message, COURSE_NOT_FOUND_MESSAGE);
      }
      if (status === 500) {
        assert.equal(result.message, COURSE_REPORT_ERROR_MESSAGE);
      }
    }
  }
});

test("rechaza reportes con listas o filas inválidas", () => {
  for (const body of [
    null,
    {},
    { header: {}, list: "no" },
    { header: {}, list: [null] },
    { header: {}, list: [], errors: ["algo"] },
  ]) {
    const result = parseCourseReportResponse(200, body);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, COURSE_REPORT_ERROR_MESSAGE);
    }
  }
});

test("parsea la clonación individual exitosa", () => {
  const result = parseCloneCourseResponse(201, {
    data: validCourse,
    message: "Curso clonado.",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.course.code, validCourse.code);
    assert.equal(result.course.status, "active");
    assert.equal(result.message, "Curso clonado.");
  }
});

test("clasifica errores de la clonación individual", () => {
  const missing = parseCloneCourseResponse(404, null);
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.kind, "not_found");
  }

  const conflict = parseCloneCourseResponse(422, { message: "boom" });
  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.status, 422);
    assert.equal(conflict.message, COURSE_OPERATION_ERROR_MESSAGE);
  }

  const invalid = parseCloneCourseResponse(201, { data: {} });
  assert.equal(invalid.ok, false);
});

test("parsea clonación masiva con cero y con resultado parcial", () => {
  const zero = parseCloneYearResponse(201, {
    message: "No se creó ningún curso.",
    cloned: 0,
  });
  assert.equal(zero.ok, true);
  if (zero.ok) {
    assert.equal(zero.cloned, 0);
    assert.equal(zero.attempted, 0);
    assert.deepEqual(zero.courses, []);
  }

  const partial = parseCloneYearResponse(
    201,
    {
      message: "Se clonaron algunos cursos.",
      cloned: 2,
      courses: [validCourse, { ...validCourse, id: "course-2" }],
    },
    5,
  );
  assert.equal(partial.ok, true);
  if (partial.ok) {
    assert.equal(partial.cloned, 2);
    assert.equal(partial.attempted, 5);
    assert.equal(partial.courses.length, 2);
  }
});

test("rechaza clonación masiva inválida y clasifica errores", () => {
  for (const [status, body] of [
    [200, { cloned: -1 }],
    [200, { cloned: 1 }],
    [200, { cloned: 1, courses: [{}] }],
    [401, null],
    [403, null],
    [422, null],
  ] as const) {
    const result = parseCloneYearResponse(status, body);
    assert.equal(result.ok, false);
  }
});

test("parsea la eliminación lógica exitosa", () => {
  const result = parseDeleteResponse(204, null);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.message, "Curso eliminado correctamente.");
  }
});

test("clasifica el rechazo de eliminación y sus errores", () => {
  const blocked = parseDeleteResponse(422, { error: "tiene inscriptos" });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.kind, "conflict");
    assert.equal(blocked.message, COURSE_DELETE_BLOCKED_MESSAGE);
  }

  const missing = parseDeleteResponse(404, null);
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.kind, "not_found");
  }

  const unauthorized = parseDeleteResponse(401, null);
  assert.equal(unauthorized.ok, false);
  if (!unauthorized.ok) {
    assert.equal(unauthorized.kind, "unauthorized");
  }

  const forbidden = parseDeleteResponse(403, null);
  assert.equal(forbidden.ok, false);
  if (!forbidden.ok) {
    assert.equal(forbidden.kind, "forbidden");
  }

  const failed = parseDeleteResponse(500, null);
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.message, COURSE_OPERATION_ERROR_MESSAGE);
  }
});

test("listCoursesPage hace GET con Bearer, paginación y contrato esperado", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        data: [validCourse],
        meta: { ...validMeta, per_page: 100 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listCoursesPage("jwt-token", 2, {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(COURSES_PAGE_SIZE, 100);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/courses?per_page=100&page=2",
  );
  assert.equal(call.init?.method, "GET");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("accept"), "application/json");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.courses.length, 1);
    assert.equal(result.meta.perPage, 100);
  }
});

test("listAllCourses recorre meta.last_page y concatena los resultados", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = input.toString();
    calls.push(url);
    const page = new URL(url).searchParams.get("page") ?? "1";
    const data =
      page === "1"
        ? [validCourse]
        : [{ ...validCourse, id: "course-2" }];

    return new Response(
      JSON.stringify({
        data,
        meta: {
          current_page: Number(page),
          last_page: 2,
          per_page: 100,
          total: 2,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllCourses("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0] ?? "", /page=1/);
  assert.match(calls[1] ?? "", /page=2/);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.courses.length, 2);
    assert.equal(result.courses[1]?.id, "course-2");
    assert.deepEqual(result.meta, {
      currentPage: 1,
      lastPage: 2,
      perPage: 100,
      total: 2,
    });
  }
});

test("listAllCourses no devuelve datos parciales si falla una página", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = input.toString();
    const page = new URL(url).searchParams.get("page");

    if (page === "1") {
      return new Response(
        JSON.stringify({
          data: [validCourse],
          meta: { current_page: 1, last_page: 2, per_page: 100, total: 2 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response("{}", { status: 500 });
  };

  const result = await listAllCourses("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, COURSES_LOAD_ERROR_MESSAGE);
  }
});

test("listAllCourses corta si supera el tope de 100 páginas", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    calls.push(input.toString());

    return new Response(
      JSON.stringify({
        data: [validCourse],
        meta: { current_page: 1, last_page: 101, per_page: 100, total: 101 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllCourses("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(COURSES_MAX_PAGES, 100);
  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, COURSES_LOAD_ERROR_MESSAGE);
  }
});

test("sin configuración o con red caída no llama a fetch y falla", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", { status: 200 });
  };

  const missingConfig = await listAllCourses("jwt-token", {
    baseUrl: "",
    fetchImpl,
  });
  assert.equal(calls.length, 0);
  assert.equal(missingConfig.ok, false);

  const network = await listCoursesPage("jwt-token", 1, {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(network.ok, false);
});

test("un cuerpo no JSON o un 401 se clasifican correctamente", async () => {
  const invalidJson = await listCoursesPage("jwt-token", 1, {
    baseUrl: "http://api.test",
    fetchImpl: async () =>
      new Response("no-json", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
  });
  assert.equal(invalidJson.ok, false);

  const unauthorized = await listCoursesPage("jwt-token", 1, {
    baseUrl: "http://api.test",
    fetchImpl: async () => new Response("{}", { status: 401 }),
  });
  assert.equal(unauthorized.ok, false);
  if (!unauthorized.ok) {
    assert.equal(unauthorized.kind, "unauthorized");
  }
});

test("parsea el detalle de un curso y clasifica sus errores", () => {
  const success = parseCourseResponse(200, {
    data: validCourse,
    message: "Curso encontrado.",
  });
  assert.equal(success.ok, true);
  if (success.ok) {
    assert.equal(success.course.id, validCourse.id);
    assert.equal(success.message, "Curso encontrado.");
  }

  for (const [status, expected] of [
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [500, "failed"],
  ] as const) {
    const result = parseCourseResponse(status, null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, expected);
      if (status === 404) {
        assert.equal(result.message, COURSE_NOT_FOUND_MESSAGE);
      }
      if (status === 500) {
        assert.equal(result.message, COURSES_LOAD_ERROR_MESSAGE);
      }
    }
  }

  assert.equal(parseCourseResponse(200, { data: {} }).ok, false);
  assert.equal(
    parseCourseResponse(200, { data: validCourse, errors: ["algo"] }).ok,
    false,
  );
});

test("getCourse hace GET al detalle con Bearer y ruta codificada", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ data: validCourse, message: "Curso encontrado." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await getCourse("jwt-token", "course 1", {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/courses/course%201",
  );
  assert.equal(call.init?.method, "GET");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.course.id, validCourse.id);
  }
});

test("getCourseReport hace GET al reporte del curso y parsea el total", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        header: { totalInscriptions: 1 },
        list: [{ lastname: "Pérez", name: "Ana" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await getCourseReport("jwt-token", "course-1", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/courses/course-1/report",
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.report.totalInscriptions, 1);
    assert.equal(result.report.rows.length, 1);
  }
});

test("getCourse y getCourseReport fallan sin datos parciales ante red o timeout", async () => {
  const network = await getCourse("jwt-token", "course-1", {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(network.ok, false);
  if (!network.ok) {
    assert.equal(network.message, COURSES_LOAD_ERROR_MESSAGE);
  }

  const timeout = await getCourseReport("jwt-token", "course-1", {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new DOMException("timed out", "TimeoutError");
    },
  });
  assert.equal(timeout.ok, false);
  if (!timeout.ok) {
    assert.equal(timeout.message, COURSE_REPORT_ERROR_MESSAGE);
  }
});

test("getCourse y getCourseReport clasifican 401, 403 y 404", async () => {
  for (const [status, expected] of [
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
  ] as const) {
    const detail = await getCourse("jwt-token", "course-1", {
      baseUrl: "http://api.test",
      fetchImpl: async () => new Response("{}", { status }),
    });
    assert.equal(detail.ok, false);
    if (!detail.ok) {
      assert.equal(detail.kind, expected);
    }

    const report = await getCourseReport("jwt-token", "course-1", {
      baseUrl: "http://api.test",
      fetchImpl: async () => new Response("{}", { status }),
    });
    assert.equal(report.ok, false);
    if (!report.ok) {
      assert.equal(report.kind, expected);
    }
  }
});

test("createCourse hace POST con el payload exacto", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(JSON.stringify({ data: validCourse }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await createCourse("jwt-token", validPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.ok(call);
  assert.equal(call.input.toString(), "http://api.test/api/courses/create");
  assert.equal(call.init?.method, "POST");
  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init?.body)), validPayload);
  if (result.ok) {
    assert.equal(result.course?.code, validCourse.code);
  }
});

test("updateCourse hace PATCH y devuelve errores de validación traducidos", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        errors: { year: ["The year field is required."] },
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await updateCourse("jwt-token", "course-1", validPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/courses/course-1",
  );
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(result.fieldErrors?.year, "Ingresá un año académico de cuatro dígitos.");
  }
});

test("deleteCourse hace DELETE y distingue 204 de 422", async () => {
  const calls: FetchCall[] = [];
  const success = await deleteCourse("jwt-token", "course-1", {
    baseUrl: "http://api.test",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/courses/course-1",
  );
  assert.equal(calls[0]?.init?.method, "DELETE");
  assert.equal(success.ok, true);

  const blocked = await deleteCourse("jwt-token", "course-1", {
    baseUrl: "http://api.test",
    fetchImpl: async () =>
      new Response(JSON.stringify({ error: "inscriptos" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.kind, "conflict");
  }
});

test("cloneCourse hace POST con el año destino", async () => {
  const calls: FetchCall[] = [];
  const result = await cloneCourse("jwt-token", "course-1", 2027, {
    baseUrl: "http://api.test",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return new Response(JSON.stringify({ data: validCourse }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/courses/course-1/clone",
  );
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { year: 2027 });
  assert.equal(result.ok, true);

  const conflict = await cloneCourse("jwt-token", "course-1", 2027, {
    baseUrl: "http://api.test",
    fetchImpl: async () => new Response("{}", { status: 422 }),
  });
  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.kind, "conflict");
  }
});

test("cloneCoursesByYear hace POST por año e informa el resultado", async () => {
  const calls: FetchCall[] = [];
  const result = await cloneCoursesByYear(
    "jwt-token",
    2025,
    {
      baseUrl: "http://api.test",
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return new Response(
          JSON.stringify({
            message: "Se clonaron dos cursos.",
            cloned: 2,
            courses: [validCourse, { ...validCourse, id: "course-2" }],
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      },
    },
    5,
  );

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/courses/clone/2025",
  );
  assert.equal(calls[0]?.init?.method, "POST");
  assert.equal(calls[0]?.init?.body, undefined);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.cloned, 2);
    assert.equal(result.attempted, 5);
  }
});

test("setCourseStatus usa show y hide según el estado", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ data: validCourse }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await setCourseStatus("jwt-token", "course-1", "active", {
    baseUrl: "http://api.test",
    fetchImpl,
  });
  await setCourseStatus("jwt-token", "course-1", "inactive", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/courses/course-1/show",
  );
  assert.equal(
    calls[1]?.input.toString(),
    "http://api.test/api/courses/course-1/hide",
  );
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.equal(calls[1]?.init?.method, "PATCH");
});

test("las escrituras clasifican 5xx, red y timeout sin éxito", async () => {
  const server = await createCourse("jwt-token", validPayload, {
    baseUrl: "http://api.test",
    fetchImpl: async () => new Response("{}", { status: 500 }),
  });
  assert.equal(server.ok, false);

  const network = await updateCourse("jwt-token", "course-1", validPayload, {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(network.ok, false);

  const timeout = await setCourseStatus("jwt-token", "course-1", "inactive", {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new DOMException("timed out", "TimeoutError");
    },
  });
  assert.equal(timeout.ok, false);
});

test("parseCourseMutationResponse resuelve 422 de validación y de conflicto", () => {
  const validation = parseCourseMutationResponse(422, {
    errors: { division: ["The division field is required."] },
  });
  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.equal(validation.kind, "validation");
    assert.equal(
      validation.fieldErrors?.division,
      "Ingresá una división de 1 a 10 caracteres.",
    );
  }

  const conflict = parseCourseMutationResponse(
    422,
    {},
    { conflictOn422: true },
  );
  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.kind, "conflict");
  }
});
