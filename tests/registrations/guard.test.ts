import assert from "node:assert/strict";
import { test } from "node:test";

import type { UserRole } from "../../app/lib/auth/types.ts";
import type { PrivateAccountState } from "../../app/lib/dashboard/private-account-state.ts";
import {
  getRegistrationAccessDecision,
  getRegistrationActionRoleDecision,
  getRegistrationPageDecision,
  getRegistrationSectionAccessDecision,
} from "../../app/lib/registrations/guard-decision.ts";

function claims(role: UserRole) {
  return { sub: "u1", email: "a@b.c", role, exp: 9_999_999_999 };
}

function account(
  role: UserRole,
  status: "ok" | "forbidden" | "error" = "ok",
): PrivateAccountState {
  const c = claims(role);

  if (status === "forbidden") {
    return { status: "forbidden", claims: c };
  }

  if (status === "error") {
    return { status: "error", claims: c, message: "fallo" };
  }

  return {
    status: "ok",
    claims: c,
    user: { id: "u1", name: "A", lastname: "B", email: "a@b.c", role },
  };
}

test("los roles de staff acceden al módulo", () => {
  assert.equal(getRegistrationAccessDecision("ADMINISTRATIVO"), "allowed");
  assert.equal(getRegistrationAccessDecision("ADMINISTRADOR"), "allowed");
  assert.equal(getRegistrationAccessDecision("TUTOR"), "forbidden");
  assert.equal(getRegistrationAccessDecision(null), "forbidden");
});

test("la decisión por sección exige rol de staff", () => {
  assert.equal(
    getRegistrationSectionAccessDecision("list", "ADMINISTRATIVO"),
    "allowed",
  );
  assert.equal(
    getRegistrationSectionAccessDecision("detail", "ADMINISTRADOR"),
    "allowed",
  );
  assert.equal(
    getRegistrationSectionAccessDecision("detail", "TUTOR"),
    "forbidden",
  );
});

test("la decisión de página depende de la cuenta y el rol", () => {
  assert.equal(getRegistrationPageDecision(account("ADMINISTRATIVO")), "allowed");
  assert.equal(
    getRegistrationPageDecision(account("ADMINISTRADOR"), "detail"),
    "allowed",
  );
  assert.equal(getRegistrationPageDecision(account("TUTOR")), "forbidden");
  assert.equal(
    getRegistrationPageDecision(account("ADMINISTRADOR", "forbidden")),
    "forbidden",
  );
  assert.equal(
    getRegistrationPageDecision(account("ADMINISTRADOR", "error")),
    "error",
  );
});

test("la decisión de acción de dictamen es exclusiva de staff", () => {
  assert.equal(
    getRegistrationActionRoleDecision(account("ADMINISTRATIVO")),
    "allowed",
  );
  assert.equal(
    getRegistrationActionRoleDecision(account("ADMINISTRADOR")),
    "allowed",
  );
  assert.equal(getRegistrationActionRoleDecision(account("TUTOR")), "forbidden");
  assert.equal(
    getRegistrationActionRoleDecision(account("ADMINISTRADOR", "forbidden")),
    "forbidden",
  );
});
