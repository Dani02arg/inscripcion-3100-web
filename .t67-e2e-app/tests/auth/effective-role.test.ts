import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getEffectiveRole,
  type EffectiveRoleSource,
} from "../../app/lib/auth/effective-role.ts";

test("prioriza el rol del perfil del servicio sobre el rol del token", () => {
  const account: EffectiveRoleSource = {
    status: "ok",
    user: { role: "ADMINISTRADOR" },
    claims: { role: "TUTOR" },
  };

  assert.equal(getEffectiveRole(account), "ADMINISTRADOR");
});

test("devuelve el rol del perfil aunque el token tenga otro rol", () => {
  const account: EffectiveRoleSource = {
    status: "ok",
    user: { role: "TUTOR" },
    claims: { role: "ADMINISTRADOR" },
  };

  assert.equal(getEffectiveRole(account), "TUTOR");
});

test("sin perfil disponible usa el rol del token cuando la cuenta está denegada", () => {
  const account: EffectiveRoleSource = {
    status: "forbidden",
    claims: { role: "ADMINISTRATIVO" },
  };

  assert.equal(getEffectiveRole(account), "ADMINISTRATIVO");
});

test("sin perfil disponible usa el rol del token cuando la cuenta tiene error", () => {
  const account: EffectiveRoleSource = {
    status: "error",
    claims: { role: "TUTOR" },
  };

  assert.equal(getEffectiveRole(account), "TUTOR");
});

test("usa el token cuando la cuenta está lista pero no trae usuario", () => {
  const account: EffectiveRoleSource = {
    status: "ok",
    claims: { role: "ADMINISTRATIVO" },
  };

  assert.equal(getEffectiveRole(account), "ADMINISTRATIVO");
});

test("usa el token cuando el usuario del perfil es nulo", () => {
  const account: EffectiveRoleSource = {
    status: "ok",
    user: null,
    claims: { role: "ADMINISTRADOR" },
  };

  assert.equal(getEffectiveRole(account), "ADMINISTRADOR");
});

test("usa el token cuando el rol del perfil no es conocido", () => {
  const account: EffectiveRoleSource = {
    status: "ok",
    user: { role: "DESCONOCIDO" },
    claims: { role: "TUTOR" },
  };

  assert.equal(getEffectiveRole(account), "TUTOR");
});

test("devuelve el rol del perfil cuando no hay token", () => {
  const account: EffectiveRoleSource = {
    status: "ok",
    user: { role: "ADMINISTRADOR" },
  };

  assert.equal(getEffectiveRole(account), "ADMINISTRADOR");
});

test("devuelve nulo sin rol de perfil ni de token", () => {
  const account: EffectiveRoleSource = { status: "forbidden" };

  assert.equal(getEffectiveRole(account), null);
});

test("devuelve nulo cuando el rol del token no es conocido", () => {
  const account: EffectiveRoleSource = {
    status: "error",
    claims: { role: "SUPERUSUARIO" },
  };

  assert.equal(getEffectiveRole(account), null);
});

test("devuelve nulo para una sesión no autorizada", () => {
  const account: EffectiveRoleSource = { status: "unauthorized" };

  assert.equal(getEffectiveRole(account), null);
});

test("devuelve nulo sin cuenta", () => {
  assert.equal(getEffectiveRole(null), null);
  assert.equal(getEffectiveRole(undefined), null);
});
