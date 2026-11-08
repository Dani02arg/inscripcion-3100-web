import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSES_PATH,
  parseCourseFilters,
  sanitizeReturnPath,
  serializeCourseFilters,
} from "../../app/lib/courses/filters-url.ts";
import type { CourseFilters } from "../../app/lib/courses/types.ts";

function makeFilters(overrides: Partial<CourseFilters> = {}): CourseFilters {
  return {
    query: "",
    year: "all",
    cycle: "all",
    speciality: "all",
    shift: "all",
    ...overrides,
  };
}

test("usa los valores por defecto cuando la URL está vacía", () => {
  const state = parseCourseFilters("", 2026, [2026, 2025]);

  assert.deepEqual(state, {
    filters: {
      query: "",
      year: 2026,
      cycle: "all",
      speciality: "all",
      shift: "all",
    },
    page: 1,
  });
});

test("usa Todos los años si el año actual no está presente", () => {
  const state = parseCourseFilters("", 2026, [2025, 2024]);

  assert.equal(state.filters.year, "all");
});

test("lee todos los filtros y la página válidos", () => {
  const state = parseCourseFilters(
    "q=inform%C3%A1tica&year=2025&cycle=superior&speciality=electronics&shift=night&page=3",
    2026,
    [2026, 2025],
  );

  assert.deepEqual(state, {
    filters: {
      query: "informática",
      year: 2025,
      cycle: "superior",
      speciality: "electronics",
      shift: "night",
    },
    page: 3,
  });
});

test("recorta la búsqueda y acepta el año all explícito", () => {
  const state = parseCourseFilters("q=%20%20ana%20%20&year=all", 2026, [2026]);

  assert.equal(state.filters.query, "ana");
  assert.equal(state.filters.year, "all");
});

test("ignora año, enums y página inválidos", () => {
  for (const year of ["abc", "1999", "0", "-1", "1.5"]) {
    const state = parseCourseFilters(
      `year=${year}&cycle=unknown&speciality=unknown&shift=unknown&page=0`,
      2026,
      [2026, 2025],
    );

    assert.equal(state.filters.year, 2026);
    assert.equal(state.filters.cycle, "all");
    assert.equal(state.filters.speciality, "all");
    assert.equal(state.filters.shift, "all");
    assert.equal(state.page, 1);
  }
});

test("serializa filtros y página omitiendo página 1", () => {
  const query = serializeCourseFilters(
    makeFilters({
      query: "  informática ",
      year: 2025,
      cycle: "superior",
      speciality: "electronics",
      shift: "night",
    }),
    1,
  );
  const params = new URLSearchParams(query);

  assert.equal(params.get("q"), "informática");
  assert.equal(params.get("year"), "2025");
  assert.equal(params.get("cycle"), "superior");
  assert.equal(params.get("speciality"), "electronics");
  assert.equal(params.get("shift"), "night");
  assert.equal(params.get("page"), null);
});

test("serializa año all y página mayor que 1", () => {
  const params = new URLSearchParams(
    serializeCourseFilters(makeFilters({ year: "all" }), 3),
  );

  assert.equal(params.get("year"), "all");
  assert.equal(params.get("page"), "3");
});

test("omite búsqueda vacía y página inválida", () => {
  const params = new URLSearchParams(
    serializeCourseFilters(makeFilters({ query: "   " }), Number.NaN),
  );

  assert.equal(params.get("q"), null);
  assert.equal(params.get("page"), null);
});

test("conserva parámetros ajenos y reemplaza los del módulo", () => {
  const existing = new URLSearchParams(
    "utm=abc&year=2024&cycle=basic&page=9&q=viejo",
  );
  const params = new URLSearchParams(
    serializeCourseFilters(
      makeFilters({ query: "nuevo", year: 2026, cycle: "superior" }),
      2,
      existing,
    ),
  );

  assert.equal(params.get("utm"), "abc");
  assert.equal(params.get("q"), "nuevo");
  assert.equal(params.get("year"), "2026");
  assert.equal(params.get("cycle"), "superior");
  assert.equal(params.get("page"), "2");
});

test("lo serializado se vuelve a leer igual", () => {
  const filters = makeFilters({
    query: "  Básico  ",
    year: 2025,
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
  });
  const serialized = serializeCourseFilters(filters, 2);
  const parsed = parseCourseFilters(serialized, 2026, [2026, 2025]);

  assert.deepEqual(parsed.filters, {
    query: "Básico",
    year: 2025,
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
  });
  assert.equal(parsed.page, 2);
});

test("acepta rutas internas válidas del listado", () => {
  assert.equal(sanitizeReturnPath(COURSES_PATH), COURSES_PATH);
  assert.equal(
    sanitizeReturnPath(`${COURSES_PATH}?q=informatica&page=2`),
    `${COURSES_PATH}?q=informatica&page=2`,
  );
  assert.equal(
    sanitizeReturnPath(`${COURSES_PATH}/`),
    `${COURSES_PATH}/`,
  );
});

test("rechaza rutas externas, protocol-relative y con doble barra", () => {
  for (const value of [
    "https://example.com",
    "//evil.example.com",
    "/dashboard/courses//evil",
    "/dashboard/courses/%2F%2Fevil",
    "/dashboard/courses\\evil",
    "/dashboard",
    "/dashboard/courses-evil",
    "/dashboard/courses/123",
    "/dashboard/courses?next=//evil",
  ]) {
    assert.equal(sanitizeReturnPath(value), COURSES_PATH);
  }
});

test("usa el listado por defecto si no hay ruta de retorno", () => {
  assert.equal(sanitizeReturnPath(null), COURSES_PATH);
  assert.equal(sanitizeReturnPath(undefined), COURSES_PATH);
  assert.equal(sanitizeReturnPath(""), COURSES_PATH);
});
