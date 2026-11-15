import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_NO_INFO_LABEL,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_SHORT_LABELS,
  REGISTRATION_UNKNOWN_LABEL,
  buildCardLabel,
  formatRegistrationDate,
  formatRegistrationStudentName,
  getCycleLabel,
  getShiftLabel,
  getSpecialityLabel,
  isRegistrationStatus,
} from "../../app/lib/registrations/labels.ts";

test("las etiquetas de dato ausente y valor desconocido son las de la spec", () => {
  assert.equal(REGISTRATION_NO_INFO_LABEL, "No informado");
  assert.equal(REGISTRATION_UNKNOWN_LABEL, "No disponible");
});

test("los nombres completos de estado son los de la spec", () => {
  assert.deepEqual(REGISTRATION_STATUS_LABELS, {
    PENDING: "Pendiente",
    OBSERVED: "Observada",
    PROPOSED_REASSIGNMENT: "Propuesta de Reasignación",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
  });
});

test("las etiquetas cortas de estado son P/O/PR/A/R", () => {
  assert.deepEqual(REGISTRATION_STATUS_SHORT_LABELS, {
    PENDING: "P",
    OBSERVED: "O",
    PROPOSED_REASSIGNMENT: "PR",
    APPROVED: "A",
    REJECTED: "R",
  });
});

test("isRegistrationStatus acepta solo los cinco estados documentados", () => {
  for (const value of [
    "PENDING",
    "OBSERVED",
    "PROPOSED_REASSIGNMENT",
    "APPROVED",
    "REJECTED",
  ]) {
    assert.equal(isRegistrationStatus(value), true);
  }

  for (const value of ["pending", "ALL", "PENDIENTE", "", null, 1]) {
    assert.equal(isRegistrationStatus(value), false);
  }
});

test("las etiquetas de ciclo, turno y especialidad reutilizan las de Cursos", () => {
  assert.equal(getCycleLabel("basic"), "Básico");
  assert.equal(getCycleLabel("superior"), "Superior");
  assert.equal(getCycleLabel("otro"), "No disponible");

  assert.equal(getShiftLabel("morning"), "Mañana");
  assert.equal(getShiftLabel("afternoon"), "Tarde");
  assert.equal(getShiftLabel("night"), "Noche");
  assert.equal(getShiftLabel("otro"), "No disponible");

  assert.equal(getSpecialityLabel("basic"), "Básica");
  assert.equal(getSpecialityLabel("informatics"), "Informática");
  assert.equal(getSpecialityLabel("electronics"), "Electrónica");
  assert.equal(getSpecialityLabel("otro"), "No disponible");
});

test("los instantes se muestran como DD/MM/AAAA HH:mm", () => {
  assert.equal(
    formatRegistrationDate("2026-10-31T15:30:00Z", { timeZone: "UTC" }),
    "31/10/2026 15:30",
  );

  for (const value of ["", "   ", "no-es-fecha", null, undefined]) {
    assert.equal(formatRegistrationDate(value), REGISTRATION_NO_INFO_LABEL);
  }
});

test("el nombre de alumno y la tarjeta respetan apellido y nombre", () => {
  assert.equal(
    formatRegistrationStudentName({ firstName: "Lucas", lastName: "Pérez" }),
    "Pérez, Lucas",
  );
  assert.equal(
    formatRegistrationStudentName({
      firstName: "  Lucas ",
      lastName: " Pérez ",
    }),
    "Pérez, Lucas",
  );
  assert.equal(
    formatRegistrationStudentName({ firstName: "", lastName: "Pérez" }),
    "Pérez",
  );
  assert.equal(
    formatRegistrationStudentName({ firstName: "Lucas", lastName: "" }),
    "Lucas",
  );
  assert.equal(
    formatRegistrationStudentName({ firstName: "", lastName: "" }),
    REGISTRATION_NO_INFO_LABEL,
  );

  assert.equal(
    buildCardLabel({
      student: {
        id: "s1",
        studentCuil: "c",
        firstName: "Lucas",
        lastName: "Pérez",
      },
    }),
    "Inscripción de Pérez, Lucas",
  );
});
