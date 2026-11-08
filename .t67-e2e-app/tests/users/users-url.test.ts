import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STAFF_PATH,
  USERS_PATH,
  USER_FILTER_PARAM_KEYS,
  getUserOrigin,
  getUserOriginPath,
  parseUserFilters,
  sanitizeUserReturnPath,
  serializeUserFilters,
} from "../../app/lib/users/users-url.ts";
import { getDefaultUserFilters } from "../../app/lib/users/list.ts";

test("usa valores por defecto con una URL vacía", () => {
  const state = parseUserFilters("");

  assert.deepEqual(state.filters, getDefaultUserFilters());
  assert.equal(state.page, 1);
});

test("lee y recorta los filtros y la página", () => {
  const state = parseUserFilters(
    "dni=30111222&cuil=20301112223&name=%20Ana%20&lastname=P%C3%A9rez&email=ana%40example.com&page=3",
  );

  assert.deepEqual(state.filters, {
    dni: "30111222",
    cuil: "20301112223",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
  });
  assert.equal(state.page, 3);
});

test("descarta DNI y CUIL con caracteres inválidos", () => {
  const state = parseUserFilters(
    "dni=30.111.222&cuil=20-30111222-3&name=Ana",
  );

  assert.equal(state.filters.dni, "");
  assert.equal(state.filters.cuil, "");
  assert.equal(state.filters.name, "Ana");
});

test("ignora páginas inválidas o fuera de rango positivo", () => {
  assert.equal(parseUserFilters("page=0").page, 1);
  assert.equal(parseUserFilters("page=-2").page, 1);
  assert.equal(parseUserFilters("page=abc").page, 1);
  assert.equal(parseUserFilters("page=1.5").page, 1);
  assert.equal(parseUserFilters("page=12").page, 12);
});

test("serializa solo filtros activos y omite la página 1", () => {
  const query = serializeUserFilters(
    {
      dni: "30111222",
      cuil: "",
      name: " Ana ",
      lastname: "",
      email: "",
    },
    1,
  );
  const params = new URLSearchParams(query);

  assert.equal(params.get("dni"), "30111222");
  assert.equal(params.get("name"), "Ana");
  assert.equal(params.has("cuil"), false);
  assert.equal(params.has("lastname"), false);
  assert.equal(params.has("email"), false);
  assert.equal(params.has("page"), false);
});

test("serializa la página mayor que 1", () => {
  const query = serializeUserFilters(getDefaultUserFilters(), 4);

  assert.equal(new URLSearchParams(query).get("page"), "4");
});

test("reconstruye filtros y página después de navegar con una URL serializada", () => {
  const filters = {
    dni: "30111222",
    cuil: "",
    name: "Ana",
    lastname: "Pérez",
    email: "",
  };
  const query = serializeUserFilters(filters, 4);

  assert.deepEqual(parseUserFilters(query), { filters, page: 4 });
});

test("conserva parámetros ajenos y reemplaza los del módulo", () => {
  const existing = new URLSearchParams(
    "tab=1&dni=111&page=9&name=viejo",
  );
  const query = serializeUserFilters(
    {
      dni: "30111222",
      cuil: "",
      name: "",
      lastname: "",
      email: "",
    },
    2,
    existing,
  );
  const params = new URLSearchParams(query);

  assert.equal(params.get("tab"), "1");
  assert.equal(params.get("dni"), "30111222");
  assert.equal(params.get("page"), "2");
  assert.equal(params.has("name"), false);
});

test("lo serializado se vuelve a leer igual", () => {
  const filters = {
    dni: "30111222",
    cuil: "20301112223",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
  };
  const query = serializeUserFilters(filters, 5);
  const state = parseUserFilters(query);

  assert.deepEqual(state.filters, filters);
  assert.equal(state.page, 5);
});

test("expone las claves de filtros del padrón", () => {
  assert.deepEqual([...USER_FILTER_PARAM_KEYS], [
    "dni",
    "cuil",
    "name",
    "lastname",
    "email",
    "page",
  ]);
});

test("resuelve el origen del detalle y su ruta", () => {
  assert.equal(getUserOrigin("users"), "users");
  assert.equal(getUserOrigin("staff"), "staff");
  assert.equal(getUserOrigin("otro"), "users");
  assert.equal(getUserOrigin(null), "users");
  assert.equal(getUserOriginPath("users"), USERS_PATH);
  assert.equal(getUserOriginPath("staff"), STAFF_PATH);
  assert.equal(USERS_PATH, "/dashboard/users");
  assert.equal(STAFF_PATH, "/dashboard/users/staff");
});

test("sanea el retorno al padrón por defecto", () => {
  assert.equal(sanitizeUserReturnPath("staff"), STAFF_PATH);
  assert.equal(sanitizeUserReturnPath(STAFF_PATH), STAFF_PATH);
  assert.equal(sanitizeUserReturnPath(USERS_PATH), USERS_PATH);
  assert.equal(sanitizeUserReturnPath("users"), USERS_PATH);
  assert.equal(sanitizeUserReturnPath("https://externo.test"), USERS_PATH);
  assert.equal(sanitizeUserReturnPath("//externo"), USERS_PATH);
  assert.equal(sanitizeUserReturnPath(null), USERS_PATH);
});
