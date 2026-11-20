import {
  EMPTY_ENROLLED_STUDENTS_MESSAGE,
  ENROLLED_STUDENTS_COLUMNS,
  PREVIEW_ROW_LIMIT,
} from "./constants.ts";
import type {
  EnrolledStudentsPreviewData,
  EnrolledStudentsPreviewRow,
} from "./types.ts";

/** Normaliza una celda de la vista previa: faltantes o vacíos se representan como "-". */
export function normalizePreviewCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();
  return text === "" ? "-" : text;
}

/** Normaliza una fila a las 17 columnas del listado, en el orden del servicio. */
export function normalizeEnrolledStudentsPreviewRow(
  row: readonly unknown[],
): EnrolledStudentsPreviewRow {
  return ENROLLED_STUDENTS_COLUMNS.map((_, index) =>
    normalizePreviewCell(row[index]),
  );
}

/**
 * Construye la vista previa tabular del listado de alumnos inscriptos.
 * Respeta el orden recibido, limita a las primeras 20 filas visibles y
 * normaliza celdas faltantes/vacías como "-".
 */
export function buildEnrolledStudentsPreview(
  rows: readonly (readonly unknown[])[],
): EnrolledStudentsPreviewData {
  const totalRows = rows.length;
  const visibleSourceRows = rows.slice(0, PREVIEW_ROW_LIMIT);
  const previewRows = visibleSourceRows.map((row) =>
    normalizeEnrolledStudentsPreviewRow(row),
  );
  const visibleRows = previewRows.length;

  return {
    columns: ENROLLED_STUDENTS_COLUMNS,
    rows: previewRows,
    totalRows,
    visibleRows,
    hasMoreThanVisible: totalRows > PREVIEW_ROW_LIMIT,
    isEmpty: totalRows === 0,
  };
}

/** Construye una vista previa vacía válida (encabezados sin filas). */
export function buildEmptyEnrolledStudentsPreview(): EnrolledStudentsPreviewData {
  return {
    columns: ENROLLED_STUDENTS_COLUMNS,
    rows: [],
    totalRows: 0,
    visibleRows: 0,
    hasMoreThanVisible: false,
    isEmpty: true,
  };
}

/** Mensaje del estado vacío del listado de alumnos inscriptos. */
export function getEmptyEnrolledStudentsMessage(): string {
  return EMPTY_ENROLLED_STUDENTS_MESSAGE;
}
