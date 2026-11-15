import assert from "node:assert/strict";
import { test } from "node:test";

import {
  extractCuilDigits,
  formatCuil,
  isCuilComplete,
} from "../../app/lib/registrations/cuil.ts";

test("extractCuilDigits conserva solo los dígitos", () => {
  assert.equal(extractCuilDigits("20-12345678-9"), "20123456789");
  assert.equal(extractCuilDigits("20 12345678 9"), "20123456789");
  assert.equal(extractCuilDigits("abc20def"), "20");
  assert.equal(extractCuilDigits(""), "");
});

test("formatCuil aplica la máscara XX-XXXXXXXX-X de forma progresiva", () => {
  assert.equal(formatCuil(""), "");
  assert.equal(formatCuil("2"), "2");
  assert.equal(formatCuil("20"), "20");
  assert.equal(formatCuil("201"), "20-1");
  assert.equal(formatCuil("2012345678"), "20-12345678");
  assert.equal(formatCuil("20123456789"), "20-12345678-9");
  assert.equal(formatCuil("20-12345678-9"), "20-12345678-9");
  assert.equal(formatCuil("20123456789012"), "20-12345678-9");
});

test("isCuilComplete detecta los once dígitos", () => {
  assert.equal(isCuilComplete("20123456789"), true);
  assert.equal(isCuilComplete("20-12345678-9"), true);
  assert.equal(isCuilComplete("2012345678"), false);
  assert.equal(isCuilComplete(""), false);
  assert.equal(isCuilComplete("abc"), false);
});
