import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EMPTY_ENROLLED_STUDENTS_MESSAGE,
  ENROLLED_STUDENTS_COLUMNS,
  PREVIEW_ROW_LIMIT,
} from "../../app/lib/reports/constants.ts";
import {
  buildEmptyEnrolledStudentsPreview,
  buildEnrolledStudentsPreview,
  getEmptyEnrolledStudentsMessage,
  normalizeEnrolledStudentsPreviewRow,
  normalizePreviewCell,
} from "../../app/lib/reports/enrolled-students.ts";

function makeRow(index: number): readonly string[] {
  return ENROLLED_STUDENTS_COLUMNS.map((column) => `${column} ${index}`);
}

test("estado vacío válido: encabezados sin filas, mensaje definido y sin indicador de más resultados", () => {
  const preview = buildEmptyEnrolledStudentsPreview();

  assert.deepEqual(preview.columns, ENROLLED_STUDENTS_COLUMNS);
  assert.equal(preview.columns.length, 17);
  assert.deepEqual(preview.rows, []);
  assert.equal(preview.totalRows, 0);
  assert.equal(preview.visibleRows, 0);
  assert.equal(preview.hasMoreThanVisible, false);
  assert.equal(preview.isEmpty, true);
  assert.equal(
    getEmptyEnrolledStudentsMessage(),
    EMPTY_ENROLLED_STUDENTS_MESSAGE,
  );

  const fromRows = buildEnrolledStudentsPreview([]);
  assert.deepEqual(fromRows, preview);
});

test("resultados menores o iguales a 20: muestra todas las filas en orden y no indica más resultados", () => {
  const rows = [makeRow(1), makeRow(2), makeRow(3)];
  const preview = buildEnrolledStudentsPreview(rows);

  assert.deepEqual(preview.columns, ENROLLED_STUDENTS_COLUMNS);
  assert.equal(preview.totalRows, 3);
  assert.equal(preview.visibleRows, 3);
  assert.equal(preview.hasMoreThanVisible, false);
  assert.equal(preview.isEmpty, false);
  assert.deepEqual(preview.rows, rows);

  const exactLimitRows = Array.from({ length: PREVIEW_ROW_LIMIT }, (_, i) =>
    makeRow(i + 1),
  );
  const exactLimit = buildEnrolledStudentsPreview(exactLimitRows);

  assert.equal(exactLimit.totalRows, PREVIEW_ROW_LIMIT);
  assert.equal(exactLimit.visibleRows, PREVIEW_ROW_LIMIT);
  assert.equal(exactLimit.hasMoreThanVisible, false);
  assert.equal(exactLimit.rows.length, PREVIEW_ROW_LIMIT);
  assert.deepEqual(exactLimit.rows[0], exactLimitRows[0]);
  assert.deepEqual(
    exactLimit.rows[PREVIEW_ROW_LIMIT - 1],
    exactLimitRows[PREVIEW_ROW_LIMIT - 1],
  );
});

test("más de 20 resultados: limita a las primeras 20 filas en orden recibido e indica más resultados", () => {
  const rows = Array.from({ length: 25 }, (_, i) => makeRow(i + 1));
  const preview = buildEnrolledStudentsPreview(rows);

  assert.equal(preview.totalRows, 25);
  assert.equal(preview.visibleRows, PREVIEW_ROW_LIMIT);
  assert.equal(preview.rows.length, PREVIEW_ROW_LIMIT);
  assert.equal(preview.hasMoreThanVisible, true);
  assert.equal(preview.isEmpty, false);
  assert.deepEqual(preview.rows[0], rows[0]);
  assert.deepEqual(preview.rows[19], rows[19]);
});

test("normaliza celdas faltantes o vacías como '-' y respeta las 17 columnas", () => {
  assert.equal(normalizePreviewCell(null), "-");
  assert.equal(normalizePreviewCell(undefined), "-");
  assert.equal(normalizePreviewCell(""), "-");
  assert.equal(normalizePreviewCell("   "), "-");
  assert.equal(normalizePreviewCell("Ana"), "Ana");
  assert.equal(normalizePreviewCell(123), "123");

  const row = normalizeEnrolledStudentsPreviewRow([
    "Ana",
    "",
    null,
    undefined,
    "2008-01-01",
  ]);
  assert.equal(row.length, 17);
  assert.deepEqual([...row.slice(0, 6)], [
    "Ana",
    "-",
    "-",
    "-",
    "2008-01-01",
    "-",
  ]);
  assert.ok(row.slice(6).every((cell) => cell === "-"));

  const preview = buildEnrolledStudentsPreview([["Nombre", null, "", "  "]]);
  assert.equal(preview.rows[0]?.length, 17);
  assert.equal(preview.rows[0]?.[0], "Nombre");
  assert.equal(preview.rows[0]?.[1], "-");
  assert.equal(preview.rows[0]?.[2], "-");
  assert.equal(preview.rows[0]?.[3], "-");
});
