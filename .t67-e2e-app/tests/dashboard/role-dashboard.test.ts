import assert from "node:assert/strict";
import { test } from "node:test";

import {
  showsTutorEmptyState,
  tutorGreeting,
} from "../../app/lib/dashboard/role-dashboard.ts";

test("solo el tutor muestra el estado vacío de alumnos", () => {
  assert.equal(showsTutorEmptyState("TUTOR"), true);
  assert.equal(showsTutorEmptyState("ADMINISTRADOR"), false);
  assert.equal(showsTutorEmptyState("ADMINISTRATIVO"), false);
});

test("el saludo del tutor incluye el nombre entre signos", () => {
  assert.equal(tutorGreeting("Ana"), "¡Hola, Ana!");
  assert.equal(tutorGreeting("  "), "¡Hola,   !");
});
