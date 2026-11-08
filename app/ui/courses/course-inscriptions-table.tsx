import { redirect } from "next/navigation";

import { getSessionToken } from "../../lib/auth/session-cookie.ts";
import { getCourseReportData } from "../../lib/courses/data.ts";
import { COURSE_SESSION_EXPIRED_PATH } from "../../lib/courses/guard-decision.ts";
import {
  formatReportOrder,
  formatReportTotal,
  formatReportValue,
  formatStudentName,
} from "../../lib/courses/report.ts";
import type { CourseReport } from "../../lib/courses/types.ts";
import RetryButton from "../dashboard/retry-button.tsx";

const HEADER_CLASSES =
  "whitespace-nowrap border-b border-borde-input bg-fondo-app px-3 py-2 text-left text-sm font-semibold text-texto-principal";

const CELL_CLASSES =
  "border-b border-borde-input px-3 py-2 align-middle text-sm text-texto-principal";

interface CourseInscriptionsTableProps {
  report: CourseReport;
}

/** Tabla de inscripciones activas con los únicos datos disponibles del backend. */
export function CourseInscriptionsTable({
  report,
}: CourseInscriptionsTableProps) {
  const total = formatReportTotal(report.totalInscriptions);

  return (
    <section
      aria-labelledby="course-inscriptions-title"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="course-inscriptions-title"
          className="text-xl font-bold text-texto-principal"
        >
          Inscripciones activas
        </h2>
        <p className="text-base text-texto-principal">
          Total de inscripciones: {total}
        </p>
      </div>

      <p className="text-sm text-texto-principal">
        Solo se muestran inscripciones activas. El servicio no informa fecha
        de solicitud ni estado por alumno.
      </p>

      {report.rows.length === 0 ? (
        <p
          role="status"
          className="rounded-xl border border-borde-input bg-superficie p-4 text-base text-texto-principal"
        >
          Este curso no tiene inscripciones activas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-borde-input bg-superficie shadow-sm">
          <table className="min-w-full border-collapse">
            <caption className="sr-only">
              Inscripciones activas del curso
            </caption>
            <thead>
              <tr>
                <th scope="col" className={HEADER_CLASSES}>
                  N.º de orden
                </th>
                <th scope="col" className={HEADER_CLASSES}>
                  Alumno
                </th>
                <th scope="col" className={HEADER_CLASSES}>
                  DNI
                </th>
                <th scope="col" className={HEADER_CLASSES}>
                  Teléfono
                </th>
                <th scope="col" className={HEADER_CLASSES}>
                  Correo
                </th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, index) => (
                <tr key={index} className="hover:bg-superficie-hover">
                  <th scope="row" className={CELL_CLASSES}>
                    {formatReportOrder(index)}
                  </th>
                  <td className={CELL_CLASSES}>{formatStudentName(row)}</td>
                  <td className={CELL_CLASSES}>{formatReportValue(row.dni)}</td>
                  <td className={CELL_CLASSES}>{formatReportValue(row.phone)}</td>
                  <td className={CELL_CLASSES}>{formatReportValue(row.email)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Esqueleto independiente mientras se carga el reporte. */
export function CourseInscriptionsSkeleton() {
  return (
    <section
      aria-labelledby="course-inscriptions-loading-title"
      aria-busy="true"
      className="space-y-3"
    >
      <h2
        id="course-inscriptions-loading-title"
        className="text-xl font-bold text-texto-principal"
      >
        Inscripciones activas
      </h2>
      <span className="sr-only">Cargando inscripciones activas.</span>
      <div
        aria-hidden="true"
        className="space-y-2 rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-5 animate-pulse rounded bg-fondo-app motion-reduce:animate-none"
          />
        ))}
      </div>
    </section>
  );
}

interface CourseInscriptionsErrorProps {
  kind: "forbidden" | "not_found" | "error";
  message: string;
}

/** Error localizado de la sección de inscripciones. */
export function CourseInscriptionsError({
  kind,
  message,
}: CourseInscriptionsErrorProps) {
  return (
    <section
      aria-labelledby="course-inscriptions-error-title"
      className="space-y-3"
    >
      <h2
        id="course-inscriptions-error-title"
        className="text-xl font-bold text-texto-principal"
      >
        Inscripciones activas
      </h2>
      <div
        role="alert"
        className="rounded-xl border border-borde-input bg-superficie p-4"
      >
        <p className="text-base text-estado-rechazado">{message}</p>
        {kind === "error" ? (
          <div className="mt-4">
            <RetryButton />
          </div>
        ) : null}
      </div>
    </section>
  );
}

interface CourseInscriptionsSectionProps {
  courseId: string;
}

/** Carga independiente del reporte de inscripciones del curso. */
export default async function CourseInscriptionsSection({
  courseId,
}: CourseInscriptionsSectionProps) {
  const token = await getSessionToken();

  if (!token) {
    redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  const result = await getCourseReportData(token, courseId);

  if (result.ok) {
    return <CourseInscriptionsTable report={result.report} />;
  }

  if (result.kind === "unauthorized") {
    redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  return (
    <CourseInscriptionsError
      kind={
        result.kind === "forbidden"
          ? "forbidden"
          : result.kind === "not_found"
            ? "not_found"
            : "error"
      }
      message={result.message}
    />
  );
}
