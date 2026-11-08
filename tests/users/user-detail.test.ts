import assert from "node:assert/strict";
import { test } from "node:test";

import { getUserDetailSections } from "../../app/lib/users/profile.ts";
import type { UserDetail } from "../../app/lib/users/types.ts";

function makeUser(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    id: "user-1",
    role: "ADMINISTRATIVO",
    name: "Ana",
    lastname: "Pérez",
    dni: "30111222",
    cuil: "27301112223",
    email: "ana@example.com",
    userPhone: "3874000000",
    occupation: "Docente",
    educationLevel: "UNIVERSITARIO",
    birthdate: "1990-01-15",
    emailVerifiedAt: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

test("compone las secciones administrativas sin mostrar auditoría", () => {
  const sections = getUserDetailSections(
    makeUser(),
    "ADMINISTRATIVO",
  );

  assert.deepEqual(
    sections.map(({ title }) => title),
    [
      "Datos personales",
      "Datos de contacto",
      "Información adicional",
      "Información de la cuenta",
    ],
  );
  assert.deepEqual(sections[0].fields, [
    { label: "Nombre", value: "Ana" },
    { label: "Apellido", value: "Pérez" },
    { label: "Fecha de nacimiento", value: "15/01/1990" },
    { label: "DNI", value: "30111222" },
    { label: "CUIL", value: "27301112223" },
  ]);
  assert.deepEqual(sections[1].fields, [
    { label: "Correo electrónico", value: "ana@example.com" },
    { label: "Teléfono", value: "3874000000" },
  ]);
  assert.deepEqual(sections[2].fields, [
    { label: "Ocupación", value: "Docente" },
    { label: "Nivel educativo", value: "Universitario" },
  ]);
  assert.deepEqual(sections[3].fields, [
    { label: "Rol", value: "Administrativo" },
    { label: "Verificación del correo", value: "No informado" },
  ]);
});

test("muestra Sin verificar al administrador y omite la fecha", () => {
  const sections = getUserDetailSections(
    makeUser({ createdAt: "2026-11-02T18:30:00Z", updatedAt: null }),
    "ADMINISTRADOR",
  );
  const accountFields = sections[3].fields;

  assert.deepEqual(accountFields.slice(0, 2), [
    { label: "Rol", value: "Administrativo" },
    { label: "Verificación del correo", value: "Sin verificar" },
  ]);
  assert.deepEqual(
    accountFields.slice(2).map(({ label }) => label),
    ["Fecha de creación", "Última actualización"],
  );
  assert.match(accountFields[2].value, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  assert.equal(accountFields[3].value, "No informado");
  assert.equal(
    accountFields.some(({ label }) => label === "Fecha de verificación"),
    false,
  );
});

test("muestra la verificación y su fecha al administrador cuando existe", () => {
  const sections = getUserDetailSections(
    makeUser({
      emailVerifiedAt: "2026-11-02T18:30:00Z",
      createdAt: "2025-01-03T10:15:00Z",
      updatedAt: "2025-02-04T11:20:00Z",
    }),
    "ADMINISTRADOR",
  );
  const accountFields = sections[3].fields;

  assert.deepEqual(accountFields.slice(0, 3), [
    { label: "Rol", value: "Administrativo" },
    { label: "Verificación del correo", value: "Verificado" },
    {
      label: "Fecha de verificación",
      value: accountFields[2].value,
    },
  ]);
  assert.match(accountFields[2].value, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  assert.deepEqual(
    accountFields.slice(3).map(({ label }) => label),
    ["Fecha de creación", "Última actualización"],
  );
});

test("muestra No informado en datos opcionales ausentes o inválidos", () => {
  const sections = getUserDetailSections(
    makeUser({
      dni: null,
      cuil: " ",
      email: null,
      userPhone: null,
      occupation: " ",
      educationLevel: "DESCONOCIDO",
      birthdate: "1990-02-30",
    }),
    "ADMINISTRATIVO",
  );

  assert.deepEqual(
    sections.slice(0, 3).map(({ fields }) =>
      fields.map(({ value }) => value),
    ),
    [
      [
        "Ana",
        "Pérez",
        "No informado",
        "No informado",
        "No informado",
      ],
      ["No informado", "No informado"],
      ["No informado", "No informado"],
    ],
  );
  assert.deepEqual(sections[3].fields, [
    { label: "Rol", value: "Administrativo" },
    { label: "Verificación del correo", value: "No informado" },
  ]);
});
