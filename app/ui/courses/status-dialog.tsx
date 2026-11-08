"use client";

import { useActionState, useEffect, useRef } from "react";

import { setCourseStatusAction } from "../../lib/actions/courses.ts";
import { COURSE_ACTION_IDLE_STATE } from "../../lib/courses/course-state.ts";
import type {
  Course,
  CourseActionState,
} from "../../lib/courses/types.ts";
import CourseDialog from "./course-dialog.tsx";

interface StatusCourseDialogProps {
  course: Course;
  onClose: () => void;
  onUpdated: (message: string) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

/** Confirmación de desactivación de un curso sin inscriptos. */
export default function StatusCourseDialog({
  course,
  onClose,
  onUpdated,
}: StatusCourseDialogProps) {
  const [state, formAction, isPending] = useActionState<
    CourseActionState,
    FormData
  >(setCourseStatusAction, COURSE_ACTION_IDLE_STATE);
  const completedRef = useRef(false);

  const code = course.code ?? "Sin código";
  const errorMessage =
    state.status === "idle" ||
    state.status === "success" ||
    state.status === "pending"
      ? null
      : state.message;

  useEffect(() => {
    if (state.status === "success" && !completedRef.current) {
      completedRef.current = true;
      onUpdated(state.message);
      onClose();
    }
  }, [onClose, onUpdated, state]);

  return (
    <CourseDialog
      open
      id="status-course-dialog"
      title="Desactivar curso"
      describedBy="status-course-consequence"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="courseId" value={course.id} />
        <input type="hidden" name="status" value="inactive" />
        <input
          type="hidden"
          name="currentCapacity"
          value={String(course.currentCapacity)}
        />

        <p
          id="status-course-consequence"
          className="text-base text-texto-principal"
        >
          El curso {code} dejará de estar disponible.
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
            {isPending ? "Desactivando..." : "Desactivar"}
          </button>
        </div>
      </form>
    </CourseDialog>
  );
}
