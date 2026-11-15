import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_STATUS_TAB,
  REGISTRATION_STATUS_TABS,
  getStatusLabel,
  getStatusShortLabel,
  paramToStatus,
  statusToParam,
} from "../../app/lib/registrations/status.ts";

test("las pestañas de estado son seis y en el orden de la spec", () => {
  assert.deepEqual(
    REGISTRATION_STATUS_TABS.map((tab) => tab.value),
    [
      "ALL",
      "PENDING",
      "OBSERVED",
      "PROPOSED_REASSIGNMENT",
      "APPROVED",
      "REJECTED",
    ],
  );
  assert.deepEqual(
    REGISTRATION_STATUS_TABS.map((tab) => tab.label),
    [
      "Todas",
      "Pendientes",
      "Observadas",
      "Reasignadas",
      "Aprobadas",
      "Rechazadas",
    ],
  );
  assert.equal(DEFAULT_STATUS_TAB, "PENDING");
});

test("las pestañas son inmutables", () => {
  assert.equal(Object.isFrozen(REGISTRATION_STATUS_TABS), true);
  for (const tab of REGISTRATION_STATUS_TABS) {
    assert.equal(Object.isFrozen(tab), true);
  }
});

test("statusToParam traduce «Todas» a all y conserva los estados", () => {
  assert.equal(statusToParam("ALL"), "all");
  assert.equal(statusToParam("PENDING"), "PENDING");
  assert.equal(statusToParam("OBSERVED"), "OBSERVED");
  assert.equal(
    statusToParam("PROPOSED_REASSIGNMENT"),
    "PROPOSED_REASSIGNMENT",
  );
  assert.equal(statusToParam("APPROVED"), "APPROVED");
  assert.equal(statusToParam("REJECTED"), "REJECTED");
});

test("paramToStatus interpreta all, los estados y el valor ausente", () => {
  assert.equal(paramToStatus("all"), "ALL");
  assert.equal(paramToStatus("PENDING"), "PENDING");
  assert.equal(paramToStatus("OBSERVED"), "OBSERVED");
  assert.equal(paramToStatus("APPROVED"), "APPROVED");

  for (const value of [null, undefined, "", "INVALIDO", "pendiente"]) {
    assert.equal(paramToStatus(value), "PENDING");
  }
});

test("getStatusLabel y getStatusShortLabel devuelven los rótulos", () => {
  assert.equal(getStatusLabel("PENDING"), "Pendiente");
  assert.equal(
    getStatusLabel("PROPOSED_REASSIGNMENT"),
    "Propuesta de Reasignación",
  );
  assert.equal(getStatusShortLabel("PROPOSED_REASSIGNMENT"), "PR");
  assert.equal(getStatusShortLabel("REJECTED"), "R");
});
