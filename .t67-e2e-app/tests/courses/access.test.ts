import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_MANAGER_ROLES,
  canManageCourses,
  isCourseManagerRole,
} from "../../app/lib/courses/access.ts";

test("autoriza solo a ADMINISTRATIVO y ADMINISTRADOR", () => {
  assert.equal(canManageCourses("ADMINISTRATIVO"), true);
  assert.equal(canManageCourses("ADMINISTRADOR"), true);
  assert.deepEqual(COURSE_MANAGER_ROLES, [
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);
});

test("rechaza el rol TUTOR", () => {
  assert.equal(canManageCourses("TUTOR"), false);
  assert.equal(isCourseManagerRole("TUTOR"), false);
});

test("rechaza roles desconocidos y valores inválidos", () => {
  for (const role of [
    "SECRETARIO",
    "admin",
    "",
    " ADMINISTRADOR ",
    null,
    undefined,
    0,
    1,
    true,
    {},
    [],
  ]) {
    assert.equal(canManageCourses(role), false);
    assert.equal(isCourseManagerRole(role), false);
  }
});

test("el type guard acepta los roles del módulo", () => {
  assert.equal(isCourseManagerRole("ADMINISTRATIVO"), true);
  assert.equal(isCourseManagerRole("ADMINISTRADOR"), true);
});
