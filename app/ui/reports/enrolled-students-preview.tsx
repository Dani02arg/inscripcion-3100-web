import {
  EMPTY_ENROLLED_STUDENTS_MESSAGE,
  MORE_DETAILS_MESSAGE,
} from "../../lib/reports/constants.ts";
import type { EnrolledStudentsPreviewData } from "../../lib/reports/types.ts";
import ReportPreviewShell from "./report-preview-shell.tsx";

interface EnrolledStudentsPreviewProps {
  readonly preview: EnrolledStudentsPreviewData;
}

export default function EnrolledStudentsPreview({
  preview,
}: EnrolledStudentsPreviewProps) {
  return (
    <div className="space-y-3">
      <ReportPreviewShell label="Vista previa del listado de alumnos inscriptos">
        <table className="min-w-max w-full border-collapse text-left text-sm text-texto-principal">
          <thead className="sticky top-0 z-10 bg-fondo-app">
            <tr>
              {preview.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-b border-borde-input px-3 py-2 font-semibold whitespace-nowrap"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.isEmpty ? (
              <tr>
                <td
                  colSpan={preview.columns.length}
                  className="px-3 py-6 text-center text-base text-texto-principal"
                >
                  <p role="status">{EMPTY_ENROLLED_STUDENTS_MESSAGE}</p>
                </td>
              </tr>
            ) : (
              preview.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="odd:bg-superficie even:bg-fondo-app/40"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${preview.columns[cellIndex] ?? "col"}-${cellIndex}`}
                      className="border-b border-borde-input px-3 py-2 align-top whitespace-nowrap"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportPreviewShell>

      {preview.hasMoreThanVisible ? (
        <p className="text-sm text-texto-principal" role="status">
          {MORE_DETAILS_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
