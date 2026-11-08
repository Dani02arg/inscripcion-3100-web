import assert from "node:assert/strict";
import { test } from "node:test";

import {
  PASSWORD_RECOVERY_REQUEST_TIMEOUT_MS,
  parseRequestRecoveryResponse,
  parseResetPasswordResponse,
  requestRecoveryCode,
  resetPassword,
  REQUEST_RECOVERY_ENDPOINT_PATH,
  RESET_PASSWORD_ENDPOINT_PATH,
} from "../../app/lib/api/password-recovery.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("reconoce el éxito con el mensaje del servicio", () => {
  const result = parseRequestRecoveryResponse(200, {
    message: "Se ha enviado un código de recuperación a tu correo.",
  });

  assert.deepEqual(result, {
    ok: true,
    status: 200,
    message: "Se ha enviado un código de recuperación a tu correo.",
  });
});

test("usa el mensaje de la spec cuando el éxito no trae mensaje", () => {
  const result = parseRequestRecoveryResponse(204, {});

  assert.deepEqual(result, {
    ok: true,
    status: 204,
    message: "Se ha enviado un código de recuperación a tu correo.",
  });
});

test("trata un 2xx con errores como fallo general", () => {
  const result = parseRequestRecoveryResponse(200, {
    message: "No se pudo procesar la solicitud.",
    errors: { email: ["El correo no es válido."] },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.status, 200);
  assert.equal(result.message, "No se pudo procesar la solicitud.");
  assert.deepEqual(result.fieldErrors, {});
  assert.deepEqual(result.errors, ["El correo no es válido."]);
});

test("clasifica un 422 con errors.email de correo no registrado", () => {
  const result = parseRequestRecoveryResponse(422, {
    message: "Los datos no son válidos.",
    errors: { email: ["El correo electrónico no está registrado."] },
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "email_not_registered",
    status: 422,
    message: "El correo electrónico no está registrado.",
    errors: [],
    fieldErrors: { email: "El correo electrónico no está registrado." },
  });
});

test("trata un 422 con otros errores como fallo general", () => {
  const result = parseRequestRecoveryResponse(422, {
    message: "Los datos no son válidos.",
    errors: { email: ["El correo es obligatorio."] },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.message, "Los datos no son válidos.");
  assert.deepEqual(result.errors, ["El correo es obligatorio."]);
  assert.deepEqual(result.fieldErrors, {});
});

test("clasifica un 404 como correo no registrado", () => {
  const result = parseRequestRecoveryResponse(404, {
    message: "Recurso no encontrado.",
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "email_not_registered",
    status: 404,
    message: "El correo electrónico no está registrado.",
    errors: [],
    fieldErrors: { email: "El correo electrónico no está registrado." },
  });
});

test("trata 429 y 5xx como fallo general", () => {
  const tooMany = parseRequestRecoveryResponse(429, {
    message: "Demasiadas solicitudes.",
  });
  const server = parseRequestRecoveryResponse(500, {});

  assert.equal(tooMany.ok, false);
  assert.equal(server.ok, false);

  if (tooMany.ok || server.ok) {
    return;
  }

  assert.equal(tooMany.kind, "failed");
  assert.equal(tooMany.message, "Demasiadas solicitudes.");
  assert.equal(server.kind, "failed");
  assert.equal(
    server.message,
    "No se pudo completar la operación. Intentá nuevamente.",
  );
});

test("trata un cuerpo inválido como fallo general", () => {
  for (const body of [null, "texto", 42, ["a"]]) {
    const result = parseRequestRecoveryResponse(200, body);

    assert.equal(result.ok, false);

    if (result.ok) {
      continue;
    }

    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "La respuesta del servicio no tiene el formato esperado.",
    );
  }
});

test("expone la ruta del endpoint de solicitud", () => {
  assert.equal(REQUEST_RECOVERY_ENDPOINT_PATH, "/api/auth/forgot-password");
});

test("reconoce el éxito del cambio con el mensaje del servicio", () => {
  const result = parseResetPasswordResponse(200, {
    message: "Contraseña restablecida correctamente.",
  });

  assert.deepEqual(result, {
    ok: true,
    status: 200,
    message: "Contraseña restablecida correctamente.",
  });
});

test("usa el mensaje de la spec cuando el éxito del cambio no trae mensaje", () => {
  const result = parseResetPasswordResponse(204, {});

  assert.deepEqual(result, {
    ok: true,
    status: 204,
    message: "Contraseña restablecida correctamente.",
  });
});

test("trata un 2xx del cambio con errores como fallo general", () => {
  const result = parseResetPasswordResponse(200, {
    message: "No se pudo cambiar la contraseña.",
    errors: { password: ["La contraseña no es válida."] },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.status, 200);
  assert.equal(result.message, "No se pudo cambiar la contraseña.");
  assert.deepEqual(result.errors, ["La contraseña no es válida."]);
  assert.deepEqual(result.fieldErrors, {});
});

test("clasifica el código inválido por el mensaje principal", () => {
  const result = parseResetPasswordResponse(422, {
    message: "Código de recuperación inválido.",
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "invalid_code",
    status: 422,
    message: "Código de recuperación inválido.",
    errors: [],
    fieldErrors: {},
  });
});

test("clasifica el código inválido por errors.code", () => {
  const result = parseResetPasswordResponse(422, {
    message: "Los datos no son válidos.",
    errors: { code: ["Código de recuperación inválido."] },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "invalid_code");
  assert.equal(result.message, "Código de recuperación inválido.");
});

test("clasifica los errores por campo como validation y traduce la confirmación", () => {
  const result = parseResetPasswordResponse(422, {
    message: "Los datos no son válidos.",
    errors: {
      password: ["La contraseña debe tener al menos 8 caracteres."],
      password_confirmation: ["Las contraseñas no coinciden."],
    },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "validation");
  assert.equal(result.message, "Los datos no son válidos.");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.fieldErrors, {
    password: "La contraseña debe tener al menos 8 caracteres.",
    passwordConfirmation: "Las contraseñas no coinciden.",
  });
});

test("un 422 mixto no pierde el mensaje principal ni los errores desconocidos", () => {
  const result = parseResetPasswordResponse(422, {
    message: "Revisá los datos ingresados.",
    errors: {
      code: ["El código es obligatorio."],
      otro: ["Ocurrió un problema inesperado."],
    },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "validation");
  assert.equal(result.message, "Revisá los datos ingresados.");
  assert.deepEqual(result.errors, ["Ocurrió un problema inesperado."]);
  assert.deepEqual(result.fieldErrors, { code: "El código es obligatorio." });
});

test("clasifica un 422 con errors.email de correo no registrado", () => {
  const result = parseResetPasswordResponse(422, {
    message: "Los datos no son válidos.",
    errors: { email: ["El correo electrónico no está registrado."] },
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "email_not_registered",
    status: 422,
    message: "El correo electrónico no está registrado.",
    errors: [],
    fieldErrors: { email: "El correo electrónico no está registrado." },
  });
});

test("clasifica un 404 del cambio como correo no registrado", () => {
  const result = parseResetPasswordResponse(404, {
    message: "Recurso no encontrado.",
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "email_not_registered",
    status: 404,
    message: "El correo electrónico no está registrado.",
    errors: [],
    fieldErrors: { email: "El correo electrónico no está registrado." },
  });
});

test("trata 429 y 5xx del cambio como fallo general", () => {
  const tooMany = parseResetPasswordResponse(429, {
    message: "Demasiadas solicitudes.",
  });
  const server = parseResetPasswordResponse(500, {});

  assert.equal(tooMany.ok, false);
  assert.equal(server.ok, false);

  if (tooMany.ok || server.ok) {
    return;
  }

  assert.equal(tooMany.kind, "failed");
  assert.equal(tooMany.message, "Demasiadas solicitudes.");
  assert.equal(server.kind, "failed");
  assert.equal(
    server.message,
    "No se pudo completar la operación. Intentá nuevamente.",
  );
});

test("trata un cuerpo inválido del cambio como fallo general", () => {
  for (const body of [null, "texto", 42, ["a"]]) {
    const result = parseResetPasswordResponse(200, body);

    assert.equal(result.ok, false);

    if (result.ok) {
      continue;
    }

    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "La respuesta del servicio no tiene el formato esperado.",
    );
  }
});

test("expone la ruta del endpoint de cambio", () => {
  assert.equal(RESET_PASSWORD_ENDPOINT_PATH, "/api/auth/reset-password");
});

test("hace POST con el contrato esperado para solicitar el código", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        message: "Se ha enviado un código de recuperación a tu correo.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(PASSWORD_RECOVERY_REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/auth/forgot-password",
  );
  assert.equal(call.init?.method, "POST");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("accept"), "application/json");

  const body: unknown = JSON.parse(String(call.init?.body));
  assert.deepEqual(body, { email: "ana@example.com" });
  assert.deepEqual(Object.keys(body as Record<string, unknown>), ["email"]);
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    message: "Se ha enviado un código de recuperación a tu correo.",
  });
});

test("devuelve el correo no registrado del servicio", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        message: "Los datos no son válidos.",
        errors: { email: ["El correo electrónico no está registrado."] },
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "email_not_registered",
    status: 422,
    message: "El correo electrónico no está registrado.",
    errors: [],
    fieldErrors: { email: "El correo electrónico no está registrado." },
  });
});

test("trata un 404 de la solicitud como correo no registrado", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({ message: "No encontrado." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "email_not_registered");
  assert.equal(result.message, "El correo electrónico no está registrado.");
});

test("un error de red devuelve fallo de conexión", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("network down");
  };

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "failed",
    status: null,
    message: "No se pudo conectar con el servicio. Intentá nuevamente.",
    errors: [],
    fieldErrors: {},
  });
});

test("un timeout devuelve el mensaje específico", async () => {
  const fetchImpl: typeof fetch = async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    throw error;
  };

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.status, null);
  assert.equal(
    result.message,
    "La solicitud tardó demasiado. Intentá nuevamente.",
  );
});

test("sin configuración no llama a fetch y devuelve fallo general", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", { status: 200 });
  };

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "",
    fetchImpl,
  });

  assert.equal(calls.length, 0);
  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.status, null);
  assert.equal(
    result.message,
    "El servicio de recuperación no está disponible en este momento. Intentá nuevamente.",
  );
});

test("una respuesta con cuerpo inválido devuelve fallo general", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response("no es json", { status: 200 });

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(
    result.message,
    "La respuesta del servicio no tiene el formato esperado.",
  );
});

test("un 2xx sin cuerpo se considera éxito", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(null, { status: 204 });

  const result = await requestRecoveryCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.deepEqual(result, {
    ok: true,
    status: 204,
    message: "Se ha enviado un código de recuperación a tu correo.",
  });
});

const resetPayload = {
  email: "ana@example.com",
  code: "00123",
  password: "NuevaClave1!",
  password_confirmation: "NuevaClave1!",
};

test("hace POST con el cuerpo exacto para cambiar la contraseña", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ message: "Contraseña restablecida correctamente." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/auth/reset-password",
  );
  assert.equal(call.init?.method, "POST");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("accept"), "application/json");

  const body: unknown = JSON.parse(String(call.init?.body));
  assert.deepEqual(body, resetPayload);
  assert.deepEqual(Object.keys(body as Record<string, unknown>), [
    "email",
    "code",
    "password",
    "password_confirmation",
  ]);
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    message: "Contraseña restablecida correctamente.",
  });
  assert.equal(JSON.stringify(result).includes(resetPayload.password), false);
  assert.equal(
    JSON.stringify(result).includes(resetPayload.password_confirmation),
    false,
  );
});

test("devuelve el código inválido del cambio", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({ message: "Código de recuperación inválido." }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "invalid_code",
    status: 422,
    message: "Código de recuperación inválido.",
    errors: [],
    fieldErrors: {},
  });
});

test("mapea los errores por campo del cambio", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        message: "Los datos no son válidos.",
        errors: {
          password_confirmation: ["Las contraseñas no coinciden."],
        },
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "validation");
  assert.deepEqual(result.fieldErrors, {
    passwordConfirmation: "Las contraseñas no coinciden.",
  });
  assert.equal(JSON.stringify(result).includes(resetPayload.password), false);
  assert.equal(
    JSON.stringify(result).includes(resetPayload.password_confirmation),
    false,
  );
});

test("trata un 404 del cambio como correo no registrado", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({ message: "No encontrado." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "email_not_registered");
  assert.equal(result.message, "El correo electrónico no está registrado.");
});

test("un error de red del cambio devuelve fallo de conexión", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("network down");
  };

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.deepEqual(result, {
    ok: false,
    kind: "failed",
    status: null,
    message: "No se pudo conectar con el servicio. Intentá nuevamente.",
    errors: [],
    fieldErrors: {},
  });
});

test("un timeout del cambio devuelve el mensaje específico", async () => {
  const fetchImpl: typeof fetch = async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    throw error;
  };

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.status, null);
  assert.equal(
    result.message,
    "La solicitud tardó demasiado. Intentá nuevamente.",
  );
});

test("un 5xx del cambio devuelve fallo general", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({ message: "Error interno." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });

  const result = await resetPassword(resetPayload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.kind, "failed");
  assert.equal(result.message, "Error interno.");
  assert.equal(JSON.stringify(result).includes(resetPayload.password), false);
  assert.equal(
    JSON.stringify(result).includes(resetPayload.password_confirmation),
    false,
  );
});
