import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EDUCATION_LEVEL_LABELS,
  EDUCATION_LEVEL_OPTIONS,
  ROLE_FILTER_ALL_LABEL,
  ROLE_FILTER_OPTIONS,
  USER_NO_INFO_LABEL,
  USER_ROLE_FORM_OPTIONS,
  USER_UNKNOWN_LABEL,
  buildUserRowLabel,
  formatUserFullName,
  getEducationLevelLabel,
  getUserRoleLabel,
  isEducationLevel,
} from "../../app/lib/users/labels.ts";

test("etiqueta los tres roles en español", () => {
  assert.equal(getUserRoleLabel("TUTOR"), "Tutor");
  assert.equal(getUserRoleLabel("ADMINISTRATIVO"), "Administrativo");
  assert.equal(getUserRoleLabel("ADMINISTRADOR"), "Administrador");
});

test("un rol desconocido o vacío se muestra como no disponible", () => {
  assert.equal(getUserRoleLabel("SECRETARIO"), USER_UNKNOWN_LABEL);
  assert.equal(getUserRoleLabel(""), USER_UNKNOWN_LABEL);
  assert.equal(USER_UNKNOWN_LABEL, "No disponible");
});

test("etiqueta los cinco niveles educativos", () => {
  assert.equal(getEducationLevelLabel("PRIMARIO"), "Primario");
  assert.equal(getEducationLevelLabel("SECUNDARIO"), "Secundario");
  assert.equal(getEducationLevelLabel("TERCIARIO"), "Terciario");
  assert.equal(getEducationLevelLabel("UNIVERSITARIO"), "Universitario");
  assert.equal(getEducationLevelLabel("POSTGRADO"), "Postgrado");
});

test("un nivel ausente, desconocido o en minúsculas se muestra no informado", () => {
  assert.equal(getEducationLevelLabel(null), USER_NO_INFO_LABEL);
  assert.equal(getEducationLevelLabel(undefined), USER_NO_INFO_LABEL);
  assert.equal(getEducationLevelLabel(""), USER_NO_INFO_LABEL);
  assert.equal(getEducationLevelLabel("universitario"), USER_NO_INFO_LABEL);
  assert.equal(getEducationLevelLabel("DOCTORADO"), USER_NO_INFO_LABEL);
  assert.equal(USER_NO_INFO_LABEL, "No informado");
});

test("el type guard solo acepta los valores exactos del contrato", () => {
  for (const level of Object.keys(EDUCATION_LEVEL_LABELS)) {
    assert.equal(isEducationLevel(level), true);
  }

  assert.equal(isEducationLevel("universitario"), false);
  assert.equal(isEducationLevel("DOCTORADO"), false);
  assert.equal(isEducationLevel(null), false);
  assert.equal(isEducationLevel(1), false);
});

test("las opciones de rol del formulario incluyen los tres roles", () => {
  assert.deepEqual(
    USER_ROLE_FORM_OPTIONS.map((option) => option.value),
    ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"],
  );
  assert.deepEqual(
    USER_ROLE_FORM_OPTIONS.map((option) => option.label),
    ["Tutor", "Administrativo", "Administrador"],
  );
});

test("las opciones de filtro de rol empiezan por Todos y excluyen TUTOR", () => {
  assert.equal(ROLE_FILTER_ALL_LABEL, "Todos");
  assert.deepEqual(
    ROLE_FILTER_OPTIONS.map((option) => option.value),
    ["all", "ADMINISTRATIVO", "ADMINISTRADOR"],
  );
  assert.deepEqual(
    ROLE_FILTER_OPTIONS.map((option) => option.label),
    ["Todos", "Administrativo", "Administrador"],
  );
});

test("las opciones de nivel educativo respetan el orden del contrato", () => {
  assert.deepEqual(
    EDUCATION_LEVEL_OPTIONS.map((option) => option.value),
    [
      "PRIMARIO",
      "SECUNDARIO",
      "TERCIARIO",
      "UNIVERSITARIO",
      "POSTGRADO",
    ],
  );
  assert.deepEqual(
    EDUCATION_LEVEL_OPTIONS.map((option) => option.label),
    [
      "Primario",
      "Secundario",
      "Terciario",
      "Universitario",
      "Postgrado",
    ],
  );
});

test("formatea el nombre completo de la fila y el nombre accesible con los datos visibles", () => {
  assert.equal(
    formatUserFullName({ name: "  Ana ", lastname: " Pérez  " }),
    "Ana Pérez",
  );
  assert.equal(
    formatUserFullName({ name: "   ", lastname: "   " }),
    USER_NO_INFO_LABEL,
  );

  assert.equal(
    buildUserRowLabel({
      id: "user-1",
      role: "ADMINISTRADOR",
      name: "Ana",
      lastname: "Pérez",
      dni: "30111222",
      cuil: "20301112223",
      email: "ana@example.com",
    }),
    "Usuario Ana Pérez, DNI 30111222, correo ana@example.com, rol Administrador",
  );

  assert.equal(
    buildUserRowLabel({
      id: "user-2",
      role: "DESCONOCIDO",
      name: "Juan",
      lastname: "Gómez",
      dni: null,
      cuil: null,
      email: "   ",
    }),
    "Usuario Juan Gómez, DNI No informado, correo No informado, rol No disponible",
  );
});

