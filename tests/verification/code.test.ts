import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CODE_LENGTH,
  applyPaste,
  isCompleteCode,
  nextFocusIndex,
  normalizeCode,
  setDigit,
} from "../../app/lib/verification/code.ts";

test("normaliza el código dejando solo dígitos y recortando a cinco", () => {
  assert.equal(CODE_LENGTH, 5);
  assert.equal(normalizeCode(""), "");
  assert.equal(normalizeCode("12-345"), "12345");
  assert.equal(normalizeCode("12 34 5"), "12345");
  assert.equal(normalizeCode("ab12cd34ef5"), "12345");
  assert.equal(normalizeCode("123456"), "12345");
  assert.equal(normalizeCode("abc"), "");
});

test("reemplaza una casilla y conserva las demás", () => {
  assert.equal(setDigit("", 0, "1"), "1    ");
  assert.equal(setDigit("1    ", 1, "2"), "12   ");
  assert.equal(setDigit("12345", 0, "7"), "72345");
  assert.equal(setDigit("12345", 4, "9"), "12349");
  assert.equal(setDigit("1", 3, "4"), "1  4 ");
});

test("ignora caracteres e índices inválidos al escribir", () => {
  assert.equal(setDigit("1    ", 1, "a"), "1    ");
  assert.equal(setDigit("1    ", 1, ""), "1    ");
  assert.equal(setDigit("1    ", 1, "12"), "1    ");
  assert.equal(setDigit("1    ", -1, "2"), "1    ");
  assert.equal(setDigit("1    ", 5, "2"), "1    ");
  assert.equal(setDigit("1    ", 99, "2"), "1    ");
});

test("reparte el pegado desde la casilla activa", () => {
  assert.equal(applyPaste("", "12-345", 0), "12345");
  assert.equal(applyPaste("", "12 34 5", 0), "12345");
  assert.equal(applyPaste("", "ab12cd34ef5", 0), "12345");
  assert.equal(applyPaste("", "123456", 0), "12345");
  assert.equal(applyPaste("9    ", "123", 1), "9123 ");
  assert.equal(applyPaste("9    ", "12345", 3), "9  12");
});

test("no modifica el código cuando el pegado no aporta dígitos", () => {
  assert.equal(applyPaste("1    ", "abc", 1), "1    ");
  assert.equal(applyPaste("1    ", " - ", 1), "1    ");
  assert.equal(applyPaste("1    ", "", 4), "1    ");
});

test("acota el índice inicial del pegado al rango de casillas", () => {
  assert.equal(applyPaste("", "12345", -3), "12345");
  assert.equal(applyPaste("", "12345", 99), "    1");
});

test("calcula el foco tras escribir o borrar", () => {
  assert.equal(nextFocusIndex("1    ", 0), 1);
  assert.equal(nextFocusIndex("12   ", 1), 2);
  assert.equal(nextFocusIndex("12345", 4), 4);
  assert.equal(nextFocusIndex("1    ", 2), 1);
  assert.equal(nextFocusIndex("     ", 0), 0);
  assert.equal(nextFocusIndex("12345", 99), 4);
  assert.equal(nextFocusIndex("     ", -5), 0);
});

test("solo considera completo un código de cinco dígitos", () => {
  assert.equal(isCompleteCode("12345"), true);
  assert.equal(isCompleteCode("1234"), false);
  assert.equal(isCompleteCode("1234 "), false);
  assert.equal(isCompleteCode("123456"), false);
  assert.equal(isCompleteCode("12a45"), false);
  assert.equal(isCompleteCode(""), false);
  assert.equal(isCompleteCode("     "), false);
});
