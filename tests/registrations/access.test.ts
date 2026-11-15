import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_MANAGER_ROLES,
  canEvaluateRegistrations,
  isStaffRole,
} from "../../app/lib/registrations/access.ts";

test("los roles del staff acceden al módulo de inscripciones", () => {
  assert.equal(isStaffRole("ADMINISTRATIVO"), true);
  assert.equal(isStaffRole("ADMINISTRADOR"), true);
});

test("el tutor, roles desconocidos y valores inválidos no son staff", () => {
  for (const role of ["TUTOR", "SECRETARIO", "", null, undefined, 1, {}]) {
    assert.equal(isStaffRole(role), false);
  }
});

test("canEvaluateRegistrations coincide con isStaffRole", () => {
  assert.equal(canEvaluateRegistrations("ADMINISTRATIVO"), true);
  assert.equal(canEvaluateRegistrations("ADMINISTRADOR"), true);
  assert.equal(canEvaluateRegistrations("TUTOR"), false);
  assert.equal(canEvaluateRegistrations("OTRO"), false);
  assert.equal(canEvaluateRegistrations(null), false);
});

test("el inventario de roles es inmutable y contiene los dos roles", () => {
  assert.deepEqual([...REGISTRATION_MANAGER_ROLES], [
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);
  assert.equal(Object.isFrozen(REGISTRATION_MANAGER_ROLES), true);
});
