import type { ReactNode } from "react";

import {
  buildCourseRowLabel,
  getCycleLabel,
  getShiftLabel,
  getSpecialityLabel,
} from "../../lib/courses/labels.ts";
import type { Course } from "../../lib/courses/types.ts";
import CourseStatusBadge from "./course-status-badge.tsx";

interface CourseTableProps {
  courses: readonly Course[];
  renderRowActions?: (course: Course) => ReactNode;
  id?: string;
}

const HEADER_CLASSES =
  "whitespace-nowrap border-b border-borde-input bg-fondo-app px-3 py-2 text-left text-sm font-semibold text-texto-principal";

const CELL_CLASSES =
  "border-b border-borde-input px-3 py-2 align-middle text-sm text-texto-principal";

/** Tabla semántica del listado de cursos. */
export default function CourseTable({
  courses,
  renderRowActions,
  id = "courses-results",
}: CourseTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-borde-input bg-superficie shadow-sm">
      <table id={id} className="min-w-full border-collapse">
        <caption className="sr-only">Listado de cursos</caption>
        <thead>
          <tr>
            <th scope="col" className={HEADER_CLASSES}>
              Año académico
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Año de cursada
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              División
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Ciclo
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Especialidad
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Turno
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Estado
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course.id}
              aria-label={buildCourseRowLabel(course)}
              className="hover:bg-superficie-hover"
            >
              <th
                scope="row"
                className={`${CELL_CLASSES} whitespace-nowrap font-semibold`}
              >
                {course.year}
              </th>
              <td className={CELL_CLASSES}>{course.studyYear}</td>
              <td className={CELL_CLASSES}>{course.division}</td>
              <td className={CELL_CLASSES}>{getCycleLabel(course.cycle)}</td>
              <td className={CELL_CLASSES}>
                {getSpecialityLabel(course.speciality)}
              </td>
              <td className={CELL_CLASSES}>{getShiftLabel(course.shift)}</td>
              <td className={CELL_CLASSES}>
                <CourseStatusBadge status={course.status} />
              </td>
              <td className={CELL_CLASSES}>
                {renderRowActions ? renderRowActions(course) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
