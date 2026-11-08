import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ME_ENDPOINT_PATH,
  ME_REQUEST_TIMEOUT_MS,
  getCurrentUser,
  parseCurrentUserResponse,
} from "../../app/lib/api/me.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const validData = {
  id: 1,
  name: "Ana",
  lastname: "Pérez",
  email: "ana@example.com",
  role: "TUTOR",
};

test("parsea una respuesta exitosa con id numérico y lo normaliza a texto", () => {
  const result = parseCurrentUserResponse(200, {
    data: validData,
    message: "Usuario autenticado.",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user.id, "1");
    assert.equal(result.user.name, "Ana");
    assert.equal(result.user.lastname, "Pérez");
    assert.equal(result.user.email, "ana@example.com");
    assert.equal(result.user.role, "TUTOR");
    assert.equal(result.message, "Usuario autenticado.");
  }
});

test("acepta un id de texto", () => {
  const result = parseCurrentUserResponse(200, {
    data: { ...validData, id: "01a1544c" },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user.id, "01a1544c");
  }
});

test("un 2xx con errores devuelve fallo general", () => {
  const result = parseCurrentUserResponse(200, {
    data: validData,
    message: "ok",
    errors: ["algo"],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "No se pudo cargar tu información. Intentá nuevamente.",
    );
  }
});

test("un 2xx con usuario incompleto devuelve fallo general", () => {
  const result = parseCurrentUserResponse(200, {
    data: { id: 1, name: "Ana" },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("un 401 devuelve unauthorized con el mensaje de sesión expirada", () => {
  const result = parseCurrentUserResponse(401, {});

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "unauthorized");
    assert.equal(result.message, "Tu sesión expiró. Iniciá sesión nuevamente.");
  }
});

test("un 403 devuelve forbidden con el mensaje de acceso denegado", () => {
  const result = parseCurrentUserResponse(403, {});

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(
      result.message,
      "No tenés permisos para acceder a esta sección.",
    );
  }
});

test("un 5xx usa el mensaje del servicio o el general", () => {
  const result = parseCurrentUserResponse(500, { message: "Error interno" });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.message, "Error interno");
  }
});

test("getCurrentUser hace GET con Bearer y el contrato esperado", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ data: validData, message: "Usuario autenticado." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await getCurrentUser("jwt-token", {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(ME_ENDPOINT_PATH, "/api/auth/me");
  assert.equal(ME_REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.input.toString(), "http://api.test/api/auth/me");
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
    assert.equal(result.user.email, "ana@example.com");
  }
});

test("un error de red devuelve fallo general", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("network down");
  };

  const result = await getCurrentUser("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(
      result.message,
      "No se pudo cargar tu información. Intentá nuevamente.",
    );
  }
});

test("sin configuración no llama a fetch y devuelve fallo general", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", { status: 200 });
  };

  const result = await getCurrentUser("jwt-token", {
    baseUrl: "",
    fetchImpl,
  });

  assert.equal(calls.length, 0);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("incorpora los campos opcionales del perfil propio", () => {
  const result = parseCurrentUserResponse(200, {
    data: {
      ...validData,
      user_phone: "3871234567",
      birthdate: "1990-01-15",
      occupation: "Docente",
      education_level: "UNIVERSITARIO",
      email_verified_at: "2026-11-02T18:30:00-03:00",
      created_at: "2026-11-01T10:00:00-03:00",
      updated_at: "2026-11-02T18:30:00-03:00",
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user.userPhone, "3871234567");
    assert.equal(result.user.birthdate, "1990-01-15");
    assert.equal(result.user.occupation, "Docente");
    assert.equal(result.user.educationLevel, "UNIVERSITARIO");
    assert.equal(
      result.user.emailVerifiedAt,
      "2026-11-02T18:30:00-03:00",
    );
    assert.equal(result.user.createdAt, "2026-11-01T10:00:00-03:00");
    assert.equal(result.user.updatedAt, "2026-11-02T18:30:00-03:00");
  }
});

test("omite los campos opcionales ausentes o vacíos", () => {
  const result = parseCurrentUserResponse(200, {
    data: {
      ...validData,
      user_phone: "",
      birthdate: null,
      occupation: undefined,
      education_level: "   ",
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user.userPhone, undefined);
    assert.equal(result.user.birthdate, undefined);
    assert.equal(result.user.occupation, undefined);
    assert.equal(result.user.educationLevel, undefined);
    assert.equal(result.user.emailVerifiedAt, undefined);
  }
});
