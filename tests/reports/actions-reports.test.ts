import assert from "node:assert/strict";
import { test } from "node:test";

import type { ReportArtifactApiResult } from "../../app/lib/api/reports.ts";
import { REPORT_ACCESS_DENIED_MESSAGE } from "../../app/lib/reports/constants.ts";
import {
  generateEnrolledStudentsReportCore,
  generateStaffReportCore,
  type ReportsActionAccess,
} from "../../app/lib/reports/action-core.ts";
import { buildEnrolledStudentsPreview } from "../../app/lib/reports/enrolled-students.ts";
import {
  getInitialEnrolledStudentsFilterInputs,
  type FiltersAvailability,
} from "../../app/lib/reports/filters.ts";
import type { ParseEnrolledStudentsXlsxResult } from "../../app/lib/reports/xlsx-preview.ts";
import type {
  EnrolledStudentsFilterInputs,
  ReportArtifact,
  ReportFailure,
} from "../../app/lib/reports/types.ts";

const validArtifact: ReportArtifact = {
  base64: "UEsDBBQAAAAIAAAA", // placeholder; parseXlsx is injected in most tests
  contentType:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  filename: "listado-alumnos-inscriptos.xlsx",
  byteLength: 2048,
};

const staffArtifact: ReportArtifact = {
  base64: "JVBERi0xLjQK",
  contentType: "application/pdf",
  filename: "padron-personal.pdf",
  byteLength: 1024,
};

function okAccess(role: unknown): () => Promise<ReportsActionAccess> {
  return async () => ({ ok: true, token: "token-123", role });
}

function deniedAccess(failure: ReportFailure): () => Promise<ReportsActionAccess> {
  return async () => ({ ok: false, failure });
}

function apiSuccess(
  artifact: ReportArtifact,
): () => Promise<ReportArtifactApiResult> {
  return async () => ({ ok: true, artifact });
}

function apiFailure(failure: ReportFailure): () => Promise<ReportArtifactApiResult> {
  return async () => failure;
}

const defaultAvailability: FiltersAvailability = { year: [2024, 2025, 2026] };

function parseOk(rows: readonly (readonly string[])[]) {
  return (): ParseEnrolledStudentsXlsxResult => ({
    ok: true,
    preview: { rows, totalRows: rows.length },
  });
}

test("genera listado de alumnos con éxito: valida acceso/filtros, invoca API y retorna artefacto + preview derivada", async () => {
  let fetchedToken = "";
  let fetchedFilters: unknown = null;
  const inputs = getInitialEnrolledStudentsFilterInputs();
  const dataRows = [
    ["Ana", "Pérez", "123", "20123", "01/01/2010", "Calle 1", "2025", "1", "A", "Mañana", "Básica", "Tutor", "Uno", "1", "1", "t@e.com", "123"],
  ];

  const result = await generateEnrolledStudentsReportCore(inputs, defaultAvailability, {
    getAccess: okAccess("ADMINISTRATIVO"),
    fetchReport: async (token, filters) => {
      fetchedToken = token;
      fetchedFilters = filters;
      return { ok: true, artifact: validArtifact };
    },
    parseXlsx: parseOk(dataRows),
    buildPreview: buildEnrolledStudentsPreview,
  });

  assert.equal(fetchedToken, "token-123");
  assert.deepEqual(fetchedFilters, {
    year: null,
    studyYear: null,
    shift: null,
    speciality: null,
  });
  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("se esperaba éxito");
  assert.equal(result.artifact, validArtifact);
  assert.deepEqual(result.appliedFilters, {
    year: null,
    studyYear: null,
    shift: null,
    speciality: null,
  });
  assert.equal(result.preview.totalRows, 1);
  assert.equal(result.preview.visibleRows, 1);
  assert.equal(result.preview.hasMoreThanVisible, false);
  assert.equal(result.preview.rows[0]?.[0], "Ana");
});

test("permite filtros «Todos/Todas» con criterio sin opciones específicas (informativo, no bloqueante) según R1", async () => {
  const inputs = getInitialEnrolledStudentsFilterInputs();
  const availability: FiltersAvailability = { year: [] }; // sin opciones específicas

  const result = await generateEnrolledStudentsReportCore(inputs, availability, {
    getAccess: okAccess("ADMINISTRADOR"),
    fetchReport: apiSuccess(validArtifact),
    parseXlsx: parseOk([]),
    buildPreview: buildEnrolledStudentsPreview,
  });

  assert.equal(result.ok, true);
  if (!result.ok) assert.fail("se esperaba éxito");
  assert.equal(result.preview.isEmpty, true);
  assert.equal(result.preview.totalRows, 0);
});

test("rechaza filtros inválidos/no determinables sin invocar la API (R1)", async () => {
  let called = false;
  const inputs: EnrolledStudentsFilterInputs = {
    ...getInitialEnrolledStudentsFilterInputs(),
    year: "abc", // inválido
  };

  const result = await generateEnrolledStudentsReportCore(inputs, defaultAvailability, {
    getAccess: okAccess("ADMINISTRATIVO"),
    fetchReport: async () => {
      called = true;
      return { ok: true, artifact: validArtifact };
    },
    parseXlsx: parseOk([]),
    buildPreview: buildEnrolledStudentsPreview,
  });

  assert.equal(called, false);
  assert.equal(result.ok, false);
  if (result.ok) assert.fail("se esperaba error de validación");
  assert.equal(result.kind, "validation");

  let calledIndeterminate = false;
  const indeterminate = await generateEnrolledStudentsReportCore(
    getInitialEnrolledStudentsFilterInputs(),
    { year: null },
    {
      getAccess: okAccess("ADMINISTRATIVO"),
      fetchReport: async () => {
        calledIndeterminate = true;
        return { ok: true, artifact: validArtifact };
      },
      parseXlsx: parseOk([]),
      buildPreview: buildEnrolledStudentsPreview,
    },
  );

  assert.equal(calledIndeterminate, false);
  assert.equal(indeterminate.ok, false);
  if (indeterminate.ok) assert.fail("se esperaba error de validación");
  assert.equal(indeterminate.kind, "validation");
});

test("propaga 401, 403, 422 y timeout normalizados desde la API de alumnos", async () => {
  const baseDeps = {
    getAccess: okAccess("ADMINISTRATIVO"),
    parseXlsx: parseOk([]),
    buildPreview: buildEnrolledStudentsPreview,
  } as const;
  const inputs = getInitialEnrolledStudentsFilterInputs();

  const unauthorized = await generateEnrolledStudentsReportCore(inputs, defaultAvailability, {
    ...baseDeps,
    fetchReport: apiFailure({ ok: false, kind: "unauthorized", status: 401, message: "Sesión expirada" }),
  });
  assert.deepEqual(unauthorized, { ok: false, kind: "unauthorized", status: 401, message: "Sesión expirada" });

  const forbidden = await generateEnrolledStudentsReportCore(inputs, defaultAvailability, {
    ...baseDeps,
    fetchReport: apiFailure({ ok: false, kind: "forbidden", status: 403, message: "Sin permisos" }),
  });
  assert.equal(forbidden.ok, false);
  if (forbidden.ok) assert.fail();
  assert.equal(forbidden.kind, "forbidden");
  assert.equal(forbidden.status, 403);

  const validation = await generateEnrolledStudentsReportCore(inputs, defaultAvailability, {
    ...baseDeps,
    fetchReport: apiFailure({ ok: false, kind: "validation", status: 422, message: "Datos inválidos", fieldErrors: { year: "Año inválido" } }),
  });
  assert.equal(validation.ok, false);
  if (validation.ok) assert.fail();
  assert.equal(validation.kind, "validation");
  assert.deepEqual(validation.fieldErrors, { year: "Año inválido" });

  const timeout = await generateEnrolledStudentsReportCore(inputs, defaultAvailability, {
    ...baseDeps,
    fetchReport: apiFailure({ ok: false, kind: "timeout", status: null, message: "Tiempo agotado" }),
  });
  assert.equal(timeout.ok, false);
  if (timeout.ok) assert.fail();
  assert.equal(timeout.kind, "timeout");
});

test("deniega generación de padrón a ADMINISTRATIVO y permite a ADMINISTRADOR", async () => {
  let called = false;
  const denied = await generateStaffReportCore({
    getAccess: okAccess("ADMINISTRATIVO"),
    fetchReport: async () => {
      called = true;
      return { ok: true, artifact: staffArtifact };
    },
  });

  assert.equal(called, false);
  assert.equal(denied.ok, false);
  if (denied.ok) assert.fail("se esperaba denegación");
  assert.equal(denied.kind, "forbidden");
  assert.equal(denied.status, 403);
  assert.equal(denied.message, REPORT_ACCESS_DENIED_MESSAGE);

  const allowed = await generateStaffReportCore({
    getAccess: okAccess("ADMINISTRADOR"),
    fetchReport: apiSuccess(staffArtifact),
  });

  assert.equal(allowed.ok, true);
  if (!allowed.ok) assert.fail("se esperaba éxito");
  assert.equal(allowed.artifact, staffArtifact);
});

test("propaga errores de sesión y API en padrón (401/timeout)", async () => {
  const unauthorized = await generateStaffReportCore({
    getAccess: deniedAccess({ ok: false, kind: "unauthorized", status: 401, message: "Sesión expirada" }),
    fetchReport: apiSuccess(staffArtifact),
  });
  assert.equal(unauthorized.ok, false);
  if (unauthorized.ok) assert.fail();
  assert.equal(unauthorized.kind, "unauthorized");

  const timeout = await generateStaffReportCore({
    getAccess: okAccess("ADMINISTRADOR"),
    fetchReport: apiFailure({ ok: false, kind: "timeout", status: null, message: "Tiempo agotado" }),
  });
  assert.equal(timeout.ok, false);
  if (timeout.ok) assert.fail();
  assert.equal(timeout.kind, "timeout");
});

test("falla de forma controlada si el XLSX del listado no es interpretable", async () => {
  const result = await generateEnrolledStudentsReportCore(
    getInitialEnrolledStudentsFilterInputs(),
    defaultAvailability,
    {
      getAccess: okAccess("ADMINISTRADOR"),
      fetchReport: apiSuccess(validArtifact),
      parseXlsx: () => ({ ok: false, message: "No se pudo interpretar el archivo del reporte." }),
      buildPreview: buildEnrolledStudentsPreview,
    },
  );

  assert.equal(result.ok, false);
  if (result.ok) assert.fail();
  assert.equal(result.kind, "invalid-artifact");
});
