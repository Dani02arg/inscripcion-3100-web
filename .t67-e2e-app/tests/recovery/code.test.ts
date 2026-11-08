import assert from "node:assert/strict";
import { test } from "node:test";

import { applyRecoveryPaste } from "../../app/lib/recovery/code.ts";

test("reparte el pegado desde la primera casilla", () => {
  assert.deepEqual(applyRecoveryPaste("", "12-345"), {
    digits: "12345",
    focusIndex: 4,
  });
  assert.deepEqual(applyRecoveryPaste("", "12 34 5"), {
    digits: "12345",
    focusIndex: 4,
  });
  assert.deepEqual(applyRecoveryPaste("", "ab12cd34ef5"), {
    digits: "12345",
    focusIndex: 4,
  });
});

test("conserva los ceros iniciales del código", () => {
  assert.deepEqual(applyRecoveryPaste("", "00123"), {
    digits: "00123",
    focusIndex: 4,
  });
});

test("completa desde la primera casilla con menos de cinco dígitos", () => {
  assert.deepEqual(applyRecoveryPaste("", "12"), {
    digits: "12   ",
    focusIndex: 2,
  });
  assert.deepEqual(applyRecoveryPaste("9    ", "123"), {
    digits: "123  ",
    focusIndex: 3,
  });
});

test("conserva solo los primeros cinco dígitos", () => {
  assert.deepEqual(applyRecoveryPaste("", "123456"), {
    digits: "12345",
    focusIndex: 4,
  });
});

test("ignora la casilla donde se pegó y reparte desde la primera", () => {
  assert.deepEqual(applyRecoveryPaste("9    ", "12"), {
    digits: "12   ",
    focusIndex: 2,
  });
  assert.deepEqual(applyRecoveryPaste("12345", "7"), {
    digits: "7    ",
    focusIndex: 1,
  });
});

test("no altera el valor cuando el pegado no aporta dígitos", () => {
  assert.deepEqual(applyRecoveryPaste("1    ", "abc"), {
    digits: "1    ",
    focusIndex: 1,
  });
  assert.deepEqual(applyRecoveryPaste("1    ", " - "), {
    digits: "1    ",
    focusIndex: 1,
  });
  assert.deepEqual(applyRecoveryPaste("12345", ""), {
    digits: "12345",
    focusIndex: 4,
  });
});
