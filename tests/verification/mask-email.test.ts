import assert from "node:assert/strict";
import { test } from "node:test";

import { maskEmail } from "../../app/lib/verification/mask-email.ts";

test("enmascara el usuario y el dominio conservando la primera letra", () => {
  assert.equal(maskEmail("andres@gmail.com"), "a***@g***.com");
  assert.equal(maskEmail("Jose@Gmail.com"), "J***@G***.com");
  assert.equal(maskEmail("a@b.com"), "a***@b***.com");
});

test("conserva el sufijo desde el último punto del dominio", () => {
  assert.equal(maskEmail("user@mail.example.com"), "u***@m***.com");
  assert.equal(maskEmail("user@example.com.ar"), "u***@e***.ar");
});

test("ignora los espacios exteriores del correo", () => {
  assert.equal(maskEmail("  andres@gmail.com  "), "a***@g***.com");
});

test("devuelve la máscara genérica ante una entrada inválida", () => {
  assert.equal(maskEmail(""), "***");
  assert.equal(maskEmail("   "), "***");
  assert.equal(maskEmail("andres"), "***");
  assert.equal(maskEmail("andres@"), "***");
  assert.equal(maskEmail("@gmail.com"), "***");
  assert.equal(maskEmail("andres@gmail"), "***");
  assert.equal(maskEmail("andres@.com"), "***");
  assert.equal(maskEmail("andres@gmail."), "***");
  assert.equal(maskEmail("an dres@gmail.com"), "***");
  assert.equal(maskEmail("andres@@gmail.com"), "***");
});
