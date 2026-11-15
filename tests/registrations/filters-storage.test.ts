import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_FILTERS_STORAGE_KEY,
  clearStoredIdentifiers,
  readStoredIdentifiers,
  writeStoredIdentifiers,
  type RegistrationFiltersStorage,
} from "../../app/lib/registrations/filters-storage.ts";

function makeStorage(
  initial: Record<string, string> = {},
): RegistrationFiltersStorage {
  const map = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("readStoredIdentifiers lee valores válidos", () => {
  const storage = makeStorage({
    [REGISTRATION_FILTERS_STORAGE_KEY]: JSON.stringify({
      studentDni: "12345678",
      studentCuil: "20123456789",
    }),
  });

  assert.deepEqual(readStoredIdentifiers(storage), {
    studentDni: "12345678",
    studentCuil: "20123456789",
  });
});

test("readStoredIdentifiers devuelve vacío ante datos inválidos", () => {
  for (const value of [
    "",
    "no-json",
    JSON.stringify({ studentDni: "12a", studentCuil: "x" }),
    JSON.stringify("hola"),
    JSON.stringify([1, 2]),
  ]) {
    const storage = makeStorage({ [REGISTRATION_FILTERS_STORAGE_KEY]: value });
    assert.deepEqual(readStoredIdentifiers(storage), {
      studentDni: "",
      studentCuil: "",
    });
  }
});

test("writeStoredIdentifiers guarda y elimina la clave cuando queda vacío", () => {
  const storage = makeStorage();

  writeStoredIdentifiers({ studentDni: "12345678", studentCuil: "" }, storage);
  assert.equal(
    storage.getItem(REGISTRATION_FILTERS_STORAGE_KEY),
    JSON.stringify({ studentDni: "12345678" }),
  );

  writeStoredIdentifiers({ studentDni: "", studentCuil: "" }, storage);
  assert.equal(storage.getItem(REGISTRATION_FILTERS_STORAGE_KEY), null);
});

test("clearStoredIdentifiers elimina la clave", () => {
  const storage = makeStorage({
    [REGISTRATION_FILTERS_STORAGE_KEY]: JSON.stringify({ studentDni: "1" }),
  });

  clearStoredIdentifiers(storage);
  assert.equal(storage.getItem(REGISTRATION_FILTERS_STORAGE_KEY), null);
});

test("sin almacenamiento devuelve vacío y no lanza", () => {
  assert.deepEqual(readStoredIdentifiers(null), {
    studentDni: "",
    studentCuil: "",
  });
  writeStoredIdentifiers({ studentDni: "1", studentCuil: "2" }, null);
  clearStoredIdentifiers(null);
});
