import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createStudentActionCore,
  updateStudentActionCore,
  type CreateStudentActionDependencies,
  type StudentFormActionState,
  type UpdateStudentActionDependencies,
} from "../../app/lib/students/action-core.ts";
import type { StudentActionResult } from "../../app/lib/students/types.ts";
import type {
  StudentStorePayload,
  StudentUpdatePayload,
} from "../../app/lib/validation/students.ts";

const INITIAL_STATE: StudentFormActionState = {
  status: "idle",
  message: "",
  values: {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
    studentEmail: "",
    studentPhone: "",
    birthdate: "",
    gender: "",
    birthplace: "",
    address: "",
  },
};

function createFormData(values: Record<string, string> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

const validCreateForm = createFormData({
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
});

const validEditForm = createFormData({
  studentId: "uuid-1",
  firstName: "Lucas Andrés",
  lastName: "Pérez",
  studentEmail: "",
  studentPhone: "",
  birthdate: "2010-08-20",
  gender: "Masculino",
  birthplace: "",
  address: "",
});

class RedirectSignal extends Error {
  readonly path: string;
  constructor(path: string) {
    super(path);
    this.path = path;
  }
}

function makeCreateDeps(
  registerStudent: (
    token: string,
    payload: StudentStorePayload,
  ) => Promise<StudentActionResult>,
  overrides: Partial<CreateStudentActionDependencies> = {},
): CreateStudentActionDependencies {
  return {
    currentDate: new Date("2026-11-12T12:00:00"),
    getAccess: async () => ({ status: "ok", token: "jwt-token" }),
    registerStudent,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

function makeUpdateDeps(
  updateStudent: (
    token: string,
    studentId: string,
    payload: StudentUpdatePayload,
  ) => Promise<StudentActionResult>,
  overrides: Partial<UpdateStudentActionDependencies> = {},
): UpdateStudentActionDependencies {
  return {
    currentDate: new Date("2026-11-12T12:00:00"),
    getAccess: async () => ({ status: "ok", token: "jwt-token" }),
    updateStudent,
    redirect: (path) => {
      throw new RedirectSignal(path);
    },
    revalidatePath: () => {},
    ...overrides,
  };
}

test("el alta evita la solicitud si la validación local falla", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const deps = makeCreateDeps(
    async () => {
      apiCalls += 1;
      return { ok: true, message: "ok" };
    },
    {
      getAccess: async () => {
        accessCalls += 1;
        return { status: "ok", token: "jwt-token" };
      },
    },
  );

  const state = await createStudentActionCore(
    INITIAL_STATE,
    createFormData({ firstName: "Lucas" }),
    deps,
  );

  assert.equal(state.status, "validation");
  assert.ok(state.fieldErrors?.studentDni);
  assert.equal(state.values.firstName, "Lucas");
  assert.equal(accessCalls, 0);
  assert.equal(apiCalls, 0);
});

test("el alta exitosa revalida y redirige con aviso", async () => {
  const calls: Array<{ token: string; payload: StudentStorePayload }> = [];
  const revalidated: string[] = [];
  const deps = makeCreateDeps(
    async (token, payload) => {
      calls.push({ token, payload });
      return { ok: true, message: "Alumno registrado correctamente" };
    },
    { revalidatePath: (path) => revalidated.push(path) },
  );

  await assert.rejects(
    () => createStudentActionCore(INITIAL_STATE, validCreateForm, deps),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/dashboard/students?created=1",
  );

  assert.deepEqual(revalidated, ["/dashboard/students"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.token, "jwt-token");
  assert.equal(calls[0]?.payload.studentDni, "50123456");
  assert.equal(calls[0]?.payload.studentCuil, "20501234567");
});

test("el alta con 401 redirige a la sesión expirada", async () => {
  const deps = makeCreateDeps(async () => ({
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Sesión expirada",
  }));

  await assert.rejects(
    () => createStudentActionCore(INITIAL_STATE, validCreateForm, deps),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

test("el alta con 403 y 422 conserva valores", async () => {
  const forbidden = await createStudentActionCore(
    INITIAL_STATE,
    validCreateForm,
    makeCreateDeps(async () => ({
      ok: false,
      kind: "forbidden",
      status: 403,
      message: "No tenés permisos.",
    })),
  );
  const validation = await createStudentActionCore(
    INITIAL_STATE,
    validCreateForm,
    makeCreateDeps(async () => ({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los datos del formulario e intentá nuevamente.",
      fieldErrors: { studentDni: "El DNI ya está registrado." },
    })),
  );

  assert.equal(forbidden.status, "forbidden");
  assert.equal(forbidden.values.studentDni, "50123456");
  assert.equal(validation.status, "validation");
  assert.equal(validation.values.studentDni, "50123456");
  assert.equal(
    validation.fieldErrors?.studentDni,
    "El DNI ya está registrado.",
  );
});

test("la edición evita la solicitud si la validación local falla", async () => {
  let accessCalls = 0;
  let apiCalls = 0;
  const deps = makeUpdateDeps(
    async () => {
      apiCalls += 1;
      return { ok: true, message: "ok" };
    },
    {
      getAccess: async () => {
        accessCalls += 1;
        return { status: "ok", token: "jwt-token" };
      },
    },
  );

  const form = createFormData({
    studentId: "uuid-1",
    firstName: "",
    lastName: "Pérez",
    birthdate: "2010-08-20",
    gender: "Masculino",
  });

  const state = await updateStudentActionCore(INITIAL_STATE, form, deps);

  assert.equal(state.status, "validation");
  assert.ok(state.fieldErrors?.firstName);
  assert.equal(accessCalls, 0);
  assert.equal(apiCalls, 0);
});

test("la edición exitosa revalida listado y detalle y redirige con aviso", async () => {
  const calls: Array<{ token: string; id: string; payload: StudentUpdatePayload }> = [];
  const revalidated: string[] = [];
  const deps = makeUpdateDeps(
    async (token, studentId, payload) => {
      calls.push({ token, id: studentId, payload });
      return { ok: true, message: "Alumno actualizado correctamente" };
    },
    { revalidatePath: (path) => revalidated.push(path) },
  );

  await assert.rejects(
    () => updateStudentActionCore(INITIAL_STATE, validEditForm, deps),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/dashboard/students/uuid-1?updated=1",
  );

  assert.deepEqual(revalidated, [
    "/dashboard/students",
    "/dashboard/students/uuid-1",
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.id, "uuid-1");
  assert.equal(calls[0]?.payload.studentEmail, null);
  assert.equal("studentDni" in (calls[0]?.payload as object), false);
  assert.equal("studentCuil" in (calls[0]?.payload as object), false);
});

test("la edición con 401 redirige a la sesión expirada", async () => {
  const deps = makeUpdateDeps(async () => ({
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Sesión expirada",
  }));

  await assert.rejects(
    () => updateStudentActionCore(INITIAL_STATE, validEditForm, deps),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/session-expired",
  );
});

test("la edición con 403 y 422 conserva valores", async () => {
  const forbidden = await updateStudentActionCore(
    INITIAL_STATE,
    validEditForm,
    makeUpdateDeps(async () => ({
      ok: false,
      kind: "forbidden",
      status: 403,
      message: "No tenés permisos.",
    })),
  );
  const validation = await updateStudentActionCore(
    INITIAL_STATE,
    validEditForm,
    makeUpdateDeps(async () => ({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los datos del formulario e intentá nuevamente.",
      fieldErrors: { studentEmail: "El correo ya está registrado." },
    })),
  );

  assert.equal(forbidden.status, "forbidden");
  assert.equal(forbidden.values.firstName, "Lucas Andrés");
  assert.equal(validation.status, "validation");
  assert.equal(validation.values.firstName, "Lucas Andrés");
  assert.equal(
    validation.fieldErrors?.studentEmail,
    "El correo ya está registrado.",
  );
});

test("la edición desde el listado conserva filtros y agrega updated=1", async () => {
  const deps = makeUpdateDeps(async () => ({
    ok: true,
    message: "Alumno actualizado correctamente",
  }));
  const form = createFormData({
    studentId: "uuid-1",
    firstName: "Lucas Andrés",
    lastName: "Pérez",
    studentEmail: "",
    studentPhone: "",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "",
    address: "",
    from: "list",
    returnTo: "/dashboard/students?firstName=Ana&page=2",
  });

  await assert.rejects(
    () => updateStudentActionCore(INITIAL_STATE, form, deps),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/dashboard/students?firstName=Ana&page=2&updated=1",
  );
});

test("la edición con retorno inválido vuelve al listado sin filtros", async () => {
  const deps = makeUpdateDeps(async () => ({
    ok: true,
    message: "Alumno actualizado correctamente",
  }));
  const form = createFormData({
    studentId: "uuid-1",
    firstName: "Lucas Andrés",
    lastName: "Pérez",
    studentEmail: "",
    studentPhone: "",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "",
    address: "",
    from: "list",
    returnTo: "https://example.com/dashboard/students?dni=123",
  });

  await assert.rejects(
    () => updateStudentActionCore(INITIAL_STATE, form, deps),
    (error) =>
      error instanceof RedirectSignal &&
      error.path === "/dashboard/students?updated=1",
  );
});

test("el acceso denegado evita la solicitud en alta y edición", async () => {
  const createCalls: string[] = [];
  const updateCalls: string[] = [];
  const denied = async () =>
    ({ status: "forbidden" as const, message: "No tenés permisos." });

  const created = await createStudentActionCore(
    INITIAL_STATE,
    validCreateForm,
    makeCreateDeps(
      async () => {
        createCalls.push("create");
        return { ok: true, message: "ok" };
      },
      { getAccess: denied },
    ),
  );
  const updated = await updateStudentActionCore(
    INITIAL_STATE,
    validEditForm,
    makeUpdateDeps(
      async () => {
        updateCalls.push("update");
        return { ok: true, message: "ok" };
      },
      { getAccess: denied },
    ),
  );

  assert.equal(created.status, "forbidden");
  assert.equal(created.message, "No tenés permisos.");
  assert.equal(created.values.studentDni, "50123456");
  assert.equal(updated.status, "forbidden");
  assert.equal(updated.message, "No tenés permisos.");
  assert.equal(updated.values.firstName, "Lucas Andrés");
  assert.deepEqual(createCalls, []);
  assert.deepEqual(updateCalls, []);
});

test("el fallo de transporte del alta conserva los valores y el mensaje", async () => {
  const state = await createStudentActionCore(
    INITIAL_STATE,
    validCreateForm,
    makeCreateDeps(async () => ({
      ok: false,
      kind: "failed",
      status: null,
      message: "No pudimos registrar al alumno. Intentá nuevamente.",
    })),
  );

  assert.equal(state.status, "error");
  assert.equal(
    state.message,
    "No pudimos registrar al alumno. Intentá nuevamente.",
  );
  assert.equal(state.values.studentDni, "50123456");
  assert.equal(state.values.firstName, "Lucas");
  assert.equal(state.fieldErrors, undefined);
});

test("el fallo de transporte de la edición conserva los valores y el mensaje", async () => {
  const state = await updateStudentActionCore(
    INITIAL_STATE,
    validEditForm,
    makeUpdateDeps(async () => ({
      ok: false,
      kind: "failed",
      status: null,
      message: "No pudimos actualizar al alumno. Intentá nuevamente.",
    })),
  );

  assert.equal(state.status, "error");
  assert.equal(
    state.message,
    "No pudimos actualizar al alumno. Intentá nuevamente.",
  );
  assert.equal(state.values.firstName, "Lucas Andrés");
  assert.equal(state.fieldErrors, undefined);
});
