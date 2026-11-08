import Link from "next/link";
import type { ReactNode } from "react";

import { sanitizeReturnPath } from "../../lib/courses/filters-url.ts";
import {
  getCycleLabel,
  getShiftLabel,
  getSpecialityLabel,
} from "../../lib/courses/labels.ts";
import {
  getEditDisabledReason,
  isCourseEditable,
} from "../../lib/courses/rules.ts";
import type { Course } from "../../lib/courses/types.ts";
import CourseBreadcrumb from "./course-breadcrumb.tsx";
import CourseStatusBadge from "./course-status-badge.tsx";

interface CourseDetailProps {
  course: Course;
  currentYear: number;
  from: string | null;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_BASE_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${FOCUS_RING_CLASSES}`;

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-borde-input bg-fondo-app px-3 py-2">
      <dt className="text-sm font-semibold text-texto-principal">{label}</dt>
      <dd className="mt-1 text-base font-medium text-texto-principal">
        {children}
      </dd>
    </div>
  );
}

/** Detalle de un curso con datos, acciones y estado. */
export default function CourseDetail({
  course,
  currentYear,
  from,
}: CourseDetailProps) {
  const code = course.code ?? "Sin código";
  const backPath = sanitizeReturnPath(from);
  const isEditable = isCourseEditable(course, currentYear);
  const editDisabledReason = getEditDisabledReason(course, currentYear);
  const editHref = `/dashboard/courses/${encodeURIComponent(course.id)}/edit?from=detail`;
  const availablePlaces =
    course.availablePlaces === null
      ? "No disponible"
      : formatNumber(course.availablePlaces);

  return (
    <div className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Cursos", href: backPath },
          { label: "Detalles" },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
            Detalle del curso
          </h1>
          <p className="mt-2 break-all font-mono text-base text-texto-principal">
            {code}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={backPath}
            className={`${ACTION_BASE_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
          >
            Volver a cursos
          </Link>

          {isEditable ? (
            <Link
              href={editHref}
              className={`${ACTION_BASE_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`}
            >
              Editar
            </Link>
          ) : (
            <>
              <button
                type="button"
                aria-disabled="true"
                aria-describedby="course-edit-disabled-reason"
                title={editDisabledReason ?? undefined}
                className={`${ACTION_BASE_CLASSES} cursor-not-allowed border border-borde-input bg-fondo-app text-texto-secundario`}
              >
                Editar
              </button>
              <span id="course-edit-disabled-reason" className="sr-only">
                {editDisabledReason}
              </span>
            </>
          )}
        </div>
      </div>

      <section
        aria-label="Datos del curso"
        className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
      >
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Código">{code}</DetailItem>
          <DetailItem label="Año académico">{course.year}</DetailItem>
          <DetailItem label="Año de cursada">{course.studyYear}</DetailItem>
          <DetailItem label="División">{course.division}</DetailItem>
          <DetailItem label="Ciclo">{getCycleLabel(course.cycle)}</DetailItem>
          <DetailItem label="Especialidad">
            {getSpecialityLabel(course.speciality)}
          </DetailItem>
          <DetailItem label="Turno">{getShiftLabel(course.shift)}</DetailItem>
          <DetailItem label="Capacidad máxima">
            {formatNumber(course.maxCapacity)}
          </DetailItem>
          <DetailItem label="Capacidad actual">
            {formatNumber(course.currentCapacity)}
          </DetailItem>
          <DetailItem label="Cupos disponibles">{availablePlaces}</DetailItem>
          <DetailItem label="Estado">
            <CourseStatusBadge status={course.status} />
          </DetailItem>
        </dl>
      </section>
    </div>
  );
}
