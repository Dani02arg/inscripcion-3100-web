import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENT_FILTERS_STORAGE_KEY,
  clearStudentFiltersStorage,
  parseStoredStudentFilters,
  readStudentFilters,
  serializeStudentFiltersForStorage,
  writeStudentFilters,
  type StudentFiltersStorage,
} from "../../app/lib/students/filters-storage.ts";

class MemoryStorage implements StudentFiltersStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }
}

const THROWING_STORAGE: StudentFiltersStorage = {
  getItem() {
    throw new Error("bloqueado");
  },
  setItem() {
    throw new Error("sin cuota");
  },
  removeItem() {
    throw new Error("bloqueado");
  },
};

test("la clave de la pestaña es la declarada", () => {
  assert.equal(STUDENT_FILTERS_STORAGE_KEY, "student_filters");
});

test("lo ausente o corrupto se interpreta como filtros vacíos", () => {
  for (const value of [
    null,
    undefined,
    "",
    "no es json",
    "[]",
    "null",
    "42",
    '"texto"',
  ]) {
    assert.deepEqual(parseStoredStudentFilters(value), {
      studentDni: "",
      studentCuil: "",
    });
  }
});

test("se leen y recortan los identificadores válidos", () => {
  assert.deepEqual(
    parseStoredStudentFilters(
      JSON.stringify({
        studentDni: " 50123456 ",
        studentCuil: " 20501234567 ",
        ignored: "x",
      }),
    ),
    {
      studentDni: "50123456",
      studentCuil: "20501234567",
    },
  );
});

test("un identificador inválido se vacía sin perder el otro", () => {
  assert.deepEqual(
    parseStoredStudentFilters(
      JSON.stringify({
        studentDni: "50.123.456",
        studentCuil: "20501234567",
      }),
    ),
    {
      studentDni: "",
      studentCuil: "20501234567",
    },
  );

  assert.deepEqual(
    parseStoredStudentFilters(
      JSON.stringify({
        studentDni: "50123456",
        studentCuil: "205012345678",
      }),
    ),
    {
      studentDni: "50123456",
      studentCuil: "",
    },
  );

  assert.deepEqual(
    parseStoredStudentFilters(
      JSON.stringify({ studentDni: 50123456, studentCuil: null }),
    ),
    { studentDni: "", studentCuil: "" },
  );
});

test("la serialización incluye solo identificadores válidos y no vacíos", () => {
  assert.equal(
    serializeStudentFiltersForStorage({
      studentDni: " 50123456 ",
      studentCuil: "20501234567",
    }),
    JSON.stringify({
      studentDni: "50123456",
      studentCuil: "20501234567",
    }),
  );

  assert.equal(
    serializeStudentFiltersForStorage({
      studentDni: "abc",
      studentCuil: "",
    }),
    "{}",
  );

  assert.equal(
    serializeStudentFiltersForStorage({
      studentDni: "",
      studentCuil: "20501234567",
    }),
    JSON.stringify({ studentCuil: "20501234567" }),
  );
});

test("se guardan y se leen los filtros de la pestaña", () => {
  const storage = new MemoryStorage();

  writeStudentFilters(
    { studentDni: "50123456", studentCuil: "" },
    storage,
  );

  assert.equal(
    readStudentFilters(storage).studentDni,
    "50123456",
  );
  assert.equal(readStudentFilters(storage).studentCuil, "");

  writeStudentFilters(
    { studentDni: "50123456", studentCuil: "20501234567" },
    storage,
  );

  assert.deepEqual(readStudentFilters(storage), {
    studentDni: "50123456",
    studentCuil: "20501234567",
  });
});

test("no se guardan nombres ni otros campos ajenos", () => {
  const storage = new MemoryStorage();
  const filters = {
    studentDni: "50123456",
    studentCuil: "",
    firstName: "Lucas",
    lastName: "Pérez",
  };

  writeStudentFilters(filters, storage);
  const stored = JSON.parse(
    storage.getItem(STUDENT_FILTERS_STORAGE_KEY) ?? "{}",
  );

  assert.deepEqual(stored, { studentDni: "50123456" });
});

test("guardar vacío elimina la clave", () => {
  const storage = new MemoryStorage();

  writeStudentFilters(
    { studentDni: "50123456", studentCuil: "" },
    storage,
  );
  assert.equal(storage.has(STUDENT_FILTERS_STORAGE_KEY), true);

  writeStudentFilters(
    { studentDni: "  ", studentCuil: "abc" },
    storage,
  );
  assert.equal(storage.has(STUDENT_FILTERS_STORAGE_KEY), false);
});

test("el almacenamiento bloqueado no lanza y degrada a vacío", () => {
  assert.deepEqual(readStudentFilters(null), {
    studentDni: "",
    studentCuil: "",
  });
  assert.deepEqual(readStudentFilters(THROWING_STORAGE), {
    studentDni: "",
    studentCuil: "",
  });

  assert.doesNotThrow(() =>
    writeStudentFilters(
      { studentDni: "50123456", studentCuil: "" },
      THROWING_STORAGE,
    ),
  );
  assert.doesNotThrow(() =>
    writeStudentFilters(
      { studentDni: "50123456", studentCuil: "" },
      null,
    ),
  );
  assert.doesNotThrow(() =>
    clearStudentFiltersStorage(THROWING_STORAGE),
  );
  assert.doesNotThrow(() => clearStudentFiltersStorage(null));
});

test("limpiar elimina la clave guardada", () => {
  const storage = new MemoryStorage();

  writeStudentFilters(
    { studentDni: "50123456", studentCuil: "20501234567" },
    storage,
  );
  clearStudentFiltersStorage(storage);

  assert.equal(storage.has(STUDENT_FILTERS_STORAGE_KEY), false);
  assert.deepEqual(readStudentFilters(storage), {
    studentDni: "",
    studentCuil: "",
  });
});
