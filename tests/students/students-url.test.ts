import assert from "node:assert/strict";
import { test } from "node:test";

import { clearStudentFilters } from "../../app/lib/students/list.ts";
import {
  STUDENTS_PATH,
  STUDENT_NEW_PATH,
  getStudentListPath,
  getStudentReturnLabel,
  parseStudentUrl,
  sanitizeStudentReturnPath,
  serializeStudentFilters,
  studentDetailPath,
  studentEditPath,
  studentNewPath,
} from "../../app/lib/students/students-url.ts";

test("las rutas del módulo son las de la spec", () => {
  assert.equal(STUDENTS_PATH, "/dashboard/students");
  assert.equal(STUDENT_NEW_PATH, "/dashboard/students/new");
  assert.equal(studentNewPath(), "/dashboard/students/new");
});

test("las rutas de detalle y edición codifican el identificador", () => {
  assert.equal(
    studentDetailPath("student-1"),
    "/dashboard/students/student-1",
  );
  assert.equal(
    studentEditPath("student-1"),
    "/dashboard/students/student-1/edit",
  );
  assert.equal(
    studentDetailPath(" id con espacio "),
    "/dashboard/students/id%20con%20espacio",
  );
  assert.equal(studentDetailPath("  "), STUDENTS_PATH);
  assert.equal(studentEditPath(""), STUDENTS_PATH);
});

test("una dirección vacía produce filtros vacíos y página 1", () => {
  assert.deepEqual(parseStudentUrl(""), {
    filters: clearStudentFilters(),
    page: 1,
  });
});

test("se leen nombre, apellido y página, y se recortan", () => {
  assert.deepEqual(
    parseStudentUrl(
      new URLSearchParams({
        firstName: "  Ana ",
        lastName: " Pérez ",
        page: "3",
      }),
    ),
    {
      filters: {
        studentDni: "",
        studentCuil: "",
        firstName: "Ana",
        lastName: "Pérez",
      },
      page: 3,
    },
  );
});

test("las páginas inválidas se normalizan a 1", () => {
  for (const page of ["0", "-2", "abc", "1.9", ""]) {
    assert.equal(parseStudentUrl(`page=${page}`).page, 1);
  }
});

test("el DNI y el CUIL de la dirección se ignoran", () => {
  const parsed = parseStudentUrl(
    "studentDni=50123456&studentCuil=20501234567&dni=1&cuil=2&firstName=Ana",
  );

  assert.equal(parsed.filters.studentDni, "");
  assert.equal(parsed.filters.studentCuil, "");
  assert.equal(parsed.filters.firstName, "Ana");
});

test("se escriben solo nombre, apellido y página mayor a 1", () => {
  const filters = {
    ...clearStudentFilters(),
    firstName: " Ana ",
    lastName: "Pérez",
    studentDni: "50123456",
    studentCuil: "20501234567",
  };

  const query = serializeStudentFilters(filters, 2);
  const params = new URLSearchParams(query);

  assert.equal(params.get("firstName"), "Ana");
  assert.equal(params.get("lastName"), "Pérez");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("studentDni"), null);
  assert.equal(params.get("studentCuil"), null);

  const firstPage = new URLSearchParams(
    serializeStudentFilters(filters, 1),
  );
  assert.equal(firstPage.get("page"), null);
});

test("se conservan parámetros ajenos y se eliminan identificadores", () => {
  const existing = new URLSearchParams(
    "keep=1&studentDni=50123456&cuil=20&firstName=Viejo&page=9",
  );
  const result = serializeStudentFilters(
    {
      ...clearStudentFilters(),
      firstName: "Ana",
      lastName: "Pérez",
    },
    3,
    existing,
  );
  const params = new URLSearchParams(result);

  assert.equal(params.get("keep"), "1");
  assert.equal(params.get("firstName"), "Ana");
  assert.equal(params.get("lastName"), "Pérez");
  assert.equal(params.get("page"), "3");
  assert.equal(params.get("studentDni"), null);
  assert.equal(params.get("cuil"), null);
});

test("la dirección del listado incluye la query solo si hay valores", () => {
  assert.equal(
    getStudentListPath(clearStudentFilters(), 1),
    STUDENTS_PATH,
  );
  assert.equal(
    getStudentListPath(
      { ...clearStudentFilters(), firstName: "Ana" },
      2,
    ),
    `${STUDENTS_PATH}?firstName=Ana&page=2`,
  );
});

test("el retorno solo acepta el listado interno", () => {
  const listWithQuery = `${STUDENTS_PATH}?firstName=Ana&page=2`;

  assert.equal(sanitizeStudentReturnPath(listWithQuery), listWithQuery);
  assert.equal(
    sanitizeStudentReturnPath(`${STUDENTS_PATH}/`),
    `${STUDENTS_PATH}/`,
  );

  for (const value of [
    null,
    undefined,
    "",
    "https://example.com",
    "//evil.example",
    `${STUDENTS_PATH}/new`,
    `${STUDENTS_PATH}/student-1`,
    `${STUDENTS_PATH}-otros`,
    `${STUDENTS_PATH}\\algo`,
    `${STUDENTS_PATH}?x=1//2`,
  ]) {
    assert.equal(sanitizeStudentReturnPath(value), STUDENTS_PATH);
  }
});

test("el texto de regreso depende del rol", () => {
  assert.equal(getStudentReturnLabel("TUTOR"), "Volver a mis hijos");
  assert.equal(
    getStudentReturnLabel("ADMINISTRATIVO"),
    "Volver a alumnos",
  );
  assert.equal(
    getStudentReturnLabel("ADMINISTRADOR"),
    "Volver a alumnos",
  );
  assert.equal(getStudentReturnLabel(null), "Volver a alumnos");
});
