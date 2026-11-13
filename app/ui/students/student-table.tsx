import type { ReactNode } from "react";

import {
  formatStudentDate,
  formatStudentGender,
  formatStudentSortName,
  formatStudentText,
} from "../../lib/students/labels.ts";
import type { Student } from "../../lib/students/types.ts";

interface StudentTableProps {
  readonly students: readonly Student[];
  readonly caption?: string;
  readonly variant: "tutor" | "admin";
  readonly renderRowActions?: (student: Student) => ReactNode;
  readonly id?: string;
}

const HEADER_CLASSES =
  "whitespace-nowrap px-4 py-3.5 text-left text-sm font-semibold";

const CELL_CLASSES = "whitespace-nowrap px-4 py-3 align-middle";

/** Tabla semántica de alumnos para el tutor y el padrón administrativo. */
export default function StudentTable({
  students,
  caption = "Listado de alumnos",
  variant,
  renderRowActions,
  id = "students-results",
}: StudentTableProps) {
  const isAdmin = variant === "admin";

  return (
    <section className="overflow-x-auto rounded-2xl border border-borde-input bg-superficie shadow-sm">
      <table
        id={id}
        className="min-w-full divide-y divide-borde-input text-left text-sm text-texto-principal"
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-fondo-app">
          <tr>
            <th scope="col" className={HEADER_CLASSES}>
              Apellido, Nombre
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              DNI
            </th>
            {isAdmin ? (
              <th scope="col" className={HEADER_CLASSES}>
                CUIL
              </th>
            ) : null}
            <th scope="col" className={HEADER_CLASSES}>
              Fecha de nacimiento
            </th>
            {isAdmin ? (
              <th scope="col" className={HEADER_CLASSES}>
                Género
              </th>
            ) : null}
            <th scope="col" className={HEADER_CLASSES}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borde-input">
          {students.map((student) => (
            <tr
              key={student.id}
              className="hover:bg-superficie-hover"
            >
              <th
                scope="row"
                className={`${CELL_CLASSES} font-semibold`}
              >
                {formatStudentSortName(student)}
              </th>
              <td className={CELL_CLASSES}>
                {formatStudentText(student.studentDni)}
              </td>
              {isAdmin ? (
                <td className={CELL_CLASSES}>
                  {formatStudentText(student.studentCuil)}
                </td>
              ) : null}
              <td className={CELL_CLASSES}>
                {formatStudentDate(student.birthdate)}
              </td>
              {isAdmin ? (
                <td className={CELL_CLASSES}>
                  {formatStudentGender(student.gender)}
                </td>
              ) : null}
              <td className={CELL_CLASSES}>
                {renderRowActions ? renderRowActions(student) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
