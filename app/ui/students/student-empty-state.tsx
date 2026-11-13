import Link from "next/link";

import { studentNewPath } from "../../lib/students/students-url.ts";

interface StudentEmptyStateProps {
  readonly variant: "tutor" | "admin";
}

const REGISTER_BUTTON_CLASSES =
  "mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

function EmptyIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 140"
      className="h-40 w-40 text-azul-institucional"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="70" r="62" className="fill-fondo-app" />
      <rect
        x="42"
        y="34"
        width="60"
        height="72"
        rx="6"
        className="fill-superficie"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M54 52h36M54 64h28M54 76h20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="112" cy="96" r="18" className="fill-azul-institucional" />
      <path
        d="M112 88v16M104 96h16"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="64"
        cy="98"
        r="12"
        className="fill-superficie"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M64 92a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
        className="fill-azul-institucional"
      />
    </svg>
  );
}

/** Estado vacío del listado de alumnos para tutor y padrón administrativo. */
export default function StudentEmptyState({
  variant,
}: StudentEmptyStateProps) {
  if (variant === "admin") {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
      >
        <h2 className="text-xl font-bold text-texto-principal">
          No hay alumnos registrados
        </h2>
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <EmptyIllustration />

      <h3 className="mt-6 text-xl font-bold text-texto-principal">
        Aún no tenés alumnos registrados
      </h3>
      <p className="mt-2 text-base text-texto-principal">
        Registrá a tu hijo para poder inscribirlo en un curso
      </p>
      <Link href={studentNewPath()} className={REGISTER_BUTTON_CLASSES}>
        Registrar un alumno
      </Link>
    </div>
  );
}
