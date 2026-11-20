"use client";

import type { ReactNode } from "react";

import {
  EMPTY_ENROLLED_STUDENTS_MESSAGE,
  REPORT_ACCESS_DENIED_MESSAGE,
} from "../../lib/reports/constants.ts";

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const PRIMARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

interface ReportLoadingStateProps {
  readonly message?: string;
}

/** Estado de carga del reporte, anunciado accesiblemente. */
export function ReportLoadingState({
  message = "Cargando reporte…",
}: ReportLoadingStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <span className="sr-only">{message}</span>
      <div
        aria-hidden="true"
        className="mx-auto flex max-w-xs flex-col items-center gap-3 motion-reduce:animate-none"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-borde-input border-t-azul-institucional motion-reduce:animate-none" />
        <p className="text-base font-semibold text-texto-principal">{message}</p>
        <div className="h-2 w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-2 w-5/6 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>
    </section>
  );
}

interface ReportEmptyStateProps {
  readonly message?: string;
  readonly title?: string;
}

/** Estado vacío verificable (incluye el caso del listado de alumnos inscriptos). */
export function ReportEmptyState({
  message = EMPTY_ENROLLED_STUDENTS_MESSAGE,
  title = "Sin resultados",
}: ReportEmptyStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">{title}</h2>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
    </section>
  );
}

interface ReportErrorStateProps {
  readonly message: string;
  readonly title?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
}

/** Estado de error con acción de reintento verificable. */
export function ReportErrorState({
  message,
  title = "No pudimos generar el reporte",
  onRetry,
  retryLabel = "Reintentar",
}: ReportErrorStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">{title}</h2>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
      {onRetry ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            className={PRIMARY_ACTION_CLASSES}
          >
            {retryLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}

interface ReportAccessDeniedStateProps {
  readonly message?: string;
  readonly title?: string;
}

/** Estado de acceso denegado del módulo/reporte. */
export function ReportAccessDeniedState({
  message = REPORT_ACCESS_DENIED_MESSAGE,
  title = "Acceso denegado",
}: ReportAccessDeniedStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">{title}</h2>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
    </section>
  );
}

interface ReportResultStateProps {
  readonly children: ReactNode;
  readonly label?: string;
  readonly statusMessage?: string;
}

/** Contenedor de resultado/previsualización anunciable accesiblemente. */
export function ReportResultState({
  children,
  label = "Resultado del reporte",
  statusMessage = "Vista previa del reporte disponible.",
}: ReportResultStateProps) {
  return (
    <section aria-label={label} className="space-y-3">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      {children}
    </section>
  );
}
