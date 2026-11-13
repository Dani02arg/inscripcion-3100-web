import Link from "next/link";

import { studentNewPath } from "../../lib/students/students-url.ts";
import CourseBreadcrumb from "../courses/course-breadcrumb.tsx";

interface StudentsHeaderProps {
  readonly variant: "tutor" | "admin";
  readonly showRegisterButton?: boolean;
}

const REGISTER_BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Encabezado del módulo de alumnos con breadcrumb, título y acción de alta. */
export default function StudentsHeader({
  variant,
  showRegisterButton = false,
}: StudentsHeaderProps) {
  const isTutor = variant === "tutor";
  const sectionLabel = isTutor ? "Mis hijos" : "Alumnos";
  const description = isTutor
    ? "Consultá y administrá los alumnos a tu cargo."
    : "Consultá el padrón de alumnos de la institución.";

  return (
    <header className="space-y-5">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: sectionLabel },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
            {sectionLabel}
          </h1>
          <p className="mt-2 text-base text-texto-principal">{description}</p>
        </div>

        {isTutor && showRegisterButton ? (
          <Link href={studentNewPath()} className={REGISTER_BUTTON_CLASSES}>
            Registrar un alumno
          </Link>
        ) : null}
      </div>
    </header>
  );
}
