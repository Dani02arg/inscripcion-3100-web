import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_PAGE_SIZE,
  buildCourseSearchText,
  clearFilters,
  filterCourses,
  getCourseYears,
  getDefaultFilters,
  normalizeSearch,
  paginateCourses,
  sortCourses,
  summarizeCourses,
} from "../../app/lib/courses/list.ts";
import type {
  Course,
  CourseFilters,
} from "../../app/lib/courses/types.ts";

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    code: "2026-1-1-BAS-INF-M",
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: 30,
    currentCapacity: 12,
    availablePlaces: 18,
    status: "active",
    ...overrides,
  };
}

test("normaliza mayúsculas, acentos y espacios sobrantes", () => {
  assert.equal(normalizeSearch("  Informática   BÁSICA  "), "informatica basica");
  assert.equal(normalizeSearch("MAÑANA"), "manana");
  assert.equal(normalizeSearch("Electrónica"), "electronica");
});

test("una búsqueda vacía o de solo espacios queda vacía", () => {
  assert.equal(normalizeSearch(""), "");
  assert.equal(normalizeSearch("   "), "");
  assert.equal(normalizeSearch(" \t \n "), "");
});

test("incluye código y texto legible del curso", () => {
  const text = buildCourseSearchText(makeCourse());

  assert.match(text, /2026-1-1-bas-inf-m/);
  assert.match(text, /2026/);
  assert.match(text, /1/);
  assert.match(text, /basico/);
  assert.match(text, /informatica/);
  assert.match(text, /manana/);
  assert.match(text, /activo/);
});

test("normaliza acentos del texto legible", () => {
  const text = buildCourseSearchText(
    makeCourse({ speciality: "electronics", shift: "night" }),
  );

  assert.match(text, /electronica/);
  assert.match(text, /noche/);
  assert.equal(text.includes("Electrónica"), false);
});

test("omite el código ausente y los fragmentos vacíos", () => {
  const text = buildCourseSearchText(
    makeCourse({ code: null, division: "   " }),
  );

  assert.equal(text.includes("null"), false);
  assert.equal(text.includes("sin codigo"), false);
  assert.match(text, /2026/);
  assert.match(text, /basico/);
});

test("usa No disponible para valores desconocidos", () => {
  const text = buildCourseSearchText(
    makeCourse({
      cycle: "unknown-cycle",
      speciality: "unknown-speciality",
      shift: "unknown-shift",
      status: "unknown-status",
    }),
  );

  assert.match(text, /no disponible/);
  assert.equal(text.includes("unknown"), false);
});

test("el texto construido se puede comparar con la búsqueda normalizada", () => {
  const course = makeCourse({ speciality: "informatics" });
  const text = buildCourseSearchText(course);

  assert.ok(text.includes(normalizeSearch("  INFORMÁTICA ")));
  assert.ok(text.includes(normalizeSearch("2026-1-1-bas-inf-m")));
});

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

test("obtiene los años únicos en orden descendente", () => {
  assert.deepEqual(
    getCourseYears([
      makeCourse({ year: 2025 }),
      makeCourse({ year: 2026 }),
      makeCourse({ year: 2025 }),
      makeCourse({ year: 2024 }),
    ]),
    [2026, 2025, 2024],
  );
  assert.deepEqual(getCourseYears([]), []);
});

test("los filtros por defecto usan el año actual si existe", () => {
  assert.deepEqual(getDefaultFilters(2026, [2026, 2025]), {
    query: "",
    year: 2026,
    cycle: "all",
    speciality: "all",
    shift: "all",
  });
});

test("los filtros por defecto usan Todos los años si el actual no existe", () => {
  assert.equal(getDefaultFilters(2026, [2025, 2024]).year, "all");
  assert.equal(getDefaultFilters(2026, []).year, "all");
});

test("limpiar filtros restablece los valores por defecto", () => {
  assert.deepEqual(
    clearFilters(2026, [2026, 2025]),
    getDefaultFilters(2026, [2026, 2025]),
  );
});

test("filtra por año académico o por todos los años", () => {
  const courses = [
    makeCourse({ id: "a", year: 2026 }),
    makeCourse({ id: "b", year: 2025 }),
    makeCourse({ id: "c", year: 2025 }),
  ];

  assert.deepEqual(
    filterCourses(courses, makeFilters({ year: 2025 })).map((course) => course.id),
    ["b", "c"],
  );
  assert.equal(
    filterCourses(courses, makeFilters({ year: "all" })).length,
    courses.length,
  );
});

test("combina ciclo, especialidad y turno", () => {
  const courses = [
    makeCourse({ id: "match", cycle: "superior", speciality: "electronics", shift: "night" }),
    makeCourse({ id: "wrong-cycle", cycle: "basic", speciality: "electronics", shift: "night" }),
    makeCourse({ id: "wrong-speciality", cycle: "superior", speciality: "informatics", shift: "night" }),
    makeCourse({ id: "wrong-shift", cycle: "superior", speciality: "electronics", shift: "morning" }),
  ];

  const result = filterCourses(
    courses,
    makeFilters({ cycle: "superior", speciality: "electronics", shift: "night" }),
  );

  assert.deepEqual(result.map((course) => course.id), ["match"]);
});

test("la búsqueda se combina con los filtros y normaliza el término", () => {
  const courses = [
    makeCourse({ id: "match", division: "2", speciality: "informatics" }),
    makeCourse({ id: "wrong-division", division: "1", speciality: "informatics" }),
    makeCourse({ id: "wrong-speciality", division: "2", speciality: "electronics" }),
  ];

  const result = filterCourses(
    courses,
    makeFilters({ query: "  INFORMÁTICA  ", speciality: "informatics" }),
  );

  assert.deepEqual(result.map((course) => course.id), ["match", "wrong-division"]);
  assert.deepEqual(
    filterCourses(
      courses,
      makeFilters({ query: "  2   BÁSICO   INFORMÁTICA " }),
    ).map((course) => course.id),
    ["match"],
  );
});

test("una búsqueda de solo espacios no filtra resultados", () => {
  const courses = [makeCourse({ id: "a" }), makeCourse({ id: "b" })];

  assert.equal(filterCourses(courses, makeFilters({ query: "   " })).length, 2);
});

test("sin coincidencias devuelve una lista vacía", () => {
  const courses = [makeCourse({ id: "a", year: 2026 })];

  assert.deepEqual(filterCourses(courses, makeFilters({ query: "inexistente" })), []);
  assert.deepEqual(filterCourses(courses, makeFilters({ year: 2024 })), []);
});

test("no modifica el arreglo original", () => {
  const courses = [makeCourse({ id: "a", year: 2026 })];
  const snapshot = [...courses];

  filterCourses(courses, makeFilters({ year: 2025 }));

  assert.deepEqual(courses, snapshot);
});

test("ordena por año académico descendente", () => {
  const courses = [
    makeCourse({ id: "2024", year: 2024 }),
    makeCourse({ id: "2026", year: 2026 }),
    makeCourse({ id: "2025", year: 2025 }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["2026", "2025", "2024"],
  );
});

test("dentro del año ordena por cursada ascendente", () => {
  const courses = [
    makeCourse({ id: "tercero", studyYear: 3 }),
    makeCourse({ id: "primero", studyYear: 1 }),
    makeCourse({ id: "segundo", studyYear: 2 }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["primero", "segundo", "tercero"],
  );
});

test("ordena división numéricamente cuando ambos valores son números", () => {
  const courses = [
    makeCourse({ id: "diez", division: "10" }),
    makeCourse({ id: "dos", division: "2" }),
    makeCourse({ id: "uno", division: "1" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["uno", "dos", "diez"],
  );
});

test("ordena división alfabéticamente cuando no son ambos números", () => {
  const courses = [
    makeCourse({ id: "b", division: "B" }),
    makeCourse({ id: "a", division: "A" }),
    makeCourse({ id: "c", division: "C" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["a", "b", "c"],
  );
});

test("desempata 01 y 1 numéricamente por identificador", () => {
  const courses = [
    makeCourse({ id: "b", division: "01" }),
    makeCourse({ id: "a", division: "1" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["a", "b"],
  );
});

test("ordena turnos como Mañana, Tarde, Noche y deja los desconocidos al final", () => {
  const courses = [
    makeCourse({ id: "noche", shift: "night" }),
    makeCourse({ id: "desconocido", shift: "unknown" }),
    makeCourse({ id: "manana", shift: "morning" }),
    makeCourse({ id: "tarde", shift: "afternoon" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["manana", "tarde", "noche", "desconocido"],
  );
});

test("ordena ciclo y especialidad después del turno", () => {
  const courses = [
    makeCourse({ id: "superior-informatica", cycle: "superior", speciality: "informatics" }),
    makeCourse({ id: "basico-informatica", cycle: "basic", speciality: "informatics" }),
    makeCourse({ id: "basico-basica", cycle: "basic", speciality: "basic" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["basico-basica", "basico-informatica", "superior-informatica"],
  );
});

test("deja los ciclos y especialidades desconocidos al final", () => {
  const courses = [
    makeCourse({ id: "desconocido", cycle: "unknown", speciality: "unknown" }),
    makeCourse({ id: "superior", cycle: "superior", speciality: "electronics" }),
    makeCourse({ id: "basico", cycle: "basic", speciality: "basic" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["basico", "superior", "desconocido"],
  );
});

test("desempata por identificador al final", () => {
  const courses = [
    makeCourse({ id: "c" }),
    makeCourse({ id: "a" }),
    makeCourse({ id: "b" }),
  ];

  assert.deepEqual(
    sortCourses(courses).map((course) => course.id),
    ["a", "b", "c"],
  );
});

test("sortCourses no muta el arreglo original", () => {
  const courses = [
    makeCourse({ id: "2024", year: 2024 }),
    makeCourse({ id: "2026", year: 2026 }),
  ];
  const snapshot = [...courses];

  sortCourses(courses);

  assert.deepEqual(courses, snapshot);
});

test("pagina de 10 en 10 con total, desde y hasta", () => {
  const courses = Array.from({ length: 11 }, (_, index) =>
    makeCourse({ id: `course-${index + 1}` }),
  );

  const first = paginateCourses(courses, 1);
  assert.equal(first.items.length, COURSE_PAGE_SIZE);
  assert.equal(first.page, 1);
  assert.equal(first.pageSize, COURSE_PAGE_SIZE);
  assert.equal(first.total, 11);
  assert.equal(first.totalPages, 2);
  assert.equal(first.from, 1);
  assert.equal(first.to, 10);

  const second = paginateCourses(courses, 2);
  assert.equal(second.items.length, 1);
  assert.equal(second.page, 2);
  assert.equal(second.from, 11);
  assert.equal(second.to, 11);
});

test("ajusta la página fuera de rango a la primera o a la última", () => {
  const courses = Array.from({ length: 11 }, (_, index) =>
    makeCourse({ id: `course-${index + 1}` }),
  );

  assert.equal(paginateCourses(courses, 0).page, 1);
  assert.equal(paginateCourses(courses, -3).page, 1);
  assert.equal(paginateCourses(courses, Number.NaN).page, 1);
  assert.equal(paginateCourses(courses, 99).page, 2);
  assert.equal(paginateCourses(courses, 99).items.length, 1);
});

test("admite un tamaño de página distinto y uno inválido", () => {
  const courses = Array.from({ length: 25 }, (_, index) =>
    makeCourse({ id: `course-${index + 1}` }),
  );

  const third = paginateCourses(courses, 3, 10);
  assert.equal(third.page, 3);
  assert.equal(third.totalPages, 3);
  assert.equal(third.items.length, 5);
  assert.equal(third.from, 21);
  assert.equal(third.to, 25);

  const fallback = paginateCourses(courses, 1, 0);
  assert.equal(fallback.pageSize, COURSE_PAGE_SIZE);
  assert.equal(fallback.items.length, COURSE_PAGE_SIZE);
});

test("ajusta la página si la última queda vacía tras una eliminación", () => {
  const courses = Array.from({ length: 11 }, (_, index) =>
    makeCourse({ id: `course-${index + 1}` }),
  );
  const pageTwo = paginateCourses(courses, 2);
  assert.equal(pageTwo.items.length, 1);

  const afterDelete = courses.filter(
    (course) => course.id !== "course-11",
  );
  const adjusted = paginateCourses(afterDelete, 2);

  assert.equal(adjusted.page, 1);
  assert.equal(adjusted.totalPages, 1);
  assert.equal(adjusted.items.length, COURSE_PAGE_SIZE);
});

test("pagina un conjunto vacío en la página 1 sin elementos", () => {
  const result = paginateCourses([], 5);

  assert.deepEqual(result, {
    items: [],
    page: 1,
    pageSize: COURSE_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    from: 0,
    to: 0,
  });
});

test("resume total, activos y capacidad máxima", () => {
  const courses = [
    makeCourse({ id: "a", status: "active", maxCapacity: 30 }),
    makeCourse({ id: "b", status: "inactive", maxCapacity: 20 }),
    makeCourse({ id: "c", status: "active", maxCapacity: 10 }),
  ];

  assert.deepEqual(summarizeCourses(courses), {
    total: 3,
    active: 2,
    maxCapacityTotal: 60,
  });
});

test("resume un conjunto vacío en cero", () => {
  assert.deepEqual(summarizeCourses([]), {
    total: 0,
    active: 0,
    maxCapacityTotal: 0,
  });
});

test("la capacidad total queda no disponible ante valores inválidos", () => {
  assert.equal(
    summarizeCourses([
      makeCourse({ id: "a", maxCapacity: 30 }),
      makeCourse({ id: "b", maxCapacity: 0 }),
    ]).maxCapacityTotal,
    null,
  );
  assert.equal(
    summarizeCourses([
      makeCourse({ id: "a", maxCapacity: 30 }),
      makeCourse({ id: "b", maxCapacity: -1 }),
    ]).maxCapacityTotal,
    null,
  );
  assert.equal(
    summarizeCourses([
      makeCourse({ id: "a", maxCapacity: 30 }),
      makeCourse({ id: "b", maxCapacity: 1.5 }),
    ]).maxCapacityTotal,
    null,
  );
});

test("no cuenta estados desconocidos como activos", () => {
  const summary = summarizeCourses([
    makeCourse({ id: "a", status: "active" }),
    makeCourse({ id: "b", status: "unknown" }),
  ]);

  assert.equal(summary.active, 1);
});
