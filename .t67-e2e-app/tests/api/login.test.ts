import assert from "node:assert/strict";
import { test } from "node:test";

import type { LoginPayload } from "../../app/lib/validation/login.ts";
import {
  LOGIN_ENDPOINT_PATH,
  LOGIN_REQUEST_TIMEOUT_MS,
  loginUser,
  parseLoginResponse,
} from "../../app/lib/api/login.ts";
import { isRecord } from "../../app/lib/api/auth.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const payload: LoginPayload = {
  email: "ana@example.com",
  password: "Abcdef1!",
};

function encodePayload(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeToken(claims: Record<string, unknown>): string {
  return `e30.${encodePayload(claims)}.firma`;
}

const validToken = makeToken({
  sub: "01a1544c-b52b-719e-bd6c-04a1d075ef88",
  email: "ana@example.com",
  role: "TUTOR",
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const validUser = {
  id: "01a1544c-b52b-719e-bd6c-04a1d075ef88",
  name: "Ana",
  lastname: "Pérez",
  email: "ana@example.com",
  role: "TUTOR",
};

test("hace POST con el contrato esperado y devuelve el éxito", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        data: { token: validToken, user: validUser },
        message: "Inicio de sesión exitoso",
        errors: [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const result = await loginUser(payload, {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(LOGIN_ENDPOINT_PATH, "/api/auth/login");
  assert.equal(LOGIN_REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.input.toString(), "http://api.test/api/auth/login");
  assert.equal(call.init?.method, "POST");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("accept"), "application/json");

  const body = call.init?.body;
  if (typeof body !== "string") {
    assert.fail("El cuerpo de la petición debe ser JSON serializado.");
  }

  const parsedBody: unknown = JSON.parse(body);
  assert.equal(isRecord(parsedBody), true);
  if (isRecord(parsedBody)) {
    assert.deepEqual(Object.keys(parsedBody).sort(), ["email", "password"]);
    assert.equal(parsedBody.email, payload.email);
    assert.equal(parsedBody.password, payload.password);
  }

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.status, 200);
    assert.equal(result.data.token, validToken);
    assert.deepEqual(result.data.user, {
      id: validUser.id,
      email: validUser.email,
    });
    assert.equal(result.message, "Inicio de sesión exitoso");
  }

  assert.equal(JSON.stringify(result).includes(payload.password), false);
});

test("un 2xx sin data devuelve fallo de respuesta inválida", () => {
  const result = parseLoginResponse(200, { message: "ok", errors: [] });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "La respuesta del servicio no tiene el formato esperado.",
    );
  }
});

test("un 2xx con token no utilizable devuelve fallo de respuesta inválida", () => {
  const result = parseLoginResponse(200, {
    message: "ok",
    errors: [],
    data: { token: "abc", user: validUser },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "La respuesta del servicio no tiene el formato esperado.",
    );
  }
});

test("un 2xx con token vencido devuelve fallo de respuesta inválida", () => {
  const expiredToken = makeToken({
    sub: "1",
    email: "ana@example.com",
    role: "TUTOR",
    exp: 1,
  });
  const result = parseLoginResponse(200, {
    message: "ok",
    errors: [],
    data: { token: expiredToken, user: validUser },
  });

  assert.equal(result.ok, false);
});

test("un 2xx con usuario incompleto devuelve fallo de respuesta inválida", () => {
  const result = parseLoginResponse(200, {
    message: "ok",
    errors: [],
    data: { token: validToken, user: { id: "1" } },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("un 2xx con usuario sin id devuelve fallo de respuesta inválida", () => {
  const result = parseLoginResponse(200, {
    message: "ok",
    errors: [],
    data: { token: validToken, user: { email: "ana@example.com" } },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("clasifica el email no registrado por errores de campo", () => {
  const result = parseLoginResponse(422, {
    message: "La validación falló",
    errors: { email: ["No encontramos una cuenta con ese email."] },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "email_not_registered");
    assert.equal(result.fieldErrors.email, "El email no está registrado");
    assert.equal(result.message, "El email no está registrado");
    assert.deepEqual(result.errors, []);
  }
});

test("clasifica la contraseña incorrecta por errores de campo", () => {
  const result = parseLoginResponse(401, {
    message: "Credenciales inválidas",
    errors: { password: ["La contraseña no es correcta."] },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "invalid_password");
    assert.equal(
      result.fieldErrors.password,
      "La contraseña es incorrecta",
    );
  }
});

test("clasifica por el mensaje cuando no hay errores de campo", () => {
  const emailResult = parseLoginResponse(422, {
    message: "El email no está registrado.",
    errors: [],
  });

  assert.equal(emailResult.ok, false);
  if (!emailResult.ok) {
    assert.equal(emailResult.kind, "email_not_registered");
  }

  const passwordResult = parseLoginResponse(401, {
    message: "La contraseña es incorrecta.",
    errors: [],
  });

  assert.equal(passwordResult.ok, false);
  if (!passwordResult.ok) {
    assert.equal(passwordResult.kind, "invalid_password");
  }
});

test("un 500 devuelve fallo general con el mensaje del servicio", () => {
  const result = parseLoginResponse(500, {
    message: "Error interno",
    errors: [],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, 500);
    assert.equal(result.message, "Error interno");
  }
});

test("un cuerpo inválido devuelve fallo general", () => {
  const result = parseLoginResponse(200, null);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "La respuesta del servicio no tiene el formato esperado.",
    );
  }
});

test("un error de red devuelve fallo general de conexión", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("network down");
  };

  const result = await loginUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, null);
    assert.equal(
      result.message,
      "No se pudo conectar con el servicio. Intentá nuevamente.",
    );
  }
});

test("un timeout devuelve un mensaje específico", async () => {
  const fetchImpl: typeof fetch = async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    throw error;
  };

  const result = await loginUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.message,
      "La solicitud tardó demasiado. Intentá nuevamente.",
    );
  }
});

test("una respuesta sin JSON devuelve fallo general", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response("no es json", { status: 200 });

  const result = await loginUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "La respuesta del servicio no tiene el formato esperado.",
    );
  }
});

test("sin configuración no llama a fetch y devuelve fallo general", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", { status: 200 });
  };

  const result = await loginUser(payload, {
    baseUrl: "",
    fetchImpl,
  });

  assert.equal(calls.length, 0);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, null);
  }
});
