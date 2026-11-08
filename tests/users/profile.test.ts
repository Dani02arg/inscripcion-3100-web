import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatEducationLevel,
  formatOptionalValue,
  formatProfileDate,
  formatProfileDateTime,
  getProfileDisplayName,
  getAccountDisplayFields,
  getOwnProfileSections,
  getTutorProfileValues,
  isTutorProfileComplete,
} from "../../app/lib/users/profile.ts";
import type { CurrentUser, UserRole } from "../../app/lib/auth/types.ts";

function ownProfile(
  role: UserRole,
  overrides: Partial<CurrentUser> = {},
): CurrentUser {
  return {
    id: "profile-1",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
    role,
    ...overrides,
  };
}

test("formatea una fecha sin hora como DD/MM/AAAA", () => {
  assert.equal(formatProfileDate("1990-01-15"), "15/01/1990");
  assert.equal(formatProfileDate("1990/01/15"), "15/01/1990");
  assert.equal(formatProfileDate("2026/11/06"), "06/11/2026");
  assert.equal(formatProfileDate(" 1990-01-15 "), "15/01/1990");
  assert.equal(formatProfileDate("1990-01-15T00:00:00Z"), "15/01/1990");
});

test("una fecha ausente o inválida se muestra no informada", () => {
  for (const value of [
    null,
    undefined,
    "",
    "   ",
    "15/01/1990",
    "1990-13-01",
    "1990-02-30",
    "1990/02/30",
  ]) {
    assert.equal(formatProfileDate(value), "No informado");
  }
});

test("formatea una marca de tiempo en la zona indicada", () => {
  assert.equal(
    formatProfileDateTime("2026-11-02T18:30:00Z", { timeZone: "UTC" }),
    "02/11/2026 18:30",
  );
  assert.equal(
    formatProfileDateTime("2026-11-02T18:30:00-03:00", {
      timeZone: "America/Argentina/Buenos_Aires",
    }),
    "02/11/2026 18:30",
  );
  assert.equal(
    formatProfileDateTime("2026-11-02T18:30:00-03:00", { timeZone: "UTC" }),
    "02/11/2026 21:30",
  );
});

test("una marca de tiempo inválida se muestra no informada", () => {
  for (const value of [null, undefined, "", "no-es-fecha"]) {
    assert.equal(formatProfileDateTime(value, { timeZone: "UTC" }), "No informado");
  }
});

test("usa No informado para valores opcionales ausentes o vacíos", () => {
  assert.equal(formatOptionalValue("Docente"), "Docente");
  assert.equal(formatOptionalValue("  Docente  "), "Docente");
  assert.equal(formatOptionalValue(""), "No informado");
  assert.equal(formatOptionalValue("   "), "No informado");
  assert.equal(formatOptionalValue(null), "No informado");
  assert.equal(formatOptionalValue(undefined), "No informado");
});

test("etiqueta el nivel educativo o informa su ausencia", () => {
  assert.equal(formatEducationLevel("UNIVERSITARIO"), "Universitario");
  assert.equal(formatEducationLevel("universitario"), "No informado");
  assert.equal(formatEducationLevel(null), "No informado");
});

test("considera completo el perfil de tutor con ocupación y nivel válidos", () => {
  assert.equal(
    isTutorProfileComplete({
      occupation: "Docente",
      educationLevel: "UNIVERSITARIO",
    }),
    true,
  );
  assert.equal(
    isTutorProfileComplete({ occupation: "   ", educationLevel: "UNIVERSITARIO" }),
    false,
  );
  assert.equal(
    isTutorProfileComplete({ occupation: "Docente", educationLevel: null }),
    false,
  );
  assert.equal(
    isTutorProfileComplete({ occupation: "Docente", educationLevel: "OTRO" }),
    false,
  );
});

test("reconcilia el formulario con ocupación y educación confirmadas por el servicio", () => {
  assert.deepEqual(
    getTutorProfileValues({
      occupation: "  Docente actualizado  ",
      educationLevel: "POSTGRADO",
    }),
    {
      occupation: "  Docente actualizado  ",
      educationLevel: "POSTGRADO",
    },
  );
  assert.deepEqual(
    getTutorProfileValues({
      occupation: null,
      educationLevel: "NIVEL_DESCONOCIDO",
    }),
    { occupation: "", educationLevel: "" },
  );
});

test("compone el nombre visible del perfil con respaldo", () => {
  assert.equal(
    getProfileDisplayName({ name: "Ana", lastname: "Pérez" }),
    "Ana Pérez",
  );
  assert.equal(
    getProfileDisplayName({ name: "  Ana  ", lastname: "  Pérez  " }),
    "Ana Pérez",
  );
  assert.equal(getProfileDisplayName({ name: "", lastname: "" }), "Cuenta");
  assert.equal(getProfileDisplayName({ name: null, lastname: null }), "Cuenta");
});

test("compone el perfil propio en tres secciones sin DNI ni CUIL", () => {
  const sections = getOwnProfileSections(
    ownProfile("ADMINISTRADOR", {
      birthdate: "1990-01-15",
      userPhone: "3415550101",
      occupation: "Docente",
      educationLevel: "UNIVERSITARIO",
      emailVerifiedAt: "2026-11-02T18:30:00Z",
    }),
  );

  assert.deepEqual(
    sections.map((section) => section.title),
    ["Datos personales", "Datos de contacto", "Datos de la cuenta"],
  );
  assert.deepEqual(
    sections[0]?.fields.map((field) => [field.label, field.value]),
    [
      ["Nombre", "Ana"],
      ["Apellido", "Pérez"],
      ["Fecha de nacimiento", "15/01/1990"],
      ["Teléfono", "3415550101"],
      ["Ocupación", "Docente"],
      ["Nivel educativo", "Universitario"],
    ],
  );
  assert.deepEqual(sections[1]?.fields, [
    { label: "Correo electrónico", value: "ana@example.com" },
  ]);
  assert.deepEqual(
    sections[2]?.fields.map((field) => [field.label, field.value]),
    [
      ["Correo electrónico", "ana@example.com"],
      ["Rol", "Administrador"],
      ["Verificación del correo", "Verificado"],
    ],
  );
  assert.equal(
    sections.flatMap((section) => section.fields).some(({ label }) =>
      ["DNI", "CUIL"].includes(label),
    ),
    false,
  );
});

test("compone solo nombre, apellido y correo de la configuración de cuenta", () => {
  assert.deepEqual(
    getAccountDisplayFields(ownProfile("TUTOR")),
    [
      { label: "Nombre", value: "Ana" },
      { label: "Apellido", value: "Pérez" },
      { label: "Correo electrónico", value: "ana@example.com" },
    ],
  );
});

test("muestra opcionales ausentes como No informado y correo sin verificar", () => {
  const sections = getOwnProfileSections(ownProfile("TUTOR"));

  assert.deepEqual(
    sections[0]?.fields.map((field) => field.value),
    [
      "Ana",
      "Pérez",
      "No informado",
      "No informado",
      "No informado",
      "No informado",
    ],
  );
  assert.deepEqual(
    sections[2]?.fields.map((field) => field.value),
    ["ana@example.com", "Tutor", "Sin verificar"],
  );
});

test("el estado de verificación del perfil propio es visible para todos los roles", () => {
  for (const role of ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    const sections = getOwnProfileSections(
      ownProfile(role, { emailVerifiedAt: "2026-11-02T18:30:00Z" }),
    );

    assert.equal(sections[2]?.fields[2]?.value, "Verificado");
  }
});
