import assert from "node:assert/strict";
import { test } from "node:test";

import type { SessionClaims, UserRole } from "../../app/lib/auth/types.ts";
import type { PrivateAccountState } from "../../app/lib/dashboard/private-account-state.ts";
import {
  PROFILE_ACCESS_DENIED_MESSAGE,
  TUTOR_ACTION_DENIED_MESSAGE,
  USER_ACCESS_DENIED_MESSAGE,
  USER_SESSION_EXPIRED_PATH,
  getProfileAccessDecision,
  getProfilePageRoleDecision,
  getRoleRequestAccessDecision,
  getRoleRequestActionRoleDecision,
  getTutorActionRoleDecision,
  getTutorProfileAccessDecision,
  getUserAccessDecision,
  getUserActionRoleDecision,
  getUserPageRoleDecision,
} from "../../app/lib/users/guard-decision.ts";

function claims(role: UserRole): SessionClaims {
  return {
    sub: "user-1",
    email: "persona@example.com",
    role,
    exp: 1_792_502_671,
  };
}

function user(role: UserRole) {
  return {
    id: "user-1",
    name: "Ana",
    lastname: "Pérez",
    email: "persona@example.com",
    role,
  };
}

test("solo los roles gestores acceden a la gestión de usuarios", () => {
  assert.equal(getUserAccessDecision("ADMINISTRADOR"), "allowed");
  assert.equal(getUserAccessDecision("ADMINISTRATIVO"), "allowed");
  assert.equal(getUserAccessDecision("TUTOR"), "forbidden");
  assert.equal(getUserAccessDecision("OTRO"), "forbidden");
  assert.equal(getUserAccessDecision(null), "forbidden");
});

test("cualquier rol conocido accede a perfil y cuenta", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    assert.equal(getProfileAccessDecision(role), "allowed");
  }

  assert.equal(getProfileAccessDecision("OTRO"), "forbidden");
  assert.equal(getProfileAccessDecision(null), "forbidden");
});

test("solo TUTOR actualiza su perfil y solicita cambio de rol", () => {
  assert.equal(getTutorProfileAccessDecision("TUTOR"), "allowed");
  assert.equal(getTutorProfileAccessDecision("ADMINISTRADOR"), "forbidden");
  assert.equal(getRoleRequestAccessDecision("TUTOR"), "allowed");
  assert.equal(getRoleRequestAccessDecision("ADMINISTRATIVO"), "forbidden");
});

test("la página de usuarios usa el rol efectivo del perfil", () => {
  const adminProfile: PrivateAccountState = {
    status: "ok",
    claims: claims("TUTOR"),
    user: user("ADMINISTRADOR"),
  };
  const tutorProfile: PrivateAccountState = {
    status: "ok",
    claims: claims("ADMINISTRADOR"),
    user: user("TUTOR"),
  };

  assert.equal(getUserPageRoleDecision(adminProfile), "allowed");
  assert.equal(getUserPageRoleDecision(tutorProfile), "forbidden");
});

test("una cuenta denegada no habilita la página y un error se informa", () => {
  const forbidden: PrivateAccountState = {
    status: "forbidden",
    claims: claims("ADMINISTRADOR"),
  };
  const failed: PrivateAccountState = {
    status: "error",
    claims: claims("ADMINISTRADOR"),
    message: "No se pudo cargar.",
  };

  assert.equal(getUserPageRoleDecision(forbidden), "forbidden");
  assert.equal(getUserPageRoleDecision(failed), "error");
});

test("perfil y cuenta usan el rol efectivo y prevalece la cuenta denegada", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    assert.equal(
      getProfilePageRoleDecision({
        status: "ok",
        claims: claims("TUTOR"),
        user: user(role),
      }),
      "allowed",
    );
  }

  const tutor: PrivateAccountState = {
    status: "ok",
    claims: claims("ADMINISTRADOR"),
    user: user("TUTOR"),
  };
  const forbidden: PrivateAccountState = {
    status: "forbidden",
    claims: claims("ADMINISTRADOR"),
  };

  assert.equal(getProfilePageRoleDecision(tutor), "allowed");
  assert.equal(getProfilePageRoleDecision(forbidden), "forbidden");
});

test("las acciones de gestión usan el rol efectivo y respetan la cuenta denegada", () => {
  const tutorProfile: PrivateAccountState = {
    status: "ok",
    claims: claims("ADMINISTRADOR"),
    user: user("TUTOR"),
  };
  const adminProfile: PrivateAccountState = {
    status: "ok",
    claims: claims("TUTOR"),
    user: user("ADMINISTRADOR"),
  };
  const forbidden: PrivateAccountState = {
    status: "forbidden",
    claims: claims("ADMINISTRADOR"),
  };
  const failed: PrivateAccountState = {
    status: "error",
    claims: claims("ADMINISTRATIVO"),
    message: "Sin perfil.",
  };

  assert.equal(getUserActionRoleDecision(tutorProfile), "forbidden");
  assert.equal(getUserActionRoleDecision(adminProfile), "allowed");
  assert.equal(getUserActionRoleDecision(forbidden), "forbidden");
  assert.equal(getUserActionRoleDecision(failed), "allowed");
});

test("las acciones de tutor usan el rol efectivo", () => {
  const tutor: PrivateAccountState = {
    status: "ok",
    claims: claims("ADMINISTRADOR"),
    user: user("TUTOR"),
  };
  const admin: PrivateAccountState = {
    status: "ok",
    claims: claims("TUTOR"),
    user: user("ADMINISTRADOR"),
  };

  assert.equal(getTutorActionRoleDecision(tutor), "allowed");
  assert.equal(getTutorActionRoleDecision(admin), "forbidden");
  assert.equal(getRoleRequestActionRoleDecision(tutor), "allowed");
  assert.equal(getRoleRequestActionRoleDecision(admin), "forbidden");
});

test("expone la ruta de sesión vencida y los mensajes de denegación", () => {
  assert.equal(USER_SESSION_EXPIRED_PATH, "/session-expired");
  assert.equal(
    USER_ACCESS_DENIED_MESSAGE,
    "No tenés permisos para acceder a este módulo.",
  );
  assert.equal(
    PROFILE_ACCESS_DENIED_MESSAGE,
    "No tenés permisos para acceder a esta sección.",
  );
  assert.equal(
    TUTOR_ACTION_DENIED_MESSAGE,
    "Esta operación es exclusiva de tutores.",
  );
});
