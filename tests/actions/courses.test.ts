import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_DELETE_BLOCKED_MESSAGE,
  COURSE_OPERATION_ERROR_MESSAGE,
} from "../../app/lib/api/courses.ts";
import {
  COURSE_NO_CLONES_MESSAGE,
  COURSE_ORIGIN_YEAR_MESSAGE,
  cloneCourseActionCore,
  cloneYearActionCore,
  createCourseActionCore,
  deleteCourseActionCore,
  setCourseStatusActionCore,
  updateCourseActionCore,
} from "../../app/lib/courses/action-core.ts";
import type {
  CloneCourseActionDependencies,
  CloneYearActionDependencies,
  CreateCourseActionDependencies,
  DeleteCourseActionDependencies,
  SetCourseStatusActionDependencies,
  UpdateCourseActionDependencies,
} from "../../app/lib/courses/action-core.ts";
import { COURSE_VALIDATION_MESSAGES } from "../../app/lib/validation/course.ts";
import type {
  Course,
  CourseActionFailure,
  CourseActionResult,
  CourseCloneYearResult,
  CourseFormActionState,
  CoursePayload,
} from "../../app/lib/courses/types.ts";

const INITIAL_STATE: CourseFormActionState = {
  status: "idle",
  message: "",
};

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

function createFormData(
  values: Record<string, string> = {},
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

const validForm = createFormData({
  year: "2026",
  studyYear: "1",
  division: "1",
  cycle: "basic",
  speciality: "informatics",
  shift: "morning",
  maxCapacity: "30",
});

class RedirectSignal extends Error {
  readonly path: string;

  constructor(path: string) {
    super(path);
    this.path = path;
  }
}

function makeDependencies(
  createCourse: (
    token: string,
    payload: CoursePayload,
  ) => Promise<CourseActionResult>,
  overrides: Partial<CreateCourseActionDependencies> = {},
): CreateCourseActionDependencies {
  return {
    currentYear: 2026,
    getAccess: async () => ({
      status: "ok",
      token: "jwt-token",
      claims: {
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMINISTRADOR",
        exp: 9_999_999_999,
      },
    }),
    createCourse,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("aplica defaults, valida y redirige con el código creado", async () => {
  const calls: Array<{ token: string; payload: CoursePayload }> = [];
  const revalidated: string[] = [];
  const dependencies = makeDependencies(
    async (token, payload) => {
      calls.push({ token, payload });
      return {
        ok: true,
        message: "ok",
        course: makeCourse(),
      };
    },
    {
      revalidatePath: (path) => revalidated.push(path),
    },
  );

  const form = createFormData({ division: "A", maxCapacity: "20" });

  await assert.rejects(
    () => createCourseActionCore(INITIAL_STATE, form, dependencies),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/dashboard/courses?created=2026-1-1-BAS-INF-M",
  );

  assert.deepEqual(calls, [
    {
      token: "jwt-token",
      payload: {
        year: 2026,
        studyYear: 1,
        division: "A",
        cycle: "basic",
        speciality: "basic",
        shift: "morning",
        maxCapacity: 20,
      },
    },
  ]);
  assert.deepEqual(revalidated, ["/dashboard/courses"]);
});

test("no llama a la API ante errores locales y conserva los valores", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const dependencies = makeDependencies(
    async () => {
      apiCalls += 1;
      return { ok: true, message: "", course: makeCourse() };
    },
    {
      getAccess: async () => {
        accessCalls += 1;
        return {
          status: "ok",
          token: "jwt-token",
          claims: {
            sub: "user-1",
            email: "admin@example.com",
            role: "ADMINISTRADOR",
            exp: 9_999_999_999,
          },
        };
      },
    },
  );

  const state = await createCourseActionCore(
    INITIAL_STATE,
    createFormData(),
    dependencies,
  );

  assert.equal(state.status, "validation");
  assert.equal(state.values?.year, "2026");
  assert.equal(state.values?.studyYear, "1");
  assert.ok(state.fieldErrors?.division);
  assert.ok(state.fieldErrors?.maxCapacity);
  assert.equal(accessCalls, 0);
  assert.equal(apiCalls, 0);
});

test("no llama a la API si el rol no tiene acceso", async () => {
  let apiCalls = 0;
  const state = await createCourseActionCore(
    INITIAL_STATE,
    validForm,
    makeDependencies(
      async () => {
        apiCalls += 1;
        return { ok: true, message: "", course: makeCourse() };
      },
      {
        getAccess: async () => ({
          status: "forbidden",
          message: "No tenés permisos para acceder a este módulo.",
        }),
      },
    ),
  );

  assert.equal(state.status, "forbidden");
  assert.equal(apiCalls, 0);
  assert.equal(state.values?.year, "2026");
});

test("devuelve los errores de validación del backend junto a los valores", async () => {
  const state = await createCourseActionCore(
    INITIAL_STATE,
    validForm,
    makeDependencies(async () => ({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los datos.",
      fieldErrors: { year: "Año inválido." },
    })),
  );

  assert.equal(state.status, "validation");
  assert.equal(state.message, "Revisá los datos.");
  assert.deepEqual(state.fieldErrors, { year: "Año inválido." });
  assert.equal(state.values?.division, "1");
});

test("clasifica conflicto, denegado, inexistente y error de la API", async () => {
  const cases: Array<
    [CourseActionFailure, CourseFormActionState["status"]]
  > = [
    [
      {
        ok: false,
        kind: "conflict",
        status: 422,
        message: "Ya existe.",
      },
      "conflict",
    ],
    [
      {
        ok: false,
        kind: "forbidden",
        status: 403,
        message: "Denegado.",
      },
      "forbidden",
    ],
    [
      {
        ok: false,
        kind: "not_found",
        status: 404,
        message: "No existe.",
      },
      "not_found",
    ],
    [
      {
        ok: false,
        kind: "failed",
        status: 500,
        message: "Error.",
      },
      "error",
    ],
  ];

  for (const [failure, expected] of cases) {
    const state = await createCourseActionCore(
      INITIAL_STATE,
      validForm,
      makeDependencies(async () => failure),
    );

    assert.equal(state.status, expected);
    assert.equal(state.message, failure.message);
    assert.equal(state.values?.year, "2026");
  }
});

test("redirige a session-expired ante un 401 de la API", async () => {
  await assert.rejects(
    () =>
      createCourseActionCore(
        INITIAL_STATE,
        validForm,
        makeDependencies(async () => ({
          ok: false,
          kind: "unauthorized",
          status: 401,
          message: "Sesión vencida.",
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

function makeEditFormData(
  overrides: Record<string, string> = {},
): FormData {
  const formData = createFormData({
    courseId: "course-1",
    currentCapacity: "12",
    originalYear: "2026",
    from: "detail",
    ...Object.fromEntries(
      Object.entries({
        year: "2026",
        studyYear: "1",
        division: "1",
        cycle: "basic",
        speciality: "informatics",
        shift: "morning",
        maxCapacity: "30",
        ...overrides,
      }),
    ),
  });

  return formData;
}

function makeEditDependencies(
  updateCourse: (
    token: string,
    courseId: string,
    payload: CoursePayload,
  ) => Promise<CourseActionResult>,
  overrides: Partial<UpdateCourseActionDependencies> = {},
): UpdateCourseActionDependencies {
  return {
    currentYear: 2026,
    getAccess: async () => ({
      status: "ok",
      token: "jwt-token",
      claims: {
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMINISTRADOR",
        exp: 9_999_999_999,
      },
    }),
    updateCourse,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("edita desde el detalle, envía el PATCH y revalida lista y detalle", async () => {
  const calls: Array<{
    token: string;
    courseId: string;
    payload: CoursePayload;
  }> = [];
  const revalidated: string[] = [];
  const dependencies = makeEditDependencies(
    async (token, courseId, payload) => {
      calls.push({ token, courseId, payload });
      return {
        ok: true,
        message: "ok",
        course: makeCourse({ code: "2026-2-1-SUP-ELE-N" }),
      };
    },
    {
      revalidatePath: (path) => revalidated.push(path),
    },
  );

  await assert.rejects(
    () =>
      updateCourseActionCore(INITIAL_STATE, makeEditFormData(), dependencies),
    (error) =>
      error instanceof RedirectSignal &&
      error.path ===
        "/dashboard/courses/course-1?updated=2026-2-1-SUP-ELE-N",
  );

  assert.deepEqual(calls, [
    {
      token: "jwt-token",
      courseId: "course-1",
      payload: {
        year: 2026,
        studyYear: 1,
        division: "1",
        cycle: "basic",
        speciality: "informatics",
        shift: "morning",
        maxCapacity: 30,
      },
    },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/courses",
    "/dashboard/courses/course-1",
  ]);
});

test("la edición sin código devuelve Sin código en el aviso y el retorno", async () => {
  await assert.rejects(
    () =>
      updateCourseActionCore(
        INITIAL_STATE,
        makeEditFormData(),
        makeEditDependencies(async () => ({
          ok: true,
          message: "ok",
          course: makeCourse({ code: null }),
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path ===
        "/dashboard/courses/course-1?updated=Sin%20c%C3%B3digo",
  );
});

test("edita desde el listado y conserva el retorno saneado", async () => {
  await assert.rejects(
    () =>
      updateCourseActionCore(
        INITIAL_STATE,
        makeEditFormData({
          from: "list",
          returnTo: "/dashboard/courses?q=basico&page=2",
        }),
        makeEditDependencies(async () => ({
          ok: true,
          message: "ok",
          course: makeCourse({ code: "2026-1-1-BAS-INF-M" }),
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path ===
        "/dashboard/courses?q=basico&page=2&updated=2026-1-1-BAS-INF-M",
  );
});

test("rechaza editar un curso de año pasado sin llamar a la API", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const state = await updateCourseActionCore(
    INITIAL_STATE,
    makeEditFormData({ originalYear: "2025" }),
    makeEditDependencies(
      async () => {
        apiCalls += 1;
        return { ok: true, message: "", course: makeCourse() };
      },
      {
        getAccess: async () => {
          accessCalls += 1;
          return {
            status: "ok",
            token: "jwt-token",
            claims: {
              sub: "user-1",
              email: "admin@example.com",
              role: "ADMINISTRADOR",
              exp: 9_999_999_999,
            },
          };
        },
      },
    ),
  );

  assert.equal(state.status, "validation");
  assert.equal(
    state.fieldErrors?.year,
    "Solo se pueden editar cursos del año actual o futuros.",
  );
  assert.equal(accessCalls, 0);
  assert.equal(apiCalls, 0);
});

test("rechaza capacidad menor a la actual sin llamar a la API", async () => {
  let apiCalls = 0;
  const state = await updateCourseActionCore(
    INITIAL_STATE,
    makeEditFormData({ currentCapacity: "31" }),
    makeEditDependencies(async () => {
      apiCalls += 1;
      return { ok: true, message: "", course: makeCourse() };
    }),
  );

  assert.equal(state.status, "validation");
  assert.equal(
    state.fieldErrors?.maxCapacity,
    "La capacidad máxima no puede ser menor que la capacidad actual.",
  );
  assert.equal(apiCalls, 0);
});

test("conserva valores y errores de validación del backend", async () => {
  const state = await updateCourseActionCore(
    INITIAL_STATE,
    makeEditFormData(),
    makeEditDependencies(async () => ({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los datos.",
      fieldErrors: { division: "División inválida." },
    })),
  );

  assert.equal(state.status, "validation");
  assert.equal(state.message, "Revisá los datos.");
  assert.deepEqual(state.fieldErrors, { division: "División inválida." });
  assert.equal(state.values?.division, "1");
});

test("clasifica 404, 403, 5xx y 401 de la edición", async () => {
  const cases: Array<
    [CourseActionFailure, CourseFormActionState["status"]]
  > = [
    [
      {
        ok: false,
        kind: "not_found",
        status: 404,
        message: "No existe.",
      },
      "not_found",
    ],
    [
      {
        ok: false,
        kind: "forbidden",
        status: 403,
        message: "Denegado.",
      },
      "forbidden",
    ],
    [
      {
        ok: false,
        kind: "failed",
        status: 500,
        message: "Error.",
      },
      "error",
    ],
  ];

  for (const [failure, expected] of cases) {
    const state = await updateCourseActionCore(
      INITIAL_STATE,
      makeEditFormData(),
      makeEditDependencies(async () => failure),
    );

    assert.equal(state.status, expected);
    assert.equal(state.values?.year, "2026");
  }

  await assert.rejects(
    () =>
      updateCourseActionCore(
        INITIAL_STATE,
        makeEditFormData(),
        makeEditDependencies(async () => ({
          ok: false,
          kind: "unauthorized",
          status: 401,
          message: "Sesión vencida.",
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

test("falla si falta identificar el curso y no llama a la API", async () => {
  let apiCalls = 0;
  const state = await updateCourseActionCore(
    INITIAL_STATE,
    makeEditFormData({ courseId: "" }),
    makeEditDependencies(async () => {
      apiCalls += 1;
      return { ok: true, message: "", course: makeCourse() };
    }),
  );

  assert.equal(state.status, "error");
  assert.equal(apiCalls, 0);
});

function makeDeleteFormData(
  overrides: Record<string, string> = {},
): FormData {
  return createFormData({
    courseId: "course-1",
    currentCapacity: "0",
    ...overrides,
  });
}

function makeDeleteDependencies(
  deleteCourse: (
    token: string,
    courseId: string,
  ) => Promise<CourseActionResult>,
  overrides: Partial<DeleteCourseActionDependencies> = {},
): DeleteCourseActionDependencies {
  return {
    getAccess: async () => ({
      status: "ok",
      token: "jwt-token",
      claims: {
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMINISTRADOR",
        exp: 9_999_999_999,
      },
    }),
    deleteCourse,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("elimina lógicamente con capacidad cero y revalida lista y detalle", async () => {
  const calls: Array<{ token: string; courseId: string }> = [];
  const revalidated: string[] = [];
  const result = await deleteCourseActionCore(
    null,
    makeDeleteFormData(),
    makeDeleteDependencies(
      async (token, courseId) => {
        calls.push({ token, courseId });
        return { ok: true, message: "Curso eliminado correctamente." };
      },
      {
        revalidatePath: (path) => revalidated.push(path),
      },
    ),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [{ token: "jwt-token", courseId: "course-1" }]);
  assert.deepEqual(revalidated, [
    "/dashboard/courses",
    "/dashboard/courses/course-1",
  ]);
});

test("bloquea eliminar con inscriptos sin llamar a la API", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const result = await deleteCourseActionCore(
    null,
    makeDeleteFormData({ currentCapacity: "12" }),
    makeDeleteDependencies(
      async () => {
        apiCalls += 1;
        return { ok: true, message: "" };
      },
      {
        getAccess: async () => {
          accessCalls += 1;
          return {
            status: "ok",
            token: "jwt-token",
            claims: {
              sub: "user-1",
              email: "admin@example.com",
              role: "ADMINISTRADOR",
              exp: 9_999_999_999,
            },
          };
        },
      },
    ),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "conflict");
    assert.equal(result.message, COURSE_DELETE_BLOCKED_MESSAGE);
  }
  assert.equal(accessCalls, 0);
  assert.equal(apiCalls, 0);
});

test("bloquea eliminar sin curso identificado o con rol denegado", async () => {
  const missing = await deleteCourseActionCore(
    null,
    makeDeleteFormData({ courseId: "" }),
    makeDeleteDependencies(async () => ({ ok: true, message: "" })),
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.message, COURSE_OPERATION_ERROR_MESSAGE);
  }

  let apiCalls = 0;
  const forbidden = await deleteCourseActionCore(
    null,
    makeDeleteFormData(),
    makeDeleteDependencies(
      async () => {
        apiCalls += 1;
        return { ok: true, message: "" };
      },
      {
        getAccess: async () => ({
          status: "forbidden",
          message: "Denegado.",
        }),
      },
    ),
  );
  assert.equal(forbidden.ok, false);
  if (!forbidden.ok) {
    assert.equal(forbidden.kind, "forbidden");
  }
  assert.equal(apiCalls, 0);
});

test("clasifica el rechazo de la API al eliminar y redirige ante 401", async () => {
  let revalidated = 0;
  const conflict = await deleteCourseActionCore(
    null,
    makeDeleteFormData(),
    makeDeleteDependencies(
      async () => ({
        ok: false,
        kind: "conflict",
        status: 422,
        message: COURSE_DELETE_BLOCKED_MESSAGE,
      }),
      {
        revalidatePath: () => {
          revalidated += 1;
        },
      },
    ),
  );
  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.kind, "conflict");
    assert.equal(conflict.message, COURSE_DELETE_BLOCKED_MESSAGE);
  }
  assert.equal(revalidated, 0);

  const failed = await deleteCourseActionCore(
    null,
    makeDeleteFormData(),
    makeDeleteDependencies(async () => ({
      ok: false,
      kind: "failed",
      status: 500,
      message: COURSE_OPERATION_ERROR_MESSAGE,
    })),
  );
  assert.equal(failed.ok, false);

  await assert.rejects(
    () =>
      deleteCourseActionCore(
        null,
        makeDeleteFormData(),
        makeDeleteDependencies(async () => ({
          ok: false,
          kind: "unauthorized",
          status: 401,
          message: "Sesión vencida.",
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

function makeStatusFormData(
  overrides: Record<string, string> = {},
): FormData {
  return createFormData({
    courseId: "course-1",
    status: "active",
    currentCapacity: "12",
    ...overrides,
  });
}

function makeStatusDependencies(
  setCourseStatus: (
    token: string,
    courseId: string,
    status: "active" | "inactive",
  ) => Promise<CourseActionResult>,
  overrides: Partial<SetCourseStatusActionDependencies> = {},
): SetCourseStatusActionDependencies {
  return {
    getAccess: async () => ({
      status: "ok",
      token: "jwt-token",
      claims: {
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMINISTRADOR",
        exp: 9_999_999_999,
      },
    }),
    setCourseStatus,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("activa y desactiva con capacidad cero y revalida lista y detalle", async () => {
  const calls: Array<{
    token: string;
    courseId: string;
    status: "active" | "inactive";
  }> = [];
  const revalidated: string[] = [];
  const dependencies = makeStatusDependencies(
    async (token, courseId, status) => {
      calls.push({ token, courseId, status });
      return {
        ok: true,
        message: "Curso actualizado.",
        course: makeCourse({ status }),
      };
    },
    {
      revalidatePath: (path) => revalidated.push(path),
    },
  );

  const active = await setCourseStatusActionCore(
    null,
    makeStatusFormData(),
    dependencies,
  );
  assert.equal(active.ok, true);

  const inactive = await setCourseStatusActionCore(
    null,
    makeStatusFormData({ status: "inactive", currentCapacity: "0" }),
    dependencies,
  );
  assert.equal(inactive.ok, true);

  assert.deepEqual(calls, [
    { token: "jwt-token", courseId: "course-1", status: "active" },
    { token: "jwt-token", courseId: "course-1", status: "inactive" },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/courses",
    "/dashboard/courses/course-1",
    "/dashboard/courses",
    "/dashboard/courses/course-1",
  ]);
});

test("bloquea desactivar con inscriptos y estados inválidos", async () => {
  let apiCalls = 0;
  const blocked = await setCourseStatusActionCore(
    null,
    makeStatusFormData({ status: "inactive", currentCapacity: "1" }),
    makeStatusDependencies(async () => {
      apiCalls += 1;
      return { ok: true, message: "" };
    }),
  );
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.kind, "conflict");
  }
  assert.equal(apiCalls, 0);

  const invalid = await setCourseStatusActionCore(
    null,
    makeStatusFormData({ status: "unknown" }),
    makeStatusDependencies(async () => {
      apiCalls += 1;
      return { ok: true, message: "" };
    }),
  );
  assert.equal(invalid.ok, false);
  assert.equal(apiCalls, 0);
});

test("un 5xx de estado se devuelve sin revalidar y un 401 redirige", async () => {
  let revalidateCalls = 0;
  const failed = await setCourseStatusActionCore(
    null,
    makeStatusFormData(),
    makeStatusDependencies(
      async () => ({
        ok: false,
        kind: "failed",
        status: 500,
        message: COURSE_OPERATION_ERROR_MESSAGE,
      }),
      {
        revalidatePath: () => {
          revalidateCalls += 1;
        },
      },
    ),
  );
  assert.equal(failed.ok, false);
  assert.equal(revalidateCalls, 0);

  await assert.rejects(
    () =>
      setCourseStatusActionCore(
        null,
        makeStatusFormData(),
        makeStatusDependencies(async () => ({
          ok: false,
          kind: "unauthorized",
          status: 401,
          message: "Sesión vencida.",
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

function makeCloneFormData(
  overrides: Record<string, string> = {},
): FormData {
  return createFormData({
    courseId: "course-1",
    year: "2027",
    ...overrides,
  });
}

function makeCloneDependencies(
  cloneCourse: (
    token: string,
    courseId: string,
    year: number,
  ) => Promise<CourseActionResult>,
  overrides: Partial<CloneCourseActionDependencies> = {},
): CloneCourseActionDependencies {
  return {
    currentYear: 2026,
    getAccess: async () => ({
      status: "ok",
      token: "jwt-token",
      claims: {
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMINISTRADOR",
        exp: 9_999_999_999,
      },
    }),
    cloneCourse,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("clona al año destino, conserva configuración y devuelve el código", async () => {
  const calls: Array<{
    token: string;
    courseId: string;
    year: number;
  }> = [];
  const revalidated: string[] = [];
  const cloned = makeCourse({
    id: "course-2",
    code: "2027-1-1-BAS-INF-M",
    year: 2027,
    currentCapacity: 0,
    availablePlaces: 30,
    status: "inactive",
    maxCapacity: 30,
  });
  const result = await cloneCourseActionCore(
    null,
    makeCloneFormData(),
    makeCloneDependencies(
      async (token, courseId, year) => {
        calls.push({ token, courseId, year });
        return { ok: true, message: "Curso clonado.", course: cloned };
      },
      {
        revalidatePath: (path) => revalidated.push(path),
      },
    ),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.course?.code, "2027-1-1-BAS-INF-M");
    assert.equal(result.course?.currentCapacity, 0);
    assert.equal(result.course?.maxCapacity, 30);
    assert.equal(result.course?.status, "inactive");
    assert.equal(result.code, "2027-1-1-BAS-INF-M");
  }

  assert.deepEqual(calls, [
    { token: "jwt-token", courseId: "course-1", year: 2027 },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/courses",
    "/dashboard/courses/course-2",
  ]);
});

test("acepta el año actual y rechaza años pasados o inválidos sin API", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const dependencies = makeCloneDependencies(
    async () => {
      apiCalls += 1;
      return { ok: true, message: "", course: makeCourse() };
    },
    {
      getAccess: async () => {
        accessCalls += 1;
        return {
          status: "ok",
          token: "jwt-token",
          claims: {
            sub: "user-1",
            email: "admin@example.com",
            role: "ADMINISTRADOR",
            exp: 9_999_999_999,
          },
        };
      },
    },
  );

  const current = await cloneCourseActionCore(
    null,
    makeCloneFormData({ year: "2026" }),
    dependencies,
  );
  assert.equal(current.ok, true);
  assert.equal(apiCalls, 1);

  for (const year of ["2025", "", "abc", "2027.5"]) {
    const state = await cloneCourseActionCore(
      null,
      makeCloneFormData({ year }),
      dependencies,
    );

    assert.equal(state.ok, false);
    if (!state.ok) {
      assert.equal(state.kind, "validation");
      assert.equal(
        state.fieldErrors?.year,
        COURSE_VALIDATION_MESSAGES.yearPast,
      );
    }
  }

  assert.equal(apiCalls, 1);
  assert.equal(accessCalls, 1);
});

test("falla sin curso identificado o con rol denegado", async () => {
  let apiCalls = 0;
  const missing = await cloneCourseActionCore(
    null,
    makeCloneFormData({ courseId: "" }),
    makeCloneDependencies(async () => {
      apiCalls += 1;
      return { ok: true, message: "", course: makeCourse() };
    }),
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.message, COURSE_OPERATION_ERROR_MESSAGE);
  }

  const forbidden = await cloneCourseActionCore(
    null,
    makeCloneFormData(),
    makeCloneDependencies(
      async () => {
        apiCalls += 1;
        return { ok: true, message: "", course: makeCourse() };
      },
      {
        getAccess: async () => ({
          status: "forbidden",
          message: "Denegado.",
        }),
      },
    ),
  );
  assert.equal(forbidden.ok, false);
  if (!forbidden.ok) {
    assert.equal(forbidden.kind, "forbidden");
  }
  assert.equal(apiCalls, 0);
});

test("clasifica conflicto, 5xx y 401 de la clonación", async () => {
  const conflict = await cloneCourseActionCore(
    null,
    makeCloneFormData(),
    makeCloneDependencies(async () => ({
      ok: false,
      kind: "conflict",
      status: 422,
      message: "Ya existe.",
    })),
  );
  assert.equal(conflict.ok, false);
  if (!conflict.ok) {
    assert.equal(conflict.kind, "conflict");
  }

  const failed = await cloneCourseActionCore(
    null,
    makeCloneFormData(),
    makeCloneDependencies(async () => ({
      ok: false,
      kind: "failed",
      status: 500,
      message: COURSE_OPERATION_ERROR_MESSAGE,
    })),
  );
  assert.equal(failed.ok, false);

  await assert.rejects(
    () =>
      cloneCourseActionCore(
        null,
        makeCloneFormData(),
        makeCloneDependencies(async () => ({
          ok: false,
          kind: "unauthorized",
          status: 401,
          message: "Sesión vencida.",
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

function makeCloneYearFormData(
  overrides: Record<string, string> = {},
): FormData {
  return createFormData({
    oldYear: "2025",
    attempted: "5",
    ...overrides,
  });
}

function makeCloneYearDependencies(
  cloneCoursesByYear: (
    token: string,
    oldYear: number,
    attempted: number,
  ) => Promise<CourseCloneYearResult>,
  overrides: Partial<CloneYearActionDependencies> = {},
): CloneYearActionDependencies {
  return {
    currentYear: 2026,
    getAccess: async () => ({
      status: "ok",
      token: "jwt-token",
      claims: {
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMINISTRADOR",
        exp: 9_999_999_999,
      },
    }),
    cloneCoursesByYear,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("clona un año y devuelve cloned, intentados y cursos creados", async () => {
  const calls: Array<{
    token: string;
    oldYear: number;
    attempted: number;
  }> = [];
  const revalidated: string[] = [];
  const created = [
    makeCourse({ id: "new-1", code: "2026-1-1-BAS-INF-M" }),
    makeCourse({ id: "new-2", code: "2026-2-1-SUP-ELE-N" }),
  ];
  const result = await cloneYearActionCore(
    null,
    makeCloneYearFormData(),
    makeCloneYearDependencies(
      async (token, oldYear, attempted) => {
        calls.push({ token, oldYear, attempted });
        return {
          ok: true,
          message: "Se clonaron dos cursos.",
          cloned: 2,
          attempted,
          courses: created,
        };
      },
      {
        revalidatePath: (path) => revalidated.push(path),
      },
    ),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.cloned, 2);
    assert.equal(result.attempted, 5);
    assert.equal(result.courses.length, 2);
    assert.equal(result.message, "Se clonaron dos cursos.");
  }

  assert.deepEqual(calls, [
    { token: "jwt-token", oldYear: 2025, attempted: 5 },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/courses",
    "/dashboard/courses/new-1",
    "/dashboard/courses/new-2",
  ]);
});

test("informa cero cursos creados con el mensaje fijo", async () => {
  const revalidated: string[] = [];
  const result = await cloneYearActionCore(
    null,
    makeCloneYearFormData(),
    makeCloneYearDependencies(
      async (_token, _oldYear, attempted) => ({
        ok: true,
        message: "Mensaje del backend.",
        cloned: 0,
        attempted,
        courses: [],
      }),
      {
        revalidatePath: (path) => revalidated.push(path),
      },
    ),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.cloned, 0);
    assert.equal(result.message, COURSE_NO_CLONES_MESSAGE);
  }
  assert.deepEqual(revalidated, ["/dashboard/courses"]);
});

test("rechaza año actual, futuro o inválido sin llamar a la API", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const dependencies = makeCloneYearDependencies(
    async () => {
      apiCalls += 1;
      return {
        ok: true,
        message: "",
        cloned: 0,
        attempted: 0,
        courses: [],
      };
    },
    {
      getAccess: async () => {
        accessCalls += 1;
        return {
          status: "ok",
          token: "jwt-token",
          claims: {
            sub: "user-1",
            email: "admin@example.com",
            role: "ADMINISTRADOR",
            exp: 9_999_999_999,
          },
        };
      },
    },
  );

  for (const oldYear of ["2026", "2027", "", "abc"]) {
    const result = await cloneYearActionCore(
      null,
      makeCloneYearFormData({ oldYear }),
      dependencies,
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, "validation");
      assert.equal(result.message, COURSE_ORIGIN_YEAR_MESSAGE);
    }
  }

  assert.equal(apiCalls, 0);
  assert.equal(accessCalls, 0);
});

test("no llama a la API si el rol no tiene acceso", async () => {
  let apiCalls = 0;
  const result = await cloneYearActionCore(
    null,
    makeCloneYearFormData(),
    makeCloneYearDependencies(
      async () => {
        apiCalls += 1;
        return {
          ok: true,
          message: "",
          cloned: 0,
          attempted: 0,
          courses: [],
        };
      },
      {
        getAccess: async () => ({
          status: "forbidden",
          message: "Denegado.",
        }),
      },
    ),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
  }
  assert.equal(apiCalls, 0);
});

test("refresca el listado ante error y redirige ante 401", async () => {
  let revalidated = 0;
  const failed = await cloneYearActionCore(
    null,
    makeCloneYearFormData(),
    makeCloneYearDependencies(
      async () => ({
        ok: false,
        kind: "failed",
        status: 500,
        message: COURSE_OPERATION_ERROR_MESSAGE,
      }),
      {
        revalidatePath: () => {
          revalidated += 1;
        },
      },
    ),
  );
  assert.equal(failed.ok, false);
  assert.equal(revalidated, 1);

  await assert.rejects(
    () =>
      cloneYearActionCore(
        null,
        makeCloneYearFormData(),
        makeCloneYearDependencies(async () => ({
          ok: false,
          kind: "unauthorized",
          status: 401,
          message: "Sesión vencida.",
        })),
      ),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

test("clasifica 404 en eliminación, estado y clonación individual", async () => {
  const deleted = await deleteCourseActionCore(
    null,
    makeDeleteFormData(),
    makeDeleteDependencies(async () => ({
      ok: false,
      kind: "not_found",
      status: 404,
      message: "No existe.",
    })),
  );
  assert.equal(deleted.ok, false);
  if (!deleted.ok) {
    assert.equal(deleted.kind, "not_found");
  }

  const status = await setCourseStatusActionCore(
    null,
    makeStatusFormData(),
    makeStatusDependencies(async () => ({
      ok: false,
      kind: "not_found",
      status: 404,
      message: "No existe.",
    })),
  );
  assert.equal(status.ok, false);
  if (!status.ok) {
    assert.equal(status.kind, "not_found");
  }

  const cloned = await cloneCourseActionCore(
    null,
    makeCloneFormData(),
    makeCloneDependencies(async () => ({
      ok: false,
      kind: "not_found",
      status: 404,
      message: "No existe.",
    })),
  );
  assert.equal(cloned.ok, false);
  if (!cloned.ok) {
    assert.equal(cloned.kind, "not_found");
  }
});

test("clasifica 403 de la API en estado y clonación masiva", async () => {
  const status = await setCourseStatusActionCore(
    null,
    makeStatusFormData(),
    makeStatusDependencies(async () => ({
      ok: false,
      kind: "forbidden",
      status: 403,
      message: "Denegado.",
    })),
  );
  assert.equal(status.ok, false);
  if (!status.ok) {
    assert.equal(status.kind, "forbidden");
  }

  const cloned = await cloneYearActionCore(
    null,
    makeCloneYearFormData(),
    makeCloneYearDependencies(async () => ({
      ok: false,
      kind: "forbidden",
      status: 403,
      message: "Denegado.",
    })),
  );
  assert.equal(cloned.ok, false);
  if (!cloned.ok) {
    assert.equal(cloned.kind, "forbidden");
  }
});
