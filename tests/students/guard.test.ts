import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  CurrentUser,
  SessionClaims,
  UserRole,
} from "../../app/lib/auth/types.ts";
import type { PrivateAccountState } from "../../app/lib/dashboard/private-account-state.ts";
import {
  STUDENT_ACCESS_DENIED_MESSAGE,
  STUDENT_SECTION_ACCESS_DENIED_MESSAGE,
  STUDENT_SESSION_EXPIRED_PATH,
  STUDENT_WRITE_DENIED_MESSAGE,
  getStudentAccessDecision,
  getStudentActionRoleDecision,
  getStudentPageDecision,
  getStudentSectionAccessDecision,
  getStudentSectionDecision,
} from "../../app/lib/students/guard-decision.ts";

function claims(role: UserRole): SessionClaims {
  return {
    sub: "user-1",
    email: "persona@example.com",
    role,
    exp: 1_792_502_671,
  };
}

function user(role: UserRole): CurrentUser {
  return {
    id: "user-1",
    name: "Ana",
    lastname: "Pérez",
    email: "persona@example.com",
    role,
  };
}

function ok(
  role: UserRole,
  claimsRole: UserRole = role,
): PrivateAccountState {
  return {
    status: "ok",
    claims: claims(claimsRole),
    user: user(role),
  };
}

test("los tres roles conocidos acceden al módulo", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    assert.equal(getStudentAccessDecision(role), "allowed");
  }

  assert.equal(getStudentAccessDecision("OTRO"), "forbidden");
  assert.equal(getStudentAccessDecision(null), "forbidden");
});

test("lista y detalle admiten a los tres roles; alta y edición solo al tutor", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    assert.equal(
      getStudentSectionAccessDecision("list", role),
      "allowed",
    );
    assert.equal(
      getStudentSectionAccessDecision("detail", role),
      "allowed",
    );
  }

  assert.equal(getStudentSectionAccessDecision("new", "TUTOR"), "allowed");
  assert.equal(getStudentSectionAccessDecision("edit", "TUTOR"), "allowed");
  assert.equal(
    getStudentSectionAccessDecision("new", "ADMINISTRADOR"),
    "forbidden",
  );
  assert.equal(
    getStudentSectionAccessDecision("edit", "ADMINISTRATIVO"),
    "forbidden",
  );
  assert.equal(getStudentSectionAccessDecision("new", "OTRO"), "forbidden");
});

test("la página usa el rol efectivo del perfil", () => {
  assert.equal(getStudentPageDecision(ok("TUTOR"), "new"), "allowed");
  assert.equal(
    getStudentPageDecision(ok("ADMINISTRADOR"), "new"),
    "forbidden",
  );
  assert.equal(
    getStudentPageDecision(ok("ADMINISTRADOR"), "list"),
    "allowed",
  );
  assert.equal(
    getStudentPageDecision(ok("ADMINISTRATIVO"), "detail"),
    "allowed",
  );
});

test("si el perfil y el token difieren, prevalece el perfil del servicio", () => {
  const userTutorWithAdminToken = ok("TUTOR", "ADMINISTRADOR");
  const userAdminWithTutorToken = ok("ADMINISTRADOR", "TUTOR");

  assert.equal(
    getStudentPageDecision(userTutorWithAdminToken, "new"),
    "allowed",
  );
  assert.equal(
    getStudentPageDecision(userAdminWithTutorToken, "new"),
    "forbidden",
  );
});

test("una cuenta denegada no habilita la página y un error se informa", () => {
  const forbidden: PrivateAccountState = {
    status: "forbidden",
    claims: claims("TUTOR"),
  };
  const failed: PrivateAccountState = {
    status: "error",
    claims: claims("TUTOR"),
    message: "No se pudo cargar la cuenta.",
  };

  assert.equal(getStudentPageDecision(forbidden, "list"), "forbidden");
  assert.equal(getStudentPageDecision(forbidden, "new"), "forbidden");
  assert.equal(getStudentPageDecision(failed, "list"), "error");
  assert.equal(getStudentPageDecision(failed, "new"), "error");
});

test("la decisión de sección es equivalente a la decisión de página", () => {
  const account = ok("ADMINISTRADOR");

  for (const section of ["list", "detail", "new", "edit"] as const) {
    assert.equal(
      getStudentSectionDecision(account, section),
      getStudentPageDecision(account, section),
    );
  }
});

test("las acciones de escritura son exclusivas del tutor efectivo", () => {
  assert.equal(getStudentActionRoleDecision(ok("TUTOR")), "allowed");
  assert.equal(
    getStudentActionRoleDecision(ok("ADMINISTRATIVO")),
    "forbidden",
  );
  assert.equal(
    getStudentActionRoleDecision(ok("ADMINISTRADOR")),
    "forbidden",
  );
  assert.equal(
    getStudentActionRoleDecision(ok("TUTOR", "ADMINISTRADOR")),
    "allowed",
  );
  assert.equal(
    getStudentActionRoleDecision(ok("ADMINISTRADOR", "TUTOR")),
    "forbidden",
  );
});

test("una cuenta denegada bloquea la acción y un error cae al rol del token", () => {
  const forbidden: PrivateAccountState = {
    status: "forbidden",
    claims: claims("TUTOR"),
  };
  const tutorError: PrivateAccountState = {
    status: "error",
    claims: claims("TUTOR"),
    message: "Sin perfil.",
  };
  const adminError: PrivateAccountState = {
    status: "error",
    claims: claims("ADMINISTRADOR"),
    message: "Sin perfil.",
  };

  assert.equal(getStudentActionRoleDecision(forbidden), "forbidden");
  assert.equal(getStudentActionRoleDecision(tutorError), "allowed");
  assert.equal(getStudentActionRoleDecision(adminError), "forbidden");
});

test("expone la ruta de sesión vencida y los mensajes del módulo", () => {
  assert.equal(STUDENT_SESSION_EXPIRED_PATH, "/session-expired");
  assert.equal(
    STUDENT_ACCESS_DENIED_MESSAGE,
    "No tenés permisos para acceder a este módulo.",
  );
  assert.equal(
    STUDENT_SECTION_ACCESS_DENIED_MESSAGE,
    "No tenés permisos para acceder a esta sección.",
  );
  assert.equal(
    STUDENT_WRITE_DENIED_MESSAGE,
    "Esta operación es exclusiva de tutores.",
  );
});
