import assert from "node:assert/strict";
import { test } from "node:test";

import type { LoginInput } from "../../app/lib/validation/login.ts";
import {
  LOGIN_FORM_FIELDS,
  buildLoginPayload,
  validateLoginInput,
} from "../../app/lib/validation/login.ts";

function makeInput(overrides: Partial<LoginInput> = {}): LoginInput {
  return {
    email: "ana@example.com",
    password: "Abcdef1!",
    ...overrides,
  };
}

test("exige email y contraseña", () => {
  const result = validateLoginInput(makeInput({ email: "", password: "" }));

  assert.equal(result.valid, false);
  assert.equal(result.errors.email, "Este campo es obligatorio.");
  assert.equal(result.errors.password, "Este campo es obligatorio.");
  assert.equal(result.payload, null);
});

test("trata el email de solo espacios como vacío", () => {
  const result = validateLoginInput(makeInput({ email: "   " }));

  assert.equal(result.valid, false);
  assert.equal(result.errors.email, "Este campo es obligatorio.");
});

test("rechaza un email con formato inválido", () => {
  const result = validateLoginInput(makeInput({ email: "ana@" }));

  assert.equal(result.valid, false);
  assert.equal(result.errors.email, "Ingresá un correo válido.");
  assert.equal(result.errors.password, undefined);
});

test("recorta el email y conserva la contraseña", () => {
  const result = validateLoginInput(
    makeInput({
      email: "  ana@example.com  ",
      password: "  clave con espacios  ",
    }),
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.payload, {
    email: "ana@example.com",
    password: "  clave con espacios  ",
  });
});

test("acepta una contraseña de un solo carácter sin exigir complejidad", () => {
  const result = validateLoginInput(makeInput({ password: "x" }));

  assert.equal(result.valid, true);
  assert.deepEqual(result.payload, {
    email: "ana@example.com",
    password: "x",
  });
});

test("una contraseña de solo espacios no está vacía", () => {
  const result = validateLoginInput(makeInput({ password: " " }));

  assert.equal(result.valid, true);
  assert.equal(result.payload?.password, " ");
});

test("buildLoginPayload devuelve solo email y password", () => {
  const payload = buildLoginPayload(
    makeInput({ email: "  ana@example.com " }),
  );

  assert.deepEqual(payload, {
    email: "ana@example.com",
    password: "Abcdef1!",
  });
  assert.deepEqual(Object.keys(payload).sort(), ["email", "password"]);
});

test("la lista de campos coincide con el formulario", () => {
  assert.deepEqual([...LOGIN_FORM_FIELDS], ["email", "password"]);
});
