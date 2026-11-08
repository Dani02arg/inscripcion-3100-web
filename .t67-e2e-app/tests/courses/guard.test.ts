import assert from "node:assert/strict";
import { test } from "node:test";

import { getEffectiveRole } from "../../app/lib/auth/effective-role.ts";
import type { SessionClaims, UserRole } from "../../app/lib/auth/types.ts";
import {
  COURSE_ACCESS_DENIED_MESSAGE,
  COURSE_SESSION_EXPIRED_PATH,
  getCourseAccessDecision,
  getCourseActionRoleDecision,
  getCoursePageRoleDecision,
} from "../../app/lib/courses/guard-decision.ts";
import type { PrivateAccountState } from "../../app/lib/dashboard/private-account-state.ts";

function claimsWithRole(role: UserRole): SessionClaims {
  return {
    sub: "user-1",
    email: "persona@example.com",
    role,
    exp: 1_792_502_671,
  };
}

function userWithRole(role: UserRole) {
  return {
    id: "user-1",
    name: "Ana",
    lastname: "Pérez",
    email: "persona@example.com",
    role,
  };
}

test("permite el acceso solo a ADMINISTRATIVO y ADMINISTRADOR", () => {
  assert.equal(getCourseAccessDecision("ADMINISTRATIVO"), "allowed");
  assert.equal(getCourseAccessDecision("ADMINISTRADOR"), "allowed");
});

test("deniega TUTOR, roles desconocidos y valores inválidos", () => {
  for (const role of [
    "TUTOR",
    "SECRETARIO",
    "",
    null,
    undefined,
    1,
    {},
  ]) {
    assert.equal(getCourseAccessDecision(role), "forbidden");
  }
});

test("expone la ruta de sesión vencida y el mensaje de acceso denegado", () => {
  assert.equal(COURSE_SESSION_EXPIRED_PATH, "/session-expired");
  assert.equal(
    COURSE_ACCESS_DENIED_MESSAGE,
    "No tenés permisos para acceder a este módulo.",
  );
});

test("el rol del perfil prevalece en la guardia de cursos", () => {
  const account: PrivateAccountState = {
    status: "ok",
    claims: claimsWithRole("TUTOR"),
    user: userWithRole("ADMINISTRADOR"),
  };

  assert.equal(getEffectiveRole(account), "ADMINISTRADOR");
  assert.equal(getCoursePageRoleDecision(account), "allowed");
  assert.equal(getCourseActionRoleDecision(account), "allowed");
});

test("un perfil TUTOR prevalece sobre un token administrativo", () => {
  const account: PrivateAccountState = {
    status: "ok",
    claims: claimsWithRole("ADMINISTRADOR"),
    user: userWithRole("TUTOR"),
  };

  assert.equal(getCoursePageRoleDecision(account), "forbidden");
  assert.equal(getCourseActionRoleDecision(account), "forbidden");
});

test("ADMINISTRATIVO del perfil accede al módulo de cursos", () => {
  const account: PrivateAccountState = {
    status: "ok",
    claims: claimsWithRole("TUTOR"),
    user: userWithRole("ADMINISTRATIVO"),
  };

  assert.equal(getCoursePageRoleDecision(account), "allowed");
  assert.equal(getCourseActionRoleDecision(account), "allowed");
});

test("una cuenta denegada no habilita el acceso aunque el token tenga rol gestor", () => {
  const account: PrivateAccountState = {
    status: "forbidden",
    claims: claimsWithRole("ADMINISTRADOR"),
  };

  assert.equal(getCoursePageRoleDecision(account), "forbidden");
  assert.equal(getCourseActionRoleDecision(account), "forbidden");
});

test("un error de perfil cae al rol del token para la acción", () => {
  const account: PrivateAccountState = {
    status: "error",
    claims: claimsWithRole("ADMINISTRATIVO"),
    message: "No se pudo cargar tu información.",
  };

  assert.equal(getCoursePageRoleDecision(account), "error");
  assert.equal(getCourseActionRoleDecision(account), "allowed");
});
