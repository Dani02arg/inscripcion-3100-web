import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATIONS_PATH,
  getRegistrationsListPath,
  parseRegistrationsUrl,
  registrationDetailPath,
  sanitizeRegistrationReturnPath,
  serializeRegistrationsFilters,
} from "../../app/lib/registrations/registrations-url.ts";
import { getDefaultFilters } from "../../app/lib/registrations/list.ts";

test("las rutas de listado y detalle son las de la spec", () => {
  assert.equal(REGISTRATIONS_PATH, "/dashboard/registrations");
  assert.equal(
    registrationDetailPath("abc-123"),
    "/dashboard/registrations/abc-123",
  );
  assert.equal(registrationDetailPath(""), "/dashboard/registrations");
});

test("parseRegistrationsUrl lee filtros, pestaña y página", () => {
  const state = parseRegistrationsUrl(
    "firstName=ana&lastName=gomez&year=2026&studyYear=2&division=1&cycle=basic&shift=afternoon&speciality=informatics&status=OBSERVED&page=3",
  );

  assert.deepEqual(state, {
    filters: {
      studentDni: "",
      studentCuil: "",
      firstName: "ana",
      lastName: "gomez",
      year: "2026",
      studyYear: "2",
      division: "1",
      cycle: "basic",
      shift: "afternoon",
      speciality: "informatics",
    },
    tab: "OBSERVED",
    page: 3,
  });
});

test("parseRegistrationsUrl descarta valores inválidos y usa los valores por defecto", () => {
  const state = parseRegistrationsUrl(
    "year=abcd&studyYear=9&cycle=INVALIDO&shift=INVALIDO&speciality=INVALIDO&status=INVALIDO&page=abc",
  );

  assert.equal(state.filters.year, "all");
  assert.equal(state.filters.studyYear, "all");
  assert.equal(state.filters.cycle, "all");
  assert.equal(state.filters.shift, "all");
  assert.equal(state.filters.speciality, "all");
  assert.equal(state.tab, "PENDING");
  assert.equal(state.page, 1);
});

test("parseRegistrationsUrl interpreta status=all como «Todas»", () => {
  assert.equal(parseRegistrationsUrl("status=all").tab, "ALL");
});

test("serializeRegistrationsFilters escribe lo no sensible y descarta lo sensible", () => {
  const query = serializeRegistrationsFilters(
    {
      studentDni: "12345678",
      studentCuil: "20123456789",
      firstName: "Ana",
      lastName: "Gómez",
      year: "2026",
      studyYear: "2",
      division: "1",
      cycle: "basic",
      shift: "afternoon",
      speciality: "informatics",
    },
    "OBSERVED",
    3,
  );

  const parsed = new URLSearchParams(query);
  assert.equal(parsed.get("firstName"), "Ana");
  assert.equal(parsed.get("lastName"), "Gómez");
  assert.equal(parsed.get("year"), "2026");
  assert.equal(parsed.get("studyYear"), "2");
  assert.equal(parsed.get("division"), "1");
  assert.equal(parsed.get("cycle"), "basic");
  assert.equal(parsed.get("shift"), "afternoon");
  assert.equal(parsed.get("speciality"), "informatics");
  assert.equal(parsed.get("status"), "OBSERVED");
  assert.equal(parsed.get("page"), "3");
  assert.equal(parsed.get("studentDni"), null);
  assert.equal(parsed.get("studentCuil"), null);
});

test("serializeRegistrationsFilters omite los valores por defecto", () => {
  const query = serializeRegistrationsFilters(getDefaultFilters(), "PENDING", 1);
  assert.equal(query, "");
});

test("serializeRegistrationsFilters conserva parámetros ajenos", () => {
  const existing = new URLSearchParams("foo=bar");
  const query = serializeRegistrationsFilters(
    { ...getDefaultFilters(), lastName: "Pérez" },
    "PENDING",
    1,
    existing,
  );

  const parsed = new URLSearchParams(query);
  assert.equal(parsed.get("foo"), "bar");
  assert.equal(parsed.get("lastName"), "Pérez");
});

test("getRegistrationsListPath arma la dirección del listado", () => {
  assert.equal(
    getRegistrationsListPath(getDefaultFilters(), "PENDING", 1),
    "/dashboard/registrations",
  );
  assert.equal(
    getRegistrationsListPath(getDefaultFilters(), "ALL", 1),
    "/dashboard/registrations?status=all",
  );
});

test("sanitizeRegistrationReturnPath solo acepta el listado", () => {
  assert.equal(
    sanitizeRegistrationReturnPath("/dashboard/registrations?status=PENDING"),
    "/dashboard/registrations?status=PENDING",
  );
  assert.equal(
    sanitizeRegistrationReturnPath("/dashboard/registrations"),
    "/dashboard/registrations",
  );
  assert.equal(
    sanitizeRegistrationReturnPath("/dashboard/registrations/abc"),
    "/dashboard/registrations",
  );
  assert.equal(
    sanitizeRegistrationReturnPath("https://evil.com"),
    "/dashboard/registrations",
  );
  assert.equal(sanitizeRegistrationReturnPath(null), "/dashboard/registrations");
  assert.equal(
    sanitizeRegistrationReturnPath("/dashboard//registrations"),
    "/dashboard/registrations",
  );
});
