import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRequestPayload,
  buildResetPayload,
  mapResetFieldErrors,
  validateNewPassword,
  validateRecoveryCode,
  validateRecoveryEmail,
} from "../../app/lib/validation/password-recovery.ts";

test("exige el correo electrónico", () => {
  const result = validateRecoveryEmail("");

  assert.equal(result.valid, false);
  assert.equal(result.error, "Este campo es obligatorio.");
  assert.equal(result.payload, null);
});

test("trata el correo de solo espacios como vacío", () => {
  const result = validateRecoveryEmail("   ");

  assert.equal(result.valid, false);
  assert.equal(result.error, "Este campo es obligatorio.");
  assert.equal(result.payload, null);
});

test("rechaza un correo con formato inválido", () => {
  for (const value of ["ana", "ana@", "ana@example", "ana example@test.com"]) {
    const result = validateRecoveryEmail(value);

    assert.equal(result.valid, false, `debería rechazar ${value}`);
    assert.equal(result.error, "Ingresá un correo válido.");
    assert.equal(result.payload, null);
  }
});

test("recorta los espacios exteriores del correo", () => {
  const result = validateRecoveryEmail("  ana@example.com  ");

  assert.equal(result.valid, true);
  assert.equal(result.email, "ana@example.com");
  assert.deepEqual(result.payload, { email: "ana@example.com" });
});

test("no normaliza las mayúsculas del correo", () => {
  const result = validateRecoveryEmail(" Ana@Example.com ");

  assert.equal(result.valid, true);
  assert.deepEqual(result.payload, { email: "Ana@Example.com" });
});

test("buildRequestPayload devuelve solo el correo", () => {
  const payload = buildRequestPayload("  ana@example.com ");

  assert.deepEqual(payload, { email: "ana@example.com" });
  assert.deepEqual(Object.keys(payload), ["email"]);
});

test("validateRecoveryCode exige exactamente 5 dígitos", () => {
  const invalid = ["", "1234", "123456", "12a45", " 12345 "];

  for (const value of invalid) {
    const error = validateRecoveryCode(value);
    assert.equal(error, "Ingresá el código de 5 dígitos.", `debería rechazar "${value}"`);
  }

  assert.equal(validateRecoveryCode("00123"), undefined);
  assert.equal(validateRecoveryCode("12345"), undefined);
});

test("mapResetFieldErrors mapea solo los campos conocidos y traduce password_confirmation", () => {
  const input = {
    email: ["El correo no existe"],
    code: ["Código vencido"],
    password: ["Demasiado corta"],
    password_confirmation: ["Las contraseñas no coinciden"],
    unknown_field: ["Ignorado"],
    empty_field: [],
  };

  const mapped = mapResetFieldErrors(input);

  assert.deepEqual(mapped, {
    email: "El correo no existe",
    code: "Código vencido",
    password: "Demasiado corta",
    passwordConfirmation: "Las contraseñas no coinciden",
  });
});

test("mapResetFieldErrors soporta cadenas directas y descarta entradas no válidas", () => {
  assert.deepEqual(
    mapResetFieldErrors({ password_confirmation: "No coincide" }),
    { passwordConfirmation: "No coincide" },
  );

  assert.deepEqual(mapResetFieldErrors(null), {});
  assert.deepEqual(mapResetFieldErrors("error"), {});
  assert.deepEqual(mapResetFieldErrors({ code: "" }), {});
});

test("buildResetPayload mapea passwordConfirmation a password_confirmation y recorta email", () => {
  const payload = buildResetPayload({
    email: "  ana@example.com  ",
    code: "00123",
    password: "  Clave1!  ",
    passwordConfirmation: "  Clave1!  ",
  });

  assert.deepEqual(payload, {
    email: "ana@example.com",
    code: "00123",
    password: "  Clave1!  ",
    password_confirmation: "  Clave1!  ",
  });
  assert.deepEqual(Object.keys(payload).sort(), [
    "code",
    "email",
    "password",
    "password_confirmation",
  ]);
});

const PASSWORD_POLICY_MESSAGE =
  "La contraseña debe tener entre 8 y 16 caracteres, una mayúscula, una minúscula y un número o carácter especial.";

test("acepta los límites de 8 y 16 caracteres", () => {
  assert.equal(validateNewPassword("Abcdef1!", "Abcdef1!").valid, true);
  assert.equal(
    validateNewPassword("Abcdefghijklm1!?", "Abcdefghijklm1!?").valid,
    true,
  );
});

test("rechaza una contraseña de menos de 8 y de más de 16 caracteres", () => {
  const short = validateNewPassword("Abcde1!", "Abcde1!");
  const long = validateNewPassword("Abcdefghijklm1!?x", "Abcdefghijklm1!?x");

  assert.equal(short.valid, false);
  assert.equal(short.errors.password, PASSWORD_POLICY_MESSAGE);
  assert.equal(long.valid, false);
  assert.equal(long.errors.password, PASSWORD_POLICY_MESSAGE);
});

test("rechaza una contraseña sin mayúscula, sin minúscula o sin número y especial", () => {
  const cases = ["abcdefg1!", "ABCDEFG1!", "Abcdefgh"];

  for (const value of cases) {
    const result = validateNewPassword(value, value);

    assert.equal(result.valid, false, `debería rechazar ${value}`);
    assert.equal(result.errors.password, PASSWORD_POLICY_MESSAGE);
  }
});

test("rechaza una contraseña con emoji", () => {
  const result = validateNewPassword("Abcdef1!😀", "Abcdef1!😀");

  assert.equal(result.valid, false);
  assert.equal(result.errors.password, PASSWORD_POLICY_MESSAGE);
});

test("exige la confirmación cuando está vacía o solo tiene espacios", () => {
  for (const confirmation of ["", "   "]) {
    const result = validateNewPassword("Abcdef1!", confirmation);

    assert.equal(result.valid, false);
    assert.equal(result.errors.passwordConfirmation, "Este campo es obligatorio.");
    assert.equal(result.errors.password, undefined);
  }
});

test("rechaza una confirmación distinta de la contraseña", () => {
  const result = validateNewPassword("Abcdef1!", "Abcdef2!");

  assert.equal(result.valid, false);
  assert.equal(result.errors.passwordConfirmation, "Las contraseñas no coinciden.");
  assert.equal(result.errors.password, undefined);
});

test("exige la contraseña cuando está vacía", () => {
  const result = validateNewPassword("", "");

  assert.equal(result.valid, false);
  assert.equal(result.errors.password, "Este campo es obligatorio.");
  assert.equal(result.errors.passwordConfirmation, "Este campo es obligatorio.");
});

test("no compara la nueva contraseña con una anterior", () => {
  const result = validateNewPassword("Abcdef1!", "Abcdef1!");

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});
