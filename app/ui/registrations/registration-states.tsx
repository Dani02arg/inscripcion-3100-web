"use client";

import Link from "next/link";

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

export type RegistrationEmptyVariant = "global" | "filtered";

interface RegistrationEmptyStateProps {
  variant: RegistrationEmptyVariant;
  onClearFilters?: () => void;
}

/** Estado vacío global o por filtros. */
export function RegistrationEmptyState({
  variant,
  onClearFilters,
}: RegistrationEmptyStateProps) {
  const isFiltered = variant === "filtered";

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">
        {isFiltered
          ? "No hay solicitudes que coincidan con los filtros."
          : "Todavía no hay solicitudes de inscripción."}
      </h2>
      <p className="mt-2 text-base text-texto-principal">
        {isFiltered
          ? "Probá con otro estado, alumno o curso."
          : "Las solicitudes que envíen los tutores aparecerán acá."}
      </p>

      {isFiltered ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!onClearFilters}
            className={SECONDARY_ACTION_CLASSES}
          >
            Limpiar filtros
          </button>
        </div>
      ) : null}
    </section>
  );
}

export type RegistrationErrorKind = "forbidden" | "error";

interface RegistrationErrorStateProps {
  kind: RegistrationErrorKind;
  message: string;
}

/** Error de carga con distinción entre acceso denegado y fallo general. */
export function RegistrationErrorState({
  kind,
  message,
}: RegistrationErrorStateProps) {
  const title =
    kind === "forbidden"
      ? "Acceso denegado"
      : "No pudimos cargar las inscripciones";

  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">{title}</h2>
      <p className="mt-2 text-base text-texto-principal">{message}</p>

      {kind === "forbidden" ? (
        <div className="mt-5 flex justify-center">
          <Link href="/dashboard" className={SECONDARY_ACTION_CLASSES}>
            Volver al inicio
          </Link>
        </div>
      ) : null}
    </section>
  );
}

/** Estado de no encontrado del detalle. */
export function RegistrationNotFoundState() {
  return (
    <section
      role="status"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        Inscripción no encontrada
      </h1>
      <p className="mt-2 text-base text-texto-principal">
        La inscripción no existe o fue eliminada.
      </p>

      <div className="mt-5 flex justify-center">
        <Link
          href="/dashboard/registrations"
          className={SECONDARY_ACTION_CLASSES}
        >
          Volver a inscripciones
        </Link>
      </div>
    </section>
  );
}
