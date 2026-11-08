import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatReportOrder,
  formatReportTotal,
  formatReportValue,
  formatStudentName,
} from "../../app/lib/courses/report.ts";

test("formatea el total del reporte o No disponible", () => {
  assert.equal(formatReportTotal(0), "0");
  assert.equal(formatReportTotal(1234), "1.234");
  assert.equal(formatReportTotal(null), "No disponible");
});

test("usa números de orden secuenciales desde 1", () => {
  assert.equal(formatReportOrder(0), 1);
  assert.equal(formatReportOrder(1), 2);
  assert.equal(formatReportOrder(14), 15);
});

test("usa No informado para valores ausentes o vacíos", () => {
  assert.equal(formatReportValue("12345678"), "12345678");
  assert.equal(formatReportValue("  "), "No informado");
  assert.equal(formatReportValue(null), "No informado");
});

test("compone Apellido, Nombre y tolera datos faltantes", () => {
  assert.equal(
    formatStudentName({
      lastname: "Pérez",
      name: "Ana",
      dni: null,
      phone: null,
      email: null,
    }),
    "Pérez, Ana",
  );
  assert.equal(
    formatStudentName({
      lastname: "Pérez",
      name: null,
      dni: null,
      phone: null,
      email: null,
    }),
    "Pérez",
  );
  assert.equal(
    formatStudentName({
      lastname: null,
      name: "Ana",
      dni: null,
      phone: null,
      email: null,
    }),
    "Ana",
  );
  assert.equal(
    formatStudentName({
      lastname: null,
      name: null,
      dni: null,
      phone: null,
      email: null,
    }),
    "No informado",
  );
});
