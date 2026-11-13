import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENT_IDENTIFIER_MAX_LENGTH,
  STUDENT_PAGE_SIZE,
  clearStudentFilters,
  filterStudents,
  getDefaultStudentFilters,
  hasActiveStudentFilters,
  isStudentIdentifierInput,
  normalizeStudentDigits,
  paginateStudents,
} from "../../app/lib/students/list.ts";
import type { Student } from "../../app/lib/students/types.ts";

function makeStudent(
  id: string,
  overrides: Partial<Student> = {},
): Student {
  return {
    id,
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: null,
    studentPhone: null,
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: null,
    address: null,
    ...overrides,
  };
}

const STUDENTS: readonly Student[] = [
  makeStudent("s-1", {
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
  }),
  makeStudent("s-2", {
    studentDni: "51234567",
    studentCuil: "20512345678",
    firstName: "Andrés",
    lastName: "Gómez",
  }),
  makeStudent("s-3", {
    studentDni: "49876543",
    studentCuil: "20498765432",
    firstName: "María",
    lastName: "Pérez",
  }),
];

test("los filtros por defecto están vacíos y no comparten referencia", () => {
  const first = getDefaultStudentFilters();
  const second = clearStudentFilters();

  assert.deepEqual(first, {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
  });
  assert.deepEqual(second, first);
  assert.notEqual(first, second);
});

test("hay filtros activos cuando algún campo recortado no está vacío", () => {
  assert.equal(hasActiveStudentFilters(getDefaultStudentFilters()), false);
  assert.equal(
    hasActiveStudentFilters({
      studentDni: "   ",
      studentCuil: "",
      firstName: "",
      lastName: " ",
    }),
    false,
  );

  for (const filters of [
    { studentDni: "50123456", studentCuil: "", firstName: "", lastName: "" },
    { studentDni: "", studentCuil: "20501234567", firstName: "", lastName: "" },
    { studentDni: "", studentCuil: "", firstName: "Lucas", lastName: "" },
    { studentDni: "", studentCuil: "", firstName: "", lastName: "Pérez" },
  ]) {
    assert.equal(hasActiveStudentFilters(filters), true);
  }
});

test("normalizeStudentDigits deja solo dígitos", () => {
  assert.equal(normalizeStudentDigits("20.123.456/7"), "201234567");
  assert.equal(normalizeStudentDigits("20 123 456"), "20123456");
  assert.equal(normalizeStudentDigits("abc"), "");
  assert.equal(normalizeStudentDigits(""), "");
});

test("el filtro de identificador acepta vacío o solo dígitos y respeta el largo", () => {
  assert.equal(isStudentIdentifierInput(""), true);
  assert.equal(isStudentIdentifierInput("   "), true);
  assert.equal(isStudentIdentifierInput("50123456"), true);
  assert.equal(isStudentIdentifierInput("50.123.456"), false);
  assert.equal(isStudentIdentifierInput("50 123 456"), false);
  assert.equal(isStudentIdentifierInput("50-123-456"), false);
  assert.equal(isStudentIdentifierInput("abc"), false);

  assert.equal(
    isStudentIdentifierInput("50123456", STUDENT_IDENTIFIER_MAX_LENGTH.studentDni),
    true,
  );
  assert.equal(
    isStudentIdentifierInput("501234567", STUDENT_IDENTIFIER_MAX_LENGTH.studentDni),
    false,
  );
  assert.equal(
    isStudentIdentifierInput("20501234567", STUDENT_IDENTIFIER_MAX_LENGTH.studentCuil),
    true,
  );
  assert.equal(
    isStudentIdentifierInput("205012345678", STUDENT_IDENTIFIER_MAX_LENGTH.studentCuil),
    false,
  );
});

test("sin filtros se conserva el orden y no se muta la entrada", () => {
  const result = filterStudents(STUDENTS, clearStudentFilters());

  assert.deepEqual(
    result.map((student) => student.id),
    ["s-1", "s-2", "s-3"],
  );
  assert.notEqual(result, STUDENTS);
  assert.equal(STUDENTS.length, 3);
});

test("DNI y CUIL se comparan de forma exacta por dígitos", () => {
  const byDni = filterStudents(STUDENTS, {
    ...clearStudentFilters(),
    studentDni: "50123456",
  });
  const byCuil = filterStudents(STUDENTS, {
    ...clearStudentFilters(),
    studentCuil: "20512345678",
  });
  const withSeparators = filterStudents(STUDENTS, {
    ...clearStudentFilters(),
    studentDni: "50.123.456",
  });
  const noMatch = filterStudents(STUDENTS, {
    ...clearStudentFilters(),
    studentDni: "5012345",
  });

  assert.deepEqual(byDni.map((student) => student.id), ["s-1"]);
  assert.deepEqual(byCuil.map((student) => student.id), ["s-2"]);
  assert.deepEqual(withSeparators.map((student) => student.id), ["s-1"]);
  assert.deepEqual(noMatch, []);
});

test("un identificador con letras no coincide con ningún alumno", () => {
  const result = filterStudents(STUDENTS, {
    ...clearStudentFilters(),
    studentDni: "abc",
  });

  assert.deepEqual(result, []);
});

test("nombre y apellido se buscan de forma parcial, sin mayúsculas ni tildes", () => {
  assert.deepEqual(
    filterStudents(STUDENTS, {
      ...clearStudentFilters(),
      firstName: "luc",
    }).map((student) => student.id),
    ["s-1"],
  );
  assert.deepEqual(
    filterStudents(STUDENTS, {
      ...clearStudentFilters(),
      firstName: "andres",
    }).map((student) => student.id),
    ["s-2"],
  );
  assert.deepEqual(
    filterStudents(STUDENTS, {
      ...clearStudentFilters(),
      lastName: "perez",
    }).map((student) => student.id),
    ["s-1", "s-3"],
  );
  assert.deepEqual(
    filterStudents(STUDENTS, {
      ...clearStudentFilters(),
      lastName: "GÓMEZ",
    }).map((student) => student.id),
    ["s-2"],
  );
});

test("los filtros se combinan y los vacíos no intervienen", () => {
  const result = filterStudents(STUDENTS, {
    studentDni: "",
    studentCuil: "",
    firstName: "maria",
    lastName: "perez",
  });

  assert.deepEqual(result.map((student) => student.id), ["s-3"]);

  const noMatch = filterStudents(STUDENTS, {
    studentDni: "",
    studentCuil: "",
    firstName: "lucas",
    lastName: "gomez",
  });

  assert.deepEqual(noMatch, []);
});

test("paginar sin alumnos devuelve una página vacía válida", () => {
  const page = paginateStudents([], 1);

  assert.equal(page.total, 0);
  assert.equal(page.totalPages, 1);
  assert.equal(page.page, 1);
  assert.equal(page.from, 0);
  assert.equal(page.to, 0);
  assert.deepEqual(page.items, []);
  assert.equal(page.pageSize, STUDENT_PAGE_SIZE);
});

test("paginar de a 15 conserva el total y ajusta la página", () => {
  const students = Array.from({ length: 16 }, (_, index) =>
    makeStudent(`s-${index + 1}`),
  );
  const first = paginateStudents(students, 1);
  const second = paginateStudents(students, 2);
  const beyond = paginateStudents(students, 99);

  assert.equal(first.total, 16);
  assert.equal(first.totalPages, 2);
  assert.equal(first.items.length, 15);
  assert.equal(first.from, 1);
  assert.equal(first.to, 15);
  assert.equal(second.items.length, 1);
  assert.equal(second.from, 16);
  assert.equal(second.to, 16);
  assert.equal(beyond.page, 2);
  assert.equal(beyond.items.length, 1);
});

test("paginar normaliza páginas inválidas y tamaños inválidos", () => {
  const students = Array.from({ length: 16 }, (_, index) =>
    makeStudent(`s-${index + 1}`),
  );

  for (const page of [0, -3, Number.NaN, 1.9]) {
    const result = paginateStudents(students, page);
    assert.equal(result.page, 1);
  }

  const custom = paginateStudents(students, 2, 5);
  assert.equal(custom.pageSize, 5);
  assert.equal(custom.totalPages, 4);
  assert.equal(custom.items.length, 5);
  assert.equal(custom.from, 6);
  assert.equal(custom.to, 10);

  const invalidSize = paginateStudents(students, 1, 0);
  assert.equal(invalidSize.pageSize, STUDENT_PAGE_SIZE);
});

test("paginar no muta el conjunto original", () => {
  const students = Array.from({ length: 16 }, (_, index) =>
    makeStudent(`s-${index + 1}`),
  );
  const snapshot = students.map((student) => student.id);

  paginateStudents(students, 2);

  assert.deepEqual(
    students.map((student) => student.id),
    snapshot,
  );
});
