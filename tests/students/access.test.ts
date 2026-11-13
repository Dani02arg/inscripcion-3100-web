import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENT_READER_ROLES,
  STUDENT_WRITER_ROLES,
  canAccessStudents,
  canCreateStudents,
  canEditStudents,
  canReadAllStudents,
  canWriteStudents,
  isStudentReaderRole,
  isTutorRole,
} from "../../app/lib/students/access.ts";

test("los tres roles conocidos acceden al módulo de alumnos", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    assert.equal(canAccessStudents(role), true);
  }
});

test("roles desconocidos y valores inválidos no acceden al módulo", () => {
  for (const role of ["SECRETARIO", "", null, undefined, 1, {}, []]) {
    assert.equal(canAccessStudents(role), false);
  }
});

test("solo los roles administrativos leen el padrón completo", () => {
  assert.equal(canReadAllStudents("ADMINISTRATIVO"), true);
  assert.equal(canReadAllStudents("ADMINISTRADOR"), true);
  assert.equal(canReadAllStudents("TUTOR"), false);
  assert.equal(canReadAllStudents("OTRO"), false);
  assert.equal(canReadAllStudents(null), false);
});

test("solo el tutor registra y edita alumnos", () => {
  assert.equal(canWriteStudents("TUTOR"), true);
  assert.equal(canWriteStudents("ADMINISTRATIVO"), false);
  assert.equal(canWriteStudents("ADMINISTRADOR"), false);
  assert.equal(canWriteStudents("OTRO"), false);

  assert.equal(canCreateStudents("TUTOR"), true);
  assert.equal(canCreateStudents("ADMINISTRADOR"), false);
  assert.equal(canEditStudents("TUTOR"), true);
  assert.equal(canEditStudents("ADMINISTRATIVO"), false);
});

test("el type guard del tutor solo acepta TUTOR", () => {
  assert.equal(isTutorRole("TUTOR"), true);
  assert.equal(isTutorRole("ADMINISTRADOR"), false);
  assert.equal(isTutorRole("ADMINISTRATIVO"), false);
  assert.equal(isTutorRole("otro"), false);
  assert.equal(isTutorRole(null), false);
});

test("el type guard de lectura acepta los tres roles y rechaza el resto", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    assert.equal(isStudentReaderRole(role), true);
  }

  for (const role of ["OTRO", "", null, undefined, 7]) {
    assert.equal(isStudentReaderRole(role), false);
  }
});

test("los inventarios de roles son inmutables", () => {
  assert.deepEqual([...STUDENT_READER_ROLES], [
    "TUTOR",
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);
  assert.deepEqual([...STUDENT_WRITER_ROLES], ["TUTOR"]);
  assert.equal(Object.isFrozen(STUDENT_READER_ROLES), true);
  assert.equal(Object.isFrozen(STUDENT_WRITER_ROLES), true);
});
