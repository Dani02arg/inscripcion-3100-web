import assert from "node:assert/strict";
import { test } from "node:test";

import {
  USER_MANAGER_ROLES,
  canAdministerUsers,
  canEditOwnProfile,
  canManageUsers,
  canRequestRoleChange,
  isUserManagerRole,
} from "../../app/lib/users/access.ts";

test("solo ADMINISTRATIVO y ADMINISTRADOR gestionan usuarios", () => {
  assert.equal(canManageUsers("ADMINISTRATIVO"), true);
  assert.equal(canManageUsers("ADMINISTRADOR"), true);
});

test("TUTOR, roles desconocidos y valores inválidos no gestionan usuarios", () => {
  for (const role of [
    "TUTOR",
    "SECRETARIO",
    "",
    null,
    undefined,
    1,
    {},
  ]) {
    assert.equal(canManageUsers(role), false);
  }
});

test("solo ADMINISTRADOR administra usuarios", () => {
  assert.equal(canAdministerUsers("ADMINISTRADOR"), true);
  assert.equal(canAdministerUsers("ADMINISTRATIVO"), false);
  assert.equal(canAdministerUsers("TUTOR"), false);
  assert.equal(canAdministerUsers(null), false);
});

test("solo TUTOR solicita cambio de rol", () => {
  assert.equal(canRequestRoleChange("TUTOR"), true);
  assert.equal(canRequestRoleChange("ADMINISTRATIVO"), false);
  assert.equal(canRequestRoleChange("ADMINISTRADOR"), false);
  assert.equal(canRequestRoleChange(undefined), false);
});

test("solo TUTOR edita su perfil", () => {
  assert.equal(canEditOwnProfile("TUTOR"), true);
  assert.equal(canEditOwnProfile("ADMINISTRATIVO"), false);
  assert.equal(canEditOwnProfile("ADMINISTRADOR"), false);
  assert.equal(canEditOwnProfile("DESCONOCIDO"), false);
});

test("el type guard acepta solo los roles gestores", () => {
  assert.equal(isUserManagerRole("ADMINISTRATIVO"), true);
  assert.equal(isUserManagerRole("ADMINISTRADOR"), true);
  assert.equal(isUserManagerRole("TUTOR"), false);
  assert.equal(isUserManagerRole("OTRO"), false);
});

test("el inventario de roles gestores es inmutable y no incluye TUTOR", () => {
  assert.deepEqual([...USER_MANAGER_ROLES], [
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);
  assert.equal(Object.isFrozen(USER_MANAGER_ROLES), true);
});
