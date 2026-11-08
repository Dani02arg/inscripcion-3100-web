import assert from "node:assert/strict";
import { test } from "node:test";

import {
  USER_PAGE_SIZE,
  clearDirectoryFilters,
  filterDirectoryUsers,
  getDefaultDirectoryFilters,
  getDefaultUserFilters,
  hasActiveDirectoryFilters,
  hasActiveUserFilters,
  isIdentifierInput,
  isRoleFilter,
  normalizeIdentifier,
  normalizeUserId,
  paginateUserList,
} from "../../app/lib/users/list.ts";
import { ROLE_FILTER_OPTIONS } from "../../app/lib/users/labels.ts";
import type {
  DirectoryFilters,
  UserSummary,
} from "../../app/lib/users/types.ts";

function makeUser(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: "user-1",
    role: "TUTOR",
    name: "Ana",
    lastname: "Pérez",
    dni: "30111222",
    cuil: "20301112223",
    email: "ana@example.com",
    ...overrides,
  };
}

function filters(
  overrides: Partial<DirectoryFilters> = {},
): DirectoryFilters {
  return {
    ...getDefaultDirectoryFilters(),
    ...overrides,
  };
}

test("normaliza identificadores a solo dígitos", () => {
  assert.equal(normalizeIdentifier(" 30.111.222-3 "), "301112223");
  assert.equal(normalizeIdentifier("20-30111222-3"), "20301112223");
  assert.equal(normalizeIdentifier(""), "");
});

test("acepta identificadores vacíos o solo de dígitos", () => {
  assert.equal(isIdentifierInput(""), true);
  assert.equal(isIdentifierInput("   "), true);
  assert.equal(isIdentifierInput("30111222"), true);
  assert.equal(isIdentifierInput(" 30111222 "), true);
  assert.equal(isIdentifierInput("30.111.222"), false);
  assert.equal(isIdentifierInput("30 111 222"), false);
  assert.equal(isIdentifierInput("abc"), false);
});

test("normaliza el identificador de usuario a texto", () => {
  assert.equal(normalizeUserId(123), "123");
  assert.equal(normalizeUserId("abc-1"), "abc-1");
  assert.equal(normalizeUserId("  abc-1  "), "abc-1");
});

test("los filtros por defecto están vacíos y son independientes", () => {
  const first = getDefaultUserFilters();
  const second = getDefaultUserFilters();

  assert.deepEqual(first, {
    dni: "",
    cuil: "",
    name: "",
    lastname: "",
    email: "",
  });
  assert.notEqual(first, second);
  assert.deepEqual(getDefaultDirectoryFilters(), {
    ...first,
    role: "all",
  });
  assert.deepEqual(clearDirectoryFilters(), getDefaultDirectoryFilters());
});

test("detecta filtros activos ignorando espacios", () => {
  assert.equal(hasActiveUserFilters(getDefaultUserFilters()), false);
  assert.equal(
    hasActiveUserFilters({ ...getDefaultUserFilters(), name: "   " }),
    false,
  );
  assert.equal(
    hasActiveUserFilters({ ...getDefaultUserFilters(), dni: "30111222" }),
    true,
  );
  assert.equal(hasActiveDirectoryFilters(getDefaultDirectoryFilters()), false);
  assert.equal(
    hasActiveDirectoryFilters(filters({ role: "ADMINISTRADOR" })),
    true,
  );
});

test("valida el filtro de rol del directorio", () => {
  assert.equal(isRoleFilter("all"), true);
  assert.equal(isRoleFilter("ADMINISTRATIVO"), true);
  assert.equal(isRoleFilter("ADMINISTRADOR"), true);
  assert.equal(isRoleFilter("TUTOR"), false);
  assert.equal(isRoleFilter("OTRO"), false);
  assert.equal(isRoleFilter(null), false);
  assert.deepEqual(ROLE_FILTER_OPTIONS, [
    { value: "all", label: "Todos" },
    { value: "ADMINISTRATIVO", label: "Administrativo" },
    { value: "ADMINISTRADOR", label: "Administrador" },
  ]);
});

test("filtra nombre y apellido sin distinguir mayúsculas ni tildes", () => {
  const users = [
    makeUser({ id: "1", name: "Ana", lastname: "Pérez" }),
    makeUser({ id: "2", name: "José", lastname: "Gómez" }),
  ];

  assert.deepEqual(
    filterDirectoryUsers(users, filters({ name: "ANA" })).map((u) => u.id),
    ["1"],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ name: "jose" })).map((u) => u.id),
    ["2"],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ lastname: "perez" })).map(
      (u) => u.id,
    ),
    ["1"],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ lastname: "gomez" })).map(
      (u) => u.id,
    ),
    ["2"],
  );
});

test("filtra correo de forma parcial y sin distinguir mayúsculas", () => {
  const users = [
    makeUser({ id: "1", email: "ana@example.com" }),
    makeUser({ id: "2", email: "jose@escuela.edu.ar" }),
  ];

  assert.deepEqual(
    filterDirectoryUsers(users, filters({ email: "EXAMPLE" })).map(
      (u) => u.id,
    ),
    ["1"],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ email: "escuela" })).map(
      (u) => u.id,
    ),
    ["2"],
  );
});

test("filtra DNI y CUIL de forma exacta", () => {
  const users = [
    makeUser({ id: "1", dni: "30111222", cuil: "20301112223" }),
    makeUser({ id: "2", dni: "30111223", cuil: "20301112224" }),
  ];

  assert.deepEqual(
    filterDirectoryUsers(users, filters({ dni: "30111222" })).map(
      (u) => u.id,
    ),
    ["1"],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ dni: "3011122" })).map((u) => u.id),
    [],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ cuil: "20301112224" })).map(
      (u) => u.id,
    ),
    ["2"],
  );
});

test("filtra por rol y por todos los roles", () => {
  const users = [
    makeUser({ id: "1", role: "ADMINISTRATIVO" }),
    makeUser({ id: "2", role: "ADMINISTRADOR" }),
  ];

  assert.deepEqual(
    filterDirectoryUsers(users, filters({ role: "ADMINISTRADOR" })).map(
      (u) => u.id,
    ),
    ["2"],
  );
  assert.deepEqual(
    filterDirectoryUsers(users, filters({ role: "all" })).map((u) => u.id),
    ["1", "2"],
  );
});

test("combina filtros y no muta la entrada", () => {
  const users = [
    makeUser({
      id: "1",
      name: "Ana",
      lastname: "Pérez",
      role: "ADMINISTRATIVO",
      email: "ana@example.com",
    }),
    makeUser({
      id: "2",
      name: "Ana",
      lastname: "Gómez",
      role: "ADMINISTRADOR",
      email: "ana@escuela.edu.ar",
    }),
  ];
  const original = [...users];

  assert.deepEqual(
    filterDirectoryUsers(
      users,
      filters({
        name: "ana",
        lastname: "perez",
        role: "ADMINISTRATIVO",
      }),
    ).map((u) => u.id),
    ["1"],
  );
  assert.deepEqual(users, original);
});

test("combina los seis filtros del directorio sobre todo el conjunto", () => {
  const users = [
    makeUser({
      id: "1",
      name: "José",
      lastname: "Pérez",
      dni: "30111222",
      cuil: "20301112223",
      email: "jose@example.com",
      role: "ADMINISTRATIVO",
    }),
    makeUser({
      id: "2",
      name: "José",
      lastname: "Pérez",
      dni: "30111222",
      cuil: "20301112223",
      email: "jose@example.com",
      role: "ADMINISTRADOR",
    }),
  ];

  assert.deepEqual(
    filterDirectoryUsers(
      users,
      filters({
        name: "JOSE",
        lastname: "perez",
        dni: "30111222",
        cuil: "20301112223",
        email: "EXAMPLE",
        role: "ADMINISTRADOR",
      }),
    ).map((user) => user.id),
    ["2"],
  );
});

test("pagina de 10 en 10 con total, desde y hasta", () => {
  const users = Array.from({ length: 25 }, (_, index) =>
    makeUser({ id: String(index + 1) }),
  );

  const first = paginateUserList(users, 1);
  const third = paginateUserList(users, 3);

  assert.equal(USER_PAGE_SIZE, 10);
  assert.equal(first.items.length, 10);
  assert.equal(first.page, 1);
  assert.equal(first.total, 25);
  assert.equal(first.totalPages, 3);
  assert.equal(first.from, 1);
  assert.equal(first.to, 10);
  assert.equal(third.items.length, 5);
  assert.equal(third.from, 21);
  assert.equal(third.to, 25);
});

test("pagina el resultado filtrado y recalcula sus totales", () => {
  const users = Array.from({ length: 24 }, (_, index) =>
    makeUser({
      id: String(index + 1),
      role: index % 2 === 0 ? "ADMINISTRADOR" : "ADMINISTRATIVO",
    }),
  );
  const filteredUsers = filterDirectoryUsers(
    users,
    filters({ role: "ADMINISTRADOR" }),
  );
  const secondPage = paginateUserList(filteredUsers, 2);

  assert.equal(filteredUsers.length, 12);
  assert.equal(secondPage.total, 12);
  assert.equal(secondPage.totalPages, 2);
  assert.equal(secondPage.page, 2);
  assert.equal(secondPage.items.length, 2);
  assert.deepEqual(
    secondPage.items.map((user) => user.id),
    ["21", "23"],
  );
});

test("ajusta la página fuera de rango y admite tamaños válidos", () => {
  const users = Array.from({ length: 12 }, (_, index) =>
    makeUser({ id: String(index + 1) }),
  );

  assert.equal(paginateUserList(users, 0).page, 1);
  assert.equal(paginateUserList(users, 99).page, 2);
  assert.equal(paginateUserList(users, Number.NaN).page, 1);
  assert.equal(paginateUserList(users, 1, 5).items.length, 5);
  assert.equal(paginateUserList(users, 1, 0).items.length, 10);
  assert.equal(paginateUserList(users, 1, -3).items.length, 10);
});

test("pagina un conjunto vacío sin elementos", () => {
  const page = paginateUserList([], 4);

  assert.deepEqual(page.items, []);
  assert.equal(page.page, 1);
  assert.equal(page.total, 0);
  assert.equal(page.totalPages, 1);
  assert.equal(page.from, 0);
  assert.equal(page.to, 0);
});
