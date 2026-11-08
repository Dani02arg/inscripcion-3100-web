"use client";

import CourseBreadcrumb from "./course-breadcrumb.tsx";

interface CoursesHeaderProps {
  onCreate: () => void;
  onCloneYear: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_BASE_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${FOCUS_RING_CLASSES}`;

/** Encabezado del listado de cursos con breadcrumb y acciones generales. */
export default function CoursesHeader({
  onCreate,
  onCloneYear,
}: CoursesHeaderProps) {
  return (
    <header className="space-y-5">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Cursos" },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
            Gestión de cursos
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Administrá la oferta académica de la institución
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            className={`${ACTION_BASE_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`}
          >
            Crear curso
          </button>

          <button
            type="button"
            onClick={onCloneYear}
            className={`${ACTION_BASE_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
          >
            Clonar cursos
          </button>

          <button
            type="button"
            aria-disabled="true"
            aria-describedby="course-report-unavailable"
            className={`${ACTION_BASE_CLASSES} cursor-not-allowed border border-borde-input bg-fondo-app text-texto-principal`}
          >
            <span>Generar reporte</span>
            <span className="ml-2 rounded-full bg-superficie px-2 py-0.5 text-sm font-semibold text-texto-secundario">
              Próximamente
            </span>
          </button>
          <span id="course-report-unavailable" className="sr-only">
            No disponible, próximamente
          </span>
        </div>
      </div>
    </header>
  );
}
