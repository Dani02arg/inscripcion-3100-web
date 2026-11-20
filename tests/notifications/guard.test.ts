import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canReadNotifications,
  canSendNotifications,
  NOTIFICATION_READER_ROLES,
  NOTIFICATION_SENDER_ROLES,
} from "../../app/lib/notifications/access.ts";
import {
  getNotificationPageDecision,
  getNotificationReadDecision,
  getNotificationSendDecision,
} from "../../app/lib/notifications/guard-decision.ts";
import type { PrivateAccountState } from "../../app/lib/dashboard/private-account-state.ts";

const claims = {
  sub: "1",
  email: "user@example.com",
  role: "TUTOR" as const,
  exp: 0,
};

function account(role: "TUTOR" | "ADMINISTRATIVO" | "ADMINISTRADOR"): PrivateAccountState {
  return {
    status: "ok",
    claims: { ...claims, role },
    user: {
      id: "1",
      name: "Ana",
      lastname: "Pérez",
      email: "ana@example.com",
      role,
    },
  };
}

test("los tres roles pueden leer notificaciones", () => {
  assert.deepEqual([...NOTIFICATION_READER_ROLES], [
    "TUTOR",
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);

  for (const role of NOTIFICATION_READER_ROLES) {
    assert.equal(canReadNotifications(role), true);
    assert.equal(getNotificationReadDecision(role), "allowed");
    assert.equal(getNotificationPageDecision(account(role)), "allowed");
  }
});

test("solo el staff puede enviar notificaciones", () => {
  assert.deepEqual([...NOTIFICATION_SENDER_ROLES], [
    "ADMINISTRATIVO",
    "ADMINISTRADOR",
  ]);
  assert.equal(canSendNotifications("TUTOR"), false);

  for (const role of NOTIFICATION_SENDER_ROLES) {
    assert.equal(canSendNotifications(role), true);
    assert.equal(getNotificationSendDecision(role), "allowed");
  }
});

test("roles desconocidos no acceden", () => {
  assert.equal(canReadNotifications("DESCONOCIDO"), false);
  assert.equal(canReadNotifications(null), false);
  assert.equal(canReadNotifications(42), false);
  assert.equal(getNotificationSendDecision("TUTOR"), "forbidden");
});

test("cuenta denegada o con error no habilita la página", () => {
  assert.equal(
    getNotificationPageDecision({
      status: "forbidden",
      claims,
    }),
    "forbidden",
  );

  assert.equal(
    getNotificationPageDecision({
      status: "error",
      claims,
      message: "Falló el perfil.",
    }),
    "error",
  );
});
