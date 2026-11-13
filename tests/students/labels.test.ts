import assert from "node:assert/strict";
import { test } from "node:test";

import {
  GENDER_OPTIONS,
  STUDENT_DELETE_UNAVAILABLE,
  STUDENT_NO_INFO_LABEL,
  STUDENT_NOTICES,
  STUDENT_UNKNOWN_LABEL,
  formatStudentDate,
  formatStudentFullName,
  formatStudentGender,
  formatStudentSortName,
  formatStudentText,
  getStudentRowActionsLabel,
  isGender,
} from "../../app/lib/students/labels.ts";

test("las etiquetas de dato ausente y valor desconocido son las de la spec", () => {
  assert.equal(STUDENT_NO_INFO_LABEL, "No informado");
  assert.equal(STUDENT_UNKNOWN_LABEL, "No disponible");
});

test("las opciones de género son las tres documentadas y están congeladas", () => {
  assert.deepEqual(
    GENDER_OPTIONS.map((option) => option.value),
    ["Masculino", "Femenino", "Otro"],
  );
  assert.deepEqual(
    GENDER_OPTIONS.map((option) => option.label),
    ["Masculino", "Femenino", "Otro"],
  );
  assert.equal(Object.isFrozen(GENDER_OPTIONS), true);

  for (const option of GENDER_OPTIONS) {
    assert.equal(Object.isFrozen(option), true);
  }
});

test("isGender acepta solo los tres valores documentados", () => {
  assert.equal(isGender("Masculino"), true);
  assert.equal(isGender("Femenino"), true);
  assert.equal(isGender("Otro"), true);

  for (const value of ["masculino", "MASCULINO", "Otro ", "", null, 1]) {
    assert.equal(isGender(value), false);
  }
});

test("el nombre completo respeta el orden nombre y apellido", () => {
  assert.equal(
    formatStudentFullName({ firstName: "Lucas", lastName: "Pérez" }),
    "Lucas Pérez",
  );
  assert.equal(
    formatStudentFullName({ firstName: "  Lucas ", lastName: " Pérez  " }),
    "Lucas Pérez",
  );
  assert.equal(
    formatStudentFullName({ firstName: "", lastName: "Pérez" }),
    "Pérez",
  );
  assert.equal(
    formatStudentFullName({ firstName: "Lucas", lastName: "  " }),
    "Lucas",
  );
  assert.equal(
    formatStudentFullName({ firstName: "", lastName: "" }),
    STUDENT_NO_INFO_LABEL,
  );
});

test("el nombre de fila y el nombre accesible usan apellido y nombre", () => {
  const student = { firstName: "Lucas", lastName: "Pérez" };

  assert.equal(formatStudentSortName(student), "Pérez, Lucas");
  assert.equal(getStudentRowActionsLabel(student), "Acciones de Pérez, Lucas");
  assert.equal(
    formatStudentSortName({ firstName: "", lastName: "Pérez" }),
    "Pérez",
  );
  assert.equal(
    formatStudentSortName({ firstName: "Lucas", lastName: "" }),
    "Lucas",
  );
  assert.equal(
    getStudentRowActionsLabel({ firstName: "", lastName: "" }),
    "Acciones de No informado",
  );
});

test("los textos opcionales se recortan o muestran «No informado»", () => {
  assert.equal(formatStudentText("  lucas@example.com  "), "lucas@example.com");
  assert.equal(formatStudentText("3874112233"), "3874112233");

  for (const value of ["", "   ", null, undefined]) {
    assert.equal(formatStudentText(value), STUDENT_NO_INFO_LABEL);
  }
});

test("las fechas se muestran en DD/MM/AAAA sin desplazamiento", () => {
  assert.equal(formatStudentDate("2010-08-20"), "20/08/2010");
  assert.equal(formatStudentDate("2000-01-01"), "01/01/2000");

  for (const value of [
    "",
    "2010-02-29",
    "20/08/2010",
    "2010-08-20T02:00:00Z",
    null,
    undefined,
  ]) {
    assert.equal(formatStudentDate(value), STUDENT_NO_INFO_LABEL);
  }
});

test("el género se presenta solo si es un valor documentado", () => {
  assert.equal(formatStudentGender("Masculino"), "Masculino");
  assert.equal(formatStudentGender("Femenino"), "Femenino");
  assert.equal(formatStudentGender("Otro"), "Otro");

  for (const value of ["masculino", "DESCONOCIDO", "", null, undefined]) {
    assert.equal(formatStudentGender(value), STUDENT_UNKNOWN_LABEL);
  }
});

test("los avisos de resultado y de baja no disponible son los de la spec", () => {
  assert.deepEqual(STUDENT_NOTICES, {
    created: "Alumno registrado correctamente",
    updated: "Alumno actualizado correctamente",
  });
  assert.deepEqual(STUDENT_DELETE_UNAVAILABLE, {
    title: "Baja no disponible",
    message:
      "La baja de alumnos todavía no está disponible en el servicio. El alumno no fue eliminado.",
    action: "Entendido",
  });
  assert.equal(Object.isFrozen(STUDENT_NOTICES), true);
  assert.equal(Object.isFrozen(STUDENT_DELETE_UNAVAILABLE), true);
});
