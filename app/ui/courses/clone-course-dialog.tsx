"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { cloneCourseAction } from "../../lib/actions/courses.ts";
import { COURSE_ACTION_IDLE_STATE } from "../../lib/courses/course-state.ts";
import type {
  Course,
  CourseActionState,
} from "../../lib/courses/types.ts";
import CourseDialog from "./course-dialog.tsx";

interface CloneCourseDialogProps {
  course: Course;
  currentYear: number;
  onClose: () => void;
  onCloned: (message: string) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const CONFLICT_MESSAGE =
  "Ya existe un curso con esa combinación en el año de destino.";

/** Diálogo de clonación individual con año destino y consecuencias. */
export default function CloneCourseDialog({
  course,
  currentYear,
  onClose,
  onCloned,
}: CloneCourseDialogProps) {
  const [state, formAction, isPending] = useActionState<
    CourseActionState,
    FormData
  >(cloneCourseAction, COURSE_ACTION_IDLE_STATE);
  const [year, setYear] = useState(String(currentYear));
  const completedRef = useRef(false);

  const code = course.code ?? "Sin código";
  const yearError =
    state.status === "validation" ? state.fieldErrors?.year : undefined;
  const errorMessage =
    state.status === "conflict"
      ? CONFLICT_MESSAGE
      : state.status === "validation"
        ? state.fieldErrors?.year ?? state.message
        : state.status === "idle" ||
            state.status === "success" ||
            state.status === "pending"
          ? null
          : state.message;

  useEffect(() => {
    if (state.status === "success" && !completedRef.current) {
      completedRef.current = true;
      onCloned(state.message);
      onClose();
    }
  }, [onClose, onCloned, state]);

  return (
    <CourseDialog
      open
      id="clone-course-dialog"
      title="Clonar curso"
      describedBy="clone-course-consequence"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="courseId" value={course.id} />

        <p className="text-base text-texto-principal">
          Curso de origen: <span className="font-semibold">{code}</span>
        </p>

        <div>
          <label
            htmlFor="clone-course-year"
            className="mb-1 block text-sm font-medium text-texto-principal"
          >
            Año de destino
          </label>
          <input
            id="clone-course-year"
            name="year"
            type="number"
            min={currentYear}
            step={1}
            required
            value={year}
            onChange={(event) => setYear(event.target.value)}
            aria-invalid={yearError ? true : undefined}
            aria-describedby={
              yearError
                ? "clone-course-consequence clone-course-year-error"
                : "clone-course-consequence"
            }
            className={`min-h-11 w-full rounded-lg border bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:outline-none focus:ring-2 ${
              yearError
                ? "border-estado-rechazado focus:border-estado-rechazado focus:ring-estado-rechazado"
                : "border-borde-input focus:border-borde-focus focus:ring-borde-focus"
            }`}
          />
          {yearError ? (
            <p
              id="clone-course-year-error"
              className="mt-1 text-sm text-estado-rechazado"
            >
              {yearError}
            </p>
          ) : null}
        </div>

        <p
          id="clone-course-consequence"
          className="text-base text-texto-principal"
        >
          Se creará un curso con código nuevo, sin inscripciones y con
          capacidad actual en cero. Se conservan la capacidad máxima y el
          estado del curso de origen.
        </p>

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
            disabled={isPending}
            aria-busy={isPending}
            className={PRIMARY_BUTTON_CLASSES}
          >
            {isPending ? "Clonando..." : "Clonar"}
          </button>
        </div>
      </form>
    </CourseDialog>
  );
}
