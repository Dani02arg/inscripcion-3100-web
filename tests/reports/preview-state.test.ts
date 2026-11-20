import assert from "node:assert/strict";
import { test } from "node:test";

import { EMPTY_ENROLLED_STUDENTS_MESSAGE } from "../../app/lib/reports/constants.ts";
import {
  failEnrolledStudentsGeneration,
  failStaffAutoGeneration,
  failStaffGeneration,
  failStaffVisualization,
  getDownloadRetryIntent,
  getEnrolledStudentsGenerationRetryIntent,
  getInitialEnrolledStudentsPreviewStatus,
  getInitialStaffPreviewStatus,
  getStaffGenerationRetryIntent,
  hasEnrolledStudentsCurrentArtifact,
  hasStaffCurrentArtifact,
  keepEnrolledStudentsPreviewAfterDownload,
  keepEnrolledStudentsPreviewOnApplyError,
  keepEnrolledStudentsPreviewOnClearFilters,
  keepStaffPreviewAfterDownload,
  resetEnrolledStudentsPreviewOnReportChange,
  resetStaffPreviewOnReportChange,
  startEnrolledStudentsGeneration,
  startStaffGeneration,
  succeedEnrolledStudentsGeneration,
  succeedStaffGeneration,
} from "../../app/lib/reports/preview-state.ts";
import type {
  EnrolledStudentsAppliedFilters,
  EnrolledStudentsGenerateSuccess,
  EnrolledStudentsPreviewData,
  ReportArtifact,
} from "../../app/lib/reports/types.ts";

const appliedFilters: EnrolledStudentsAppliedFilters = {
  year: 2025,
  studyYear: 2,
  shift: "morning",
  speciality: null,
};

const artifact: ReportArtifact = {
  base64: "UEsDBBQAAAAIAA==",
  contentType:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  filename: "alumnos-inscriptos.xlsx",
  byteLength: 2048,
};

const staffArtifact: ReportArtifact = {
  base64: "JVBERi0xLjcK",
  contentType: "application/pdf",
  filename: "padron-personal.pdf",
  byteLength: 1024,
};

const readyPreview: EnrolledStudentsPreviewData = {
  columns: [
    "Nombre",
    "Apellido",
    "DNI",
    "CUIL",
    "Fecha de nacimiento",
    "Domicilio",
    "Año lectivo",
    "Año de estudio",
    "División",
    "Turno",
    "Carrera",
    "Nombre del tutor",
    "Apellido del tutor",
    "DNI del tutor",
    "CUIL del tutor",
    "Email del tutor",
    "Teléfono del tutor",
  ],
  rows: [["Ana", "Pérez", "123", "-", "-", "-", "2025", "2", "A", "Mañana", "-", "-", "-", "-", "-", "-", "-"]],
  totalRows: 1,
  visibleRows: 1,
  hasMoreThanVisible: false,
  isEmpty: false,
};

const emptyPreview: EnrolledStudentsPreviewData = {
  ...readyPreview,
  rows: [],
  totalRows: 0,
  visibleRows: 0,
  isEmpty: true,
};

const readySuccess: EnrolledStudentsGenerateSuccess = {
  ok: true,
  artifact,
  preview: readyPreview,
  appliedFilters,
};

const emptySuccess: EnrolledStudentsGenerateSuccess = {
  ok: true,
  artifact,
  preview: emptyPreview,
  appliedFilters,
};

test("estados iniciales y descarte al cambiar de reporte reinician sin artefacto obsoleto", () => {
  assert.deepEqual(getInitialEnrolledStudentsPreviewStatus(), {
    status: "initial",
  });
  assert.deepEqual(getInitialStaffPreviewStatus(), { status: "initial" });

  const ready = succeedEnrolledStudentsGeneration(readySuccess);
  const resetStudents = resetEnrolledStudentsPreviewOnReportChange();
  assert.deepEqual(resetStudents, { status: "initial" });
  assert.equal(hasEnrolledStudentsCurrentArtifact(resetStudents), false);
  assert.notEqual(ready, resetStudents);

  const staffReady = succeedStaffGeneration({ ok: true, artifact: staffArtifact });
  const resetStaff = resetStaffPreviewOnReportChange();
  assert.deepEqual(resetStaff, { status: "initial" });
  assert.equal(hasStaffCurrentArtifact(resetStaff), false);
  assert.notEqual(staffReady, resetStaff);
});

test("transiciones de carga y éxito del listado producen listo o vacío-válido con artefacto vigente", () => {
  const initial = getInitialEnrolledStudentsPreviewStatus();
  const loading = startEnrolledStudentsGeneration(initial);
  assert.deepEqual(loading, { status: "loading" });

  const ready = succeedEnrolledStudentsGeneration(readySuccess);
  assert.equal(ready.status, "ready");
  assert.equal(hasEnrolledStudentsCurrentArtifact(ready), true);
  if (ready.status === "ready") {
    assert.equal(ready.artifact, artifact);
    assert.deepEqual(ready.appliedFilters, appliedFilters);
    assert.equal(ready.preview.totalRows, 1);
  }

  const empty = succeedEnrolledStudentsGeneration(emptySuccess);
  assert.equal(empty.status, "empty");
  assert.equal(hasEnrolledStudentsCurrentArtifact(empty), true);
  if (empty.status === "empty") {
    assert.equal(empty.artifact, artifact);
    assert.equal(empty.preview.isEmpty, true);
    assert.equal(empty.preview.totalRows, 0);
  }
  void EMPTY_ENROLLED_STUDENTS_MESSAGE;
});

test("conserva vista previa vigente ante error de aplicación y ante limpiar entradas", () => {
  const vigente = succeedEnrolledStudentsGeneration(readySuccess);

  const afterApplyError = keepEnrolledStudentsPreviewOnApplyError(vigente);
  assert.equal(afterApplyError, vigente);
  assert.equal(hasEnrolledStudentsCurrentArtifact(afterApplyError), true);

  const afterClear = keepEnrolledStudentsPreviewOnClearFilters(vigente);
  assert.equal(afterClear, vigente);
  assert.equal(hasEnrolledStudentsCurrentArtifact(afterClear), true);

  const emptyVigente = succeedEnrolledStudentsGeneration(emptySuccess);
  assert.equal(
    keepEnrolledStudentsPreviewOnApplyError(emptyVigente),
    emptyVigente,
  );
  assert.equal(
    keepEnrolledStudentsPreviewOnClearFilters(emptyVigente),
    emptyVigente,
  );
});

test("fallo/timeout de auto-generación del padrón pasa a error con reintento manual sin bucle", () => {
  const loading = startStaffGeneration(getInitialStaffPreviewStatus());
  assert.deepEqual(loading, { status: "loading" });

  const error = failStaffAutoGeneration({
    message: "La solicitud tardó demasiado. Intentá nuevamente.",
    kind: "timeout",
  });
  assert.equal(error.status, "error");
  assert.equal(hasStaffCurrentArtifact(error), false);
  if (error.status === "error") {
    assert.equal(error.kind, "timeout");
  }

  const retryIntent = getStaffGenerationRetryIntent();
  assert.deepEqual(retryIntent, { type: "generate-staff" });
});

test("errores de generación del listado y padrón producen estado de error", () => {
  const listError = failEnrolledStudentsGeneration({
    message: "No se pudo generar el reporte.",
    kind: "failed",
  });
  assert.deepEqual(listError, {
    status: "error",
    message: "No se pudo generar el reporte.",
    kind: "failed",
  });

  const staffError = failStaffGeneration({
    message: "No se pudo generar el padrón.",
    kind: "timeout",
  });
  assert.deepEqual(staffError, {
    status: "error",
    message: "No se pudo generar el padrón.",
    kind: "timeout",
  });
});

test("fallo de visualización del padrón con artefacto válido conserva artefacto para descarga", () => {
  const state = failStaffVisualization({
    artifact: staffArtifact,
    message: "No se pudo mostrar la vista previa del documento.",
  });

  assert.equal(state.status, "visualization-error");
  assert.equal(hasStaffCurrentArtifact(state), true);
  if (state.status === "visualization-error") {
    assert.equal(state.artifact, staffArtifact);
  }

  const downloadRetry = getDownloadRetryIntent(staffArtifact);
  assert.deepEqual(downloadRetry, {
    type: "reuse-artifact",
    artifact: staffArtifact,
  });
});

test("persiste tras descarga y modela reintentos de generación y descarga", () => {
  const studentsReady = succeedEnrolledStudentsGeneration(readySuccess);
  assert.equal(
    keepEnrolledStudentsPreviewAfterDownload(studentsReady),
    studentsReady,
  );

  const staffReady = succeedStaffGeneration({ ok: true, artifact: staffArtifact });
  assert.equal(keepStaffPreviewAfterDownload(staffReady), staffReady);

  const vizError = failStaffVisualization({
    artifact: staffArtifact,
    message: "No se pudo mostrar la vista previa del documento.",
  });
  assert.equal(keepStaffPreviewAfterDownload(vizError), vizError);

  const studentsRetry = getEnrolledStudentsGenerationRetryIntent(appliedFilters);
  assert.deepEqual(studentsRetry, {
    type: "generate-enrolled-students",
    appliedFilters,
  });

  assert.deepEqual(getDownloadRetryIntent(artifact), {
    type: "reuse-artifact",
    artifact,
  });
  assert.deepEqual(
    getDownloadRetryIntent({ ...artifact, byteLength: 0 }),
    { type: "regenerate" },
  );
  assert.deepEqual(getDownloadRetryIntent(null), { type: "regenerate" });
});
