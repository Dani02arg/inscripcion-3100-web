import assert from "node:assert/strict";
import { test } from "node:test";

import {
  approveActionCore,
  observeActionCore,
  reassignActionCore,
  rejectActionCore,
  type DictamenActionDependencies,
} from "../../app/lib/registrations/action-core.ts";
import type { DictamenActionState } from "../../app/lib/registrations/types.ts";

function makeDeps(
  overrides: Partial<DictamenActionDependencies> = {},
): DictamenActionDependencies {
  return {
    getAccess: async () => ({ status: "ok", token: "token" }),
    callApi: async () => ({ ok: true, message: "" }),
    revalidatePath: () => {},
    redirect: () => {
      throw new Error("redirect-no-registrado");
    },
    ...overrides,
  };
}

function makeFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

const idle: DictamenActionState = { status: "idle" };

test("aprobar sin identificador devuelve error", async () => {
  const result = await approveActionCore(idle, makeFormData({}), makeDeps());
  assert.equal(result.status, "error");
});

test("aprobar exitoso revalida listado, detalle y contador", async () => {
  const paths: string[] = [];

  const result = await approveActionCore(
    idle,
    makeFormData({ registrationId: "r1", observations: "ok" }),
    makeDeps({
      revalidatePath: (path) => {
        paths.push(path);
      },
    }),
  );

  assert.deepEqual(result, { status: "success", message: "" });
  assert.deepEqual(paths, [
    "/dashboard/registrations",
    "/dashboard/registrations/r1",
    "/dashboard",
  ]);
});

test("observar sin texto devuelve validación sin llamar a la API", async () => {
  let called = false;

  const result = await observeActionCore(
    idle,
    makeFormData({ registrationId: "r1", observations: "   " }),
    makeDeps({
      callApi: async () => {
        called = true;
        return { ok: true, message: "" };
      },
    }),
  );

  assert.equal(result.status, "validation");
  assert.equal(called, false);
});

test("reasignar sin curso ni motivo devuelve validación", async () => {
  const result = await reassignActionCore(
    idle,
    makeFormData({ registrationId: "r1" }),
    makeDeps(),
  );

  assert.equal(result.status, "validation");
  if (result.status === "validation") {
    assert.ok(result.fieldErrors.newCourseId);
    assert.ok(result.fieldErrors.reassignmentReason);
  }
});

test("acceso denegado devuelve forbidden sin llamar a la API", async () => {
  let called = false;

  const result = await approveActionCore(
    idle,
    makeFormData({ registrationId: "r1" }),
    makeDeps({
      getAccess: async () => ({ status: "forbidden", message: "no permitido" }),
      callApi: async () => {
        called = true;
        return { ok: true, message: "" };
      },
    }),
  );

  assert.deepEqual(result, { status: "forbidden", message: "no permitido" });
  assert.equal(called, false);
});

test("una respuesta 409 se traduce a conflicto", async () => {
  const result = await rejectActionCore(
    idle,
    makeFormData({ registrationId: "r1" }),
    makeDeps({
      callApi: async () => ({ ok: false, kind: "conflict", status: 409, message: "cambió" }),
    }),
  );

  assert.deepEqual(result, { status: "conflict", message: "cambió" });
});

test("una respuesta 422 se traduce a validación", async () => {
  const result = await observeActionCore(
    idle,
    makeFormData({ registrationId: "r1", observations: "falta" }),
    makeDeps({
      callApi: async () => ({
        ok: false,
        kind: "validation",
        status: 422,
        message: "revisá",
        fieldErrors: { observations: "falta" },
      }),
    }),
  );

  assert.equal(result.status, "validation");
});

test("una respuesta 404 se traduce a no encontrado", async () => {
  const result = await approveActionCore(
    idle,
    makeFormData({ registrationId: "r1" }),
    makeDeps({
      callApi: async () => ({ ok: false, kind: "not_found", status: 404, message: "no existe" }),
    }),
  );

  assert.deepEqual(result, { status: "not_found", message: "no existe" });
});

test("un fallo de transporte se traduce a error", async () => {
  const result = await approveActionCore(
    idle,
    makeFormData({ registrationId: "r1" }),
    makeDeps({
      callApi: async () => ({ ok: false, kind: "failed", status: null, message: "sin conexión" }),
    }),
  );

  assert.deepEqual(result, { status: "error", message: "sin conexión" });
});

test("una respuesta 401 redirige a sesión vencida", async () => {
  let redirectedPath = "";

  await assert.rejects(
    () =>
      approveActionCore(
        idle,
        makeFormData({ registrationId: "r1" }),
        makeDeps({
          callApi: async () => ({ ok: false, kind: "unauthorized", status: 401, message: "expired" }),
          redirect: (path) => {
            redirectedPath = path;
            throw new Error(`redirect:${path}`);
          },
        }),
      ),
    /redirect:\/session-expired/,
  );

  assert.equal(redirectedPath, "/session-expired");
});
