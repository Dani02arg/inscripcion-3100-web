import assert from "node:assert/strict";
import { test } from "node:test";

import {
  showsPendingRegistrationsCard,
  showsTutorEmptyState,
  tutorGreeting,
} from "../../app/lib/dashboard/role-dashboard.ts";

test("solo el tutor muestra el estado vacío de alumnos", () => {
  assert.equal(showsTutorEmptyState("TUTOR"), true);
  assert.equal(showsTutorEmptyState("ADMINISTRADOR"), false);
  assert.equal(showsTutorEmptyState("ADMINISTRATIVO"), false);
});

test("solo los roles altos ven el contador de pendientes", () => {
  assert.equal(showsPendingRegistrationsCard("ADMINISTRATIVO"), true);
  assert.equal(showsPendingRegistrationsCard("ADMINISTRADOR"), true);
  assert.equal(showsPendingRegistrationsCard("TUTOR"), false);
});

test("el saludo del tutor incluye el nombre entre signos", () => {
  assert.equal(tutorGreeting("Ana"), "¡Hola, Ana!");
  assert.equal(tutorGreeting("  "), "¡Hola,   !");
});
