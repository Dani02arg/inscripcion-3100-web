import assert from "node:assert/strict";
import { test } from "node:test";

import type { CurrentUserResult } from "../../app/lib/api/me.ts";
import { getEffectiveRole } from "../../app/lib/auth/effective-role.ts";
import type { SessionClaims } from "../../app/lib/auth/types.ts";
import { mapCurrentUserResult } from "../../app/lib/dashboard/private-account-state.ts";
import { toSidebarAccount } from "../../app/lib/sidebar/account.ts";
import { getRoleNavigation } from "../../app/lib/sidebar/navigation.ts";

const claims: SessionClaims = {
  sub: "user-1",
  email: "pedro@example.com",
  role: "TUTOR",
  exp: 1_792_502_671,
};

const user = {
  id: "user-1",
  name: "Pedro",
  lastname: "Pérez",
  email: "pedro@example.com",
  role: "TUTOR" as const,
};

test("un usuario obtenido produce el estado ok con claims y usuario", () => {
  const result: CurrentUserResult = {
    ok: true,
    user,
    message: "Usuario autenticado.",
  };

  assert.deepEqual(mapCurrentUserResult(claims, result), {
    status: "ok",
    claims,
    user,
  });
});

test("un 403 conserva los claims y devuelve forbidden", () => {
  const result: CurrentUserResult = {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: "No tenés permisos para acceder a esta sección.",
  };

  assert.deepEqual(mapCurrentUserResult(claims, result), {
    status: "forbidden",
    claims,
  });
});

test("un 401 se marca como unauthorized para que el cargador redirija", () => {
  const result: CurrentUserResult = {
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Tu sesión expiró. Iniciá sesión nuevamente.",
  };

  assert.deepEqual(mapCurrentUserResult(claims, result), {
    status: "unauthorized",
  });
});

test("un fallo general conserva el mensaje del servicio", () => {
  const result: CurrentUserResult = {
    ok: false,
    kind: "failed",
    status: null,
    message: "No se pudo cargar tu información. Intentá nuevamente.",
  };

  assert.deepEqual(mapCurrentUserResult(claims, result), {
    status: "error",
    claims,
    message: "No se pudo cargar tu información. Intentá nuevamente.",
  });
});

test("el estado ok alimenta el rol del menú y el pie de cuenta", () => {
  const state = mapCurrentUserResult(claims, {
    ok: true,
    user,
    message: "Usuario autenticado.",
  });

  assert.equal(state.status, "ok");

  if (state.status !== "ok") {
    return;
  }

  assert.deepEqual(
    getRoleNavigation(state.claims.role).map((item) => item.label),
    ["Inicio", "Notificaciones", "Mis hijos", "Inscripciones", "Mi perfil"],
  );
  assert.equal(toSidebarAccount(state).status, "ready");
});

test("el rol efectivo prioriza el perfil del servicio sobre los claims", () => {
  const state = mapCurrentUserResult(claims, {
    ok: true,
    user: { ...user, role: "ADMINISTRADOR" },
    message: "Usuario autenticado.",
  });

  assert.equal(getEffectiveRole(state), "ADMINISTRADOR");
});

test("el rol efectivo cae a los claims cuando la cuenta no está disponible", () => {
  const forbidden = mapCurrentUserResult(claims, {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: "No tenés permisos para acceder a esta sección.",
  });
  const failed = mapCurrentUserResult(claims, {
    ok: false,
    kind: "failed",
    status: 500,
    message: "No se pudo cargar tu información. Intentá nuevamente.",
  });

  assert.equal(getEffectiveRole(forbidden), "TUTOR");
  assert.equal(getEffectiveRole(failed), "TUTOR");
});

test("forbidden y error degradan el pie sin descartar la cuenta", () => {
  const forbidden = mapCurrentUserResult(claims, {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: "No tenés permisos para acceder a esta sección.",
  });
  const failed = mapCurrentUserResult(claims, {
    ok: false,
    kind: "failed",
    status: 500,
    message: "No se pudo cargar tu información. Intentá nuevamente.",
  });

  assert.equal(forbidden.status, "forbidden");
  assert.equal(failed.status, "error");

  if (forbidden.status !== "forbidden" || failed.status !== "error") {
    return;
  }

  assert.deepEqual(toSidebarAccount(forbidden), { status: "unavailable" });
  assert.deepEqual(toSidebarAccount(failed), { status: "unavailable" });
});
