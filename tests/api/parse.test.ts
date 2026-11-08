import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getApiMessage,
  isRecord,
  mapApiErrorsToFieldErrors,
  parseRegisterResponse,
  toStringArray,
} from "../../app/lib/api/auth.ts";

test("reconoce registros y convierte errores a arreglos", () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord(null), false);

  assert.deepEqual(toStringArray("error"), ["error"]);
  assert.deepEqual(toStringArray(["uno", "dos"]), ["uno", "dos"]);
  assert.deepEqual(toStringArray(["uno", 2, "", "tres"]), ["uno", "tres"]);
  assert.deepEqual(toStringArray(undefined), []);

  assert.equal(getApiMessage({ message: "Mensaje" }, "Fallback"), "Mensaje");
  assert.equal(getApiMessage({}, "Fallback"), "Fallback");
  assert.equal(getApiMessage({ message: " " }, "Fallback"), "Fallback");
});

test("mapea solo los campos conocidos de la API", () => {
  const fieldErrors = mapApiErrorsToFieldErrors({
    email: ["Correo inválido"],
    dni: ["DNI inválido"],
    general: ["Error general"],
  });

  assert.deepEqual(fieldErrors, {
    email: "Correo inválido",
    dni: "DNI inválido",
  });
});

test("acepta un 2xx sin errores", () => {
  const result = parseRegisterResponse(201, {
    data: { id: 1 },
    message: "Registro exitoso",
    errors: [],
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { id: 1 });
    assert.equal(result.message, "Registro exitoso");
    assert.deepEqual(result.errors, []);
  }
});

test("rechaza un 2xx con errores", () => {
  const result = parseRegisterResponse(200, {
    data: null,
    message: "Revisá los datos",
    errors: {
      email: ["Correo inválido"],
      general: ["Error general"],
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 200);
    assert.equal(result.message, "Revisá los datos");
    assert.deepEqual(result.fieldErrors, {
      email: "Correo inválido",
    });
    assert.deepEqual(result.errors, ["Error general"]);
  }
});

test("mapea un 422 con errores por campo", () => {
  const result = parseRegisterResponse(422, {
    message: "La validación falló",
    errors: {
      email: ["Correo inválido"],
      dni: ["DNI inválido"],
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 422);
    assert.deepEqual(result.fieldErrors, {
      email: "Correo inválido",
      dni: "DNI inválido",
    });
    assert.deepEqual(result.errors, []);
  }
});

test("manda al banner los errores generales y las claves desconocidas", () => {
  const result = parseRegisterResponse(422, {
    message: "La validación falló",
    errors: {
      general: ["Error general"],
      otro: ["Otro error"],
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.fieldErrors, {});
    assert.deepEqual(result.errors, ["Error general", "Otro error"]);
  }
});

test("acepta un arreglo de errores generales en 422", () => {
  const result = parseRegisterResponse(422, {
    message: "La validación falló",
    errors: ["Error general"],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.fieldErrors, {});
    assert.deepEqual(result.errors, ["Error general"]);
  }
});

test("trata 3xx, 5xx y cuerpos inválidos como error general", () => {
  const redirect = parseRegisterResponse(302, {
    message: "Redirección inesperada",
    errors: [],
  });
  assert.equal(redirect.ok, false);
  if (!redirect.ok) {
    assert.equal(redirect.status, 302);
    assert.deepEqual(redirect.errors, []);
  }

  const serverError = parseRegisterResponse(500, {
    message: "Error interno",
  });
  assert.equal(serverError.ok, false);
  if (!serverError.ok) {
    assert.equal(serverError.status, 500);
    assert.equal(serverError.message, "Error interno");
  }

  const invalidBody = parseRegisterResponse(200, undefined);
  assert.equal(invalidBody.ok, false);
  if (!invalidBody.ok) {
    assert.equal(invalidBody.status, 200);
    assert.match(invalidBody.message, /formato esperado/i);
  }
});
