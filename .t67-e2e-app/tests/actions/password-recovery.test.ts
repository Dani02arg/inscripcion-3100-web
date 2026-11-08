import assert from "node:assert/strict";
import { test } from "node:test";

import { requestRecoveryAction } from "../../app/lib/actions/password-recovery.ts";
import type { RequestRecoveryActionState } from "../../app/lib/validation/password-recovery.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const INITIAL_STATE: RequestRecoveryActionState = {
  status: "idle",
  message: "",
  errors: {},
};

function createFormData(email: string): FormData {
  const formData = new FormData();
  formData.set("email", email);

  return formData;
}

test("no llama al servicio con un correo vacío", async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = (async () => {
    calls += 1;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const state = await requestRecoveryAction(INITIAL_STATE, createFormData("  "));

  assert.equal(state.status, "error");
  assert.equal(state.message, "");
  assert.equal(state.errors.email, "Este campo es obligatorio.");
  assert.deepEqual(state.values, { email: "" });
  assert.equal(calls, 0);
});

test("no llama al servicio con un correo inválido", async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = (async () => {
    calls += 1;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const state = await requestRecoveryAction(
    INITIAL_STATE,
    createFormData("correo-invalido"),
  );

  assert.equal(state.status, "error");
  assert.equal(state.errors.email, "Ingresá un correo válido.");
  assert.deepEqual(state.values, { email: "correo-invalido" });
  assert.equal(calls, 0);
});

test("devuelve sent y envía el correo recortado", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.LARAVEL_API_URL;
  const calls: FetchCall[] = [];

  process.env.LARAVEL_API_URL = "http://localhost:8000";
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        message: "Se ha enviado un código de recuperación a tu correo.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;

    if (originalUrl === undefined) {
      delete process.env.LARAVEL_API_URL;
    } else {
      process.env.LARAVEL_API_URL = originalUrl;
    }
  });

  const state = await requestRecoveryAction(
    INITIAL_STATE,
    createFormData("  ana@example.com  "),
  );

  assert.equal(state.status, "sent");
  assert.equal(
    state.message,
    "Se ha enviado un código de recuperación a tu correo.",
  );
  assert.deepEqual(state.errors, {});
  assert.deepEqual(state.values, { email: "ana@example.com" });
  assert.equal(calls.length, 1);
  assert.equal(String(calls[0].input), "http://localhost:8000/api/auth/forgot-password");
  assert.equal(calls[0].init?.body, JSON.stringify({ email: "ana@example.com" }));
});

test("devuelve el error de correo no registrado junto al campo", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.LARAVEL_API_URL;

  process.env.LARAVEL_API_URL = "http://localhost:8000";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        message: "El correo electrónico no está registrado.",
        errors: { email: ["El correo electrónico no está registrado."] },
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;

    if (originalUrl === undefined) {
      delete process.env.LARAVEL_API_URL;
    } else {
      process.env.LARAVEL_API_URL = originalUrl;
    }
  });

  const state = await requestRecoveryAction(
    INITIAL_STATE,
    createFormData("ana@example.com"),
  );

  assert.equal(state.status, "error");
  assert.equal(state.message, "");
  assert.equal(
    state.errors.email,
    "El correo electrónico no está registrado.",
  );
  assert.deepEqual(state.values, { email: "ana@example.com" });
});

test("devuelve el aviso general y conserva el correo", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.LARAVEL_API_URL;

  process.env.LARAVEL_API_URL = "http://localhost:8000";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        message: "No se pudo completar la operación. Intentá nuevamente.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;

    if (originalUrl === undefined) {
      delete process.env.LARAVEL_API_URL;
    } else {
      process.env.LARAVEL_API_URL = originalUrl;
    }
  });

  const state = await requestRecoveryAction(
    INITIAL_STATE,
    createFormData("ana@example.com"),
  );

  assert.equal(state.status, "error");
  assert.equal(
    state.message,
    "No se pudo completar la operación. Intentá nuevamente.",
  );
  assert.deepEqual(state.errors, {});
  assert.deepEqual(state.values, { email: "ana@example.com" });
});
