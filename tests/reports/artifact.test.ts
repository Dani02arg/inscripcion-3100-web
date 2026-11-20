import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canDownloadReportArtifact,
  getDownloadRetryStrategy,
  isValidReportArtifact,
} from "../../app/lib/reports/artifact.ts";
import type { ReportArtifact } from "../../app/lib/reports/types.ts";

const validArtifact: ReportArtifact = {
  base64: "UEsDBBQAAAAIAA==",
  contentType:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  filename: "alumnos-inscriptos.xlsx",
  byteLength: 2048,
};

const validPdfWithoutRecords: ReportArtifact = {
  base64: "JVBERi0xLjcK",
  contentType: "application/pdf",
  filename: "padron-personal.pdf",
  byteLength: 512,
};

test("artefacto vigente válido es válido y descargable (incluye vacío/sin registros)", () => {
  assert.equal(isValidReportArtifact(validArtifact), true);
  assert.equal(canDownloadReportArtifact(validArtifact), true);
  assert.equal(getDownloadRetryStrategy(validArtifact), "reuse-artifact");

  assert.equal(isValidReportArtifact(validPdfWithoutRecords), true);
  assert.equal(canDownloadReportArtifact(validPdfWithoutRecords), true);
  assert.equal(
    getDownloadRetryStrategy(validPdfWithoutRecords),
    "reuse-artifact",
  );
});

test("fallo de visualización con artefacto válido mantiene la descarga disponible", () => {
  assert.equal(
    canDownloadReportArtifact(validArtifact, { visualizationFailed: true }),
    true,
  );
  assert.equal(
    canDownloadReportArtifact(validPdfWithoutRecords, {
      visualizationFailed: true,
    }),
    true,
  );
  assert.equal(isValidReportArtifact(validPdfWithoutRecords), true);
});

test("artefacto inválido o con tamaño 0 no es válido ni descargable", () => {
  const zeroBytes: ReportArtifact = { ...validArtifact, byteLength: 0 };
  const emptyBase64: ReportArtifact = { ...validArtifact, base64: "" };
  const emptyFilename: ReportArtifact = { ...validArtifact, filename: "   " };
  const emptyContentType: ReportArtifact = {
    ...validArtifact,
    contentType: "",
  };

  for (const artifact of [
    zeroBytes,
    emptyBase64,
    emptyFilename,
    emptyContentType,
  ]) {
    assert.equal(isValidReportArtifact(artifact), false);
    assert.equal(canDownloadReportArtifact(artifact), false);
  }

  assert.equal(isValidReportArtifact(null), false);
  assert.equal(isValidReportArtifact(undefined), false);
  assert.equal(canDownloadReportArtifact(null), false);
  assert.equal(canDownloadReportArtifact(undefined), false);
});

test("reintento de descarga reutiliza el mismo artefacto vigente solo cuando es válido", () => {
  assert.equal(getDownloadRetryStrategy(validArtifact), "reuse-artifact");
  assert.equal(
    getDownloadRetryStrategy({ ...validArtifact, byteLength: 0 }),
    "regenerate",
  );
  assert.equal(getDownloadRetryStrategy(null), "regenerate");
  assert.equal(getDownloadRetryStrategy(undefined), "regenerate");
});
