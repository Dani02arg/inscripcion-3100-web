"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { cloneYearAction } from "../../lib/actions/courses.ts";
import { formatCloneYearMessage } from "../../lib/courses/course-state.ts";
import type { CourseCloneYearResult } from "../../lib/courses/types.ts";
import CourseDialog from "./course-dialog.tsx";

interface CloneYearOption {
  readonly year: number;
  readonly count: number;
}

interface CloneYearDialogProps {
  originYears: readonly CloneYearOption[];
  currentYear: number;
  onClose: () => void;
  onCompleted: (
    message: string,
    kind: "success" | "info",
  ) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const NO_ORIGIN_YEARS_MESSAGE =
  "No hay años anteriores disponibles para clonar.";

/** Clonación masiva de los cursos de un año anterior al actual. */
export default function CloneYearDialog({
  originYears,
  currentYear,
  onClose,
  onCompleted,
}: CloneYearDialogProps) {
  const [state, formAction, isPending] = useActionState<
    CourseCloneYearResult | null,
    FormData
  >(cloneYearAction, null);
  const [selectedYear, setSelectedYear] = useState(
    originYears[0] ? String(originYears[0].year) : "",
  );
  const completedRef = useRef(false);

  const selectedOption = originYears.find(
    (option) => String(option.year) === selectedYear,
  );
  const attempted = selectedOption?.count ?? 0;
  const errorMessage = state && !state.ok ? state.message : null;

  useEffect(() => {
    if (state?.ok && !completedRef.current) {
      completedRef.current = true;
      const message = formatCloneYearMessage(
        state.cloned,
        state.attempted,
        state.message,
      );

      onCompleted(
        message,
        state.cloned === 0 ? "info" : "success",
      );
      onClose();
    }
  }, [onClose, onCompleted, state]);

  return (
    <CourseDialog
      open
      id="clone-year-dialog"
      title="Clonar cursos"
      describedBy="clone-year-consequences"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form action={formAction} className="space-y-4">
        {originYears.length > 0 ? (
          <>
            <div>
              <label
                htmlFor="clone-year-origin"
                className="mb-1 block text-sm font-medium text-texto-principal"
              >
                Año de origen
              </label>
              <select
                id="clone-year-origin"
                name="oldYear"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className={`min-h-11 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus ${FOCUS_RING_CLASSES}`}
              >
                {originYears.map((option) => (
                  <option key={option.year} value={option.year}>
                    {option.year} · {option.count}{" "}
                    {option.count === 1 ? "curso" : "cursos"}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="hidden"
              name="attempted"
              value={String(attempted)}
            />
          </>
        ) : (
          <p role="alert" className="text-base text-texto-principal">
            {NO_ORIGIN_YEARS_MESSAGE}
          </p>
        )}

        <div
          id="clone-year-consequences"
          className="space-y-2 text-base text-texto-principal"
        >
          <p>
            Los cursos se copiarán al año actual ({currentYear}). No se copian
            inscripciones y la capacidad actual inicia en cero.
          </p>
          <p>
            Se conservan la capacidad máxima y el estado. Se intentarán copiar{" "}
            {attempted} {attempted === 1 ? "curso" : "cursos"}.
          </p>
        </div>

        {errorMessage ? (
          <p role="alert" className="text-base text-estado-rechazado">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={SECONDARY_BUTTON_CLASSES}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || originYears.length === 0}
            aria-busy={isPending}
            className={PRIMARY_BUTTON_CLASSES}
          >
            {isPending ? "Clonando..." : "Clonar cursos"}
          </button>
        </div>
      </form>
    </CourseDialog>
  );
}
