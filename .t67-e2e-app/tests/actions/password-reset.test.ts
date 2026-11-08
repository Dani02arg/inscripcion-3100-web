import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";

import { resetPasswordAction } from "../../app/lib/actions/password-recovery.ts";
import type { ResetPasswordActionState } from "../../app/lib/validation/password-recovery.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const INITIAL_STATE: ResetPasswordActionState = {
  status: "idle",
  message: "",
  errors: {},
};

const VALID_INPUT = {
  email: "ana@example.com",
  code: "00123",
  password: "Nueva123!",
  passwordConfirmation: "Nueva123!",
};

function createFormData(input: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [field, value] of Object.entries(input)) {
    formData.set(field, value);
  }

  return formData;
}

function installFetch(
  t: TestContext,
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): FetchCall[] {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.LARAVEL_API_URL;
  const calls: FetchCall[] = [];

  process.env.LARAVEL_API_URL = "http://localhost:8000";
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });

    return handler(input, init);
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;

    if (originalUrl === undefined) {
      delete process.env.LARAVEL_API_URL;
    } else {
      process.env.LARAVEL_API_URL = originalUrl;
    }
  });

  return calls;
}

test("no llama al servicio con código o contraseña inválidos", async (t) => {
  const calls = installFetch(t, async () => new Response("{}", { status: 200 }));

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData({
      email: "ana@example.com",
      code: "123",
      password: "corta",
      passwordConfirmation: "otra",
    }),
  );

  assert.equal(state.status, "validation");
  assert.equal(state.message, "");
  assert.ok(state.errors.code);
  assert.ok(state.errors.password);
  assert.ok(state.errors.passwordConfirmation);
  assert.equal(state.values?.code, "123");
  assert.equal(state.values?.password, "corta");
  assert.equal(calls.length, 0);
});

test("devuelve success y envía el contrato exacto del cambio", async (t) => {
  const calls = installFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          message: "Contraseña restablecida correctamente.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
  );

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "success");
  assert.equal(state.message, "Contraseña restablecida correctamente.");
  assert.deepEqual(state.errors, {});
  assert.equal(state.values, undefined);
  assert.equal(calls.length, 1);
  assert.equal(
    String(calls[0].input),
    "http://localhost:8000/api/auth/reset-password",
  );
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    email: "ana@example.com",
    code: "00123",
    password: "Nueva123!",
    password_confirmation: "Nueva123!",
  });
});

test("devuelve invalid_code, limpia el código y conserva las contraseñas", async (t) => {
  installFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          message: "Código de recuperación inválido.",
          errors: { code: ["Código de recuperación inválido."] },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
  );

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "invalid_code");
  assert.equal(state.message, "Código de recuperación inválido.");
  assert.equal(state.errors.code, "Código de recuperación inválido.");
  assert.equal(state.values?.code, "");
  assert.equal(state.values?.password, "Nueva123!");
  assert.equal(state.values?.passwordConfirmation, "Nueva123!");
});

test("devuelve validation con los errores por campo del servicio", async (t) => {
  installFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          message: "Los datos no son válidos.",
          errors: {
            password_confirmation: ["La confirmación no es válida."],
          },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
  );

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "validation");
  assert.equal(
    state.errors.passwordConfirmation,
    "La confirmación no es válida.",
  );
  assert.deepEqual(state.values, VALID_INPUT);
});

test("conserva el mensaje principal y los errores desconocidos del servicio", async (t) => {
  installFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          message: "Los datos no son válidos.",
          errors: {
            password_confirmation: ["La confirmación no es válida."],
            otro: ["Ocurrió un problema inesperado."],
          },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
  );

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "validation");
  assert.equal(
    state.message,
    "Los datos no son válidos. Ocurrió un problema inesperado.",
  );
  assert.equal(
    state.errors.passwordConfirmation,
    "La confirmación no es válida.",
  );
  assert.deepEqual(state.values, VALID_INPUT);
});

test("devuelve email_not_registered ante un 404", async (t) => {
  installFetch(
    t,
    async () =>
      new Response(JSON.stringify({ message: "Recurso no encontrado." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
  );

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "email_not_registered");
  assert.equal(
    state.errors.email,
    "El correo electrónico no está registrado.",
  );
  assert.deepEqual(state.values, VALID_INPUT);
});

test("devuelve timeout con el mensaje específico del cambio", async (t) => {
  installFetch(t, async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    throw error;
  });

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "timeout");
  assert.equal(
    state.message,
    "No pudimos confirmar el cambio. Probá iniciar sesión con la nueva contraseña o solicitá un código nuevo.",
  );
  assert.deepEqual(state.values, VALID_INPUT);
});

test("devuelve error general y conserva los valores", async (t) => {
  installFetch(
    t,
    async () =>
      new Response(
        JSON.stringify({
          message: "No se pudo completar la operación. Intentá nuevamente.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
  );

  const state = await resetPasswordAction(
    INITIAL_STATE,
    createFormData(VALID_INPUT),
  );

  assert.equal(state.status, "error");
  assert.equal(
    state.message,
    "No se pudo completar la operación. Intentá nuevamente.",
  );
  assert.deepEqual(state.values, VALID_INPUT);
});
