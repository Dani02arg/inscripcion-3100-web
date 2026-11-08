"use client";

import Link from "next/link";

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 ${FOCUS_RING_CLASSES}`;

const SECONDARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

export type CourseEmptyVariant = "global" | "filtered";

interface CourseTableEmptyStateProps {
  variant: CourseEmptyVariant;
  onClearFilters?: () => void;
}

/** Estado vacío global o por filtros. */
export function CourseTableEmptyState({
  variant,
  onClearFilters,
}: CourseTableEmptyStateProps) {
  const isFiltered = variant === "filtered";

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">
        {isFiltered
          ? "No hay cursos que coincidan con los filtros."
          : "Todavía no hay cursos cargados."}
      </h2>
      <p className="mt-2 text-base text-texto-principal">
        {isFiltered
          ? "Probá con otro año, ciclo, especialidad, turno o búsqueda."
          : "Creá el primer curso para empezar a armar la oferta académica."}
      </p>

      <div className="mt-5 flex justify-center">
        {isFiltered ? (
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!onClearFilters}
            className={SECONDARY_ACTION_CLASSES}
          >
            Limpiar filtros
          </button>
        ) : (
          <Link href="/dashboard/courses/new" className={ACTION_CLASSES}>
            Crear curso
          </Link>
        )}
      </div>
    </section>
  );
}

export type CourseTableErrorKind = "unauthorized" | "forbidden" | "error";

interface CourseTableErrorStateProps {
  kind: CourseTableErrorKind;
  message: string;
  onRetry?: () => void;
}

/** Error de carga con distinción entre sesión vencida, acceso denegado y fallo general. */
export function CourseTableErrorState({
  kind,
  message,
  onRetry,
}: CourseTableErrorStateProps) {
  const title =
    kind === "unauthorized"
      ? "Tu sesión expiró"
      : kind === "forbidden"
        ? "Acceso denegado"
        : "No pudimos cargar los cursos";

  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">{title}</h2>
      <p className="mt-2 text-base text-texto-principal">{message}</p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {kind === "unauthorized" ? (
          <Link
            href="/login?reason=session-expired"
            className={ACTION_CLASSES}
          >
            Iniciar sesión
          </Link>
        ) : null}

        {kind === "forbidden" ? (
          <Link href="/dashboard" className={SECONDARY_ACTION_CLASSES}>
            Volver al inicio
          </Link>
        ) : null}

        {kind === "error" && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={ACTION_CLASSES}
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </section>
  );
}
