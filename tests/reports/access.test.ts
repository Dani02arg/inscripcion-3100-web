import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REPORTS_ACCESS_ROLES,
  canAccessEnrolledStudentsReport,
  canAccessReports,
  canAccessStaffReport,
  getAllowedReportTypes,
  isReportsAccessRole,
} from "../../app/lib/reports/access.ts";

test("los roles administrativo y administrador acceden al módulo de reportes", () => {
  assert.equal(isReportsAccessRole("ADMINISTRATIVO"), true);
  assert.equal(isReportsAccessRole("ADMINISTRADOR"), true);
  assert.equal(canAccessReports("ADMINISTRATIVO"), true);
  assert.equal(canAccessReports("ADMINISTRADOR"), true);
});

test("tutor, roles desconocidos y valores inválidos no acceden al módulo de reportes", () => {
  for (const role of [
    "TUTOR",
    "SECRETARIO",
    "",
    null,
    undefined,
    1,
    {},
    [],
  ]) {
    assert.equal(isReportsAccessRole(role), false);
    assert.equal(canAccessReports(role), false);
  }
});

test("el administrativo solo tiene permitido el listado de alumnos inscriptos", () => {
  assert.deepEqual([...getAllowedReportTypes("ADMINISTRATIVO")], [
    "enrolled-students",
  ]);
  assert.equal(canAccessEnrolledStudentsReport("ADMINISTRATIVO"), true);
  assert.equal(canAccessStaffReport("ADMINISTRATIVO"), false);
});

test("el administrador tiene permitidos alumnos inscriptos y padrón de personal", () => {
  assert.deepEqual([...getAllowedReportTypes("ADMINISTRADOR")], [
    "enrolled-students",
    "staff",
  ]);
  assert.equal(canAccessEnrolledStudentsReport("ADMINISTRADOR"), true);
  assert.equal(canAccessStaffReport("ADMINISTRADOR"), true);
});

test("el acceso directo al padrón es denegado para administrativo, tutor y valores no autorizados", () => {
  for (const role of [
    "ADMINISTRATIVO",
    "TUTOR",
    "OTRO",
    "",
    null,
    undefined,
  ]) {
    assert.equal(canAccessStaffReport(role), false);
  }
});

test("roles sin acceso no tienen reportes permitidos", () => {
  for (const role of ["TUTOR", "OTRO", null, undefined, 1]) {
    assert.deepEqual([...getAllowedReportTypes(role)], []);
    assert.equal(canAccessEnrolledStudentsReport(role), false);
  }
});

test("el inventario de roles con acceso es inmutable y contiene administrativo y administrador", () => {
  assert.deepEqual([...REPORTS_ACCESS_ROLES], [
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);
  assert.equal(Object.isFrozen(REPORTS_ACCESS_ROLES), true);
});
