"use client";

import Link from "next/link";
import { STUDENTS_PATH } from "../../lib/students/students-url.ts";

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 ${FOCUS_RING_CLASSES}`;

const SECONDARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

interface StudentStateProps {
  readonly message: string;
  readonly onRetry?: () => void;
}

export function StudentForbiddenState({ message }: StudentStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        Acceso denegado
      </h1>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
      <div className="mt-5 flex justify-center">
        <Link href="/dashboard" className={SECONDARY_ACTION_CLASSES}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export function StudentErrorState({ message, onRetry }: StudentStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        No pudimos cargar esta pantalla
      </h1>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
      {onRetry ? (
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={onRetry} className={ACTION_CLASSES}>
            Reintentar
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function StudentNotFoundState({
  returnLabel = "Volver a alumnos",
  returnPath = STUDENTS_PATH,
}: {
  readonly returnLabel?: string;
  readonly returnPath?: string;
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        Alumno no encontrado
      </h1>
      <p className="mt-2 text-base text-texto-principal">
        El alumno no existe o no tenés permisos para verlo.
      </p>
      <div className="mt-5 flex justify-center">
        <Link href={returnPath} className={SECONDARY_ACTION_CLASSES}>
          {returnLabel}
        </Link>
      </div>
    </section>
  );
}
