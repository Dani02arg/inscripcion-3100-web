"use client";

import { useActionState, useEffect, useRef } from "react";

import { deleteCourseAction } from "../../lib/actions/courses.ts";
import { COURSE_ACTION_IDLE_STATE } from "../../lib/courses/course-state.ts";
import type {
  Course,
  CourseActionState,
} from "../../lib/courses/types.ts";
import CourseDialog from "./course-dialog.tsx";

interface DeleteCourseDialogProps {
  course: Course;
  onClose: () => void;
  onDeleted: (message: string) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const DANGER_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-estado-rechazado px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

/** Confirmación de eliminación lógica de un curso sin inscriptos. */
export default function DeleteCourseDialog({
  course,
  onClose,
  onDeleted,
}: DeleteCourseDialogProps) {
  const [state, formAction, isPending] = useActionState<
    CourseActionState,
    FormData
  >(deleteCourseAction, COURSE_ACTION_IDLE_STATE);
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
      onDeleted(state.message);
      onClose();
    }
  }, [onClose, onDeleted, state]);

  return (
    <CourseDialog
      open
      id="delete-course-dialog"
      title="Eliminar curso"
      describedBy="delete-course-consequence"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="courseId" value={course.id} />
        <input
          type="hidden"
          name="currentCapacity"
          value={String(course.currentCapacity)}
        />

        <p
          id="delete-course-consequence"
          className="text-base text-texto-principal"
        >
          Se eliminará el curso {code} de la oferta. Esta acción no se puede
          deshacer desde la interfaz.
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
            className={DANGER_BUTTON_CLASSES}
          >
            {isPending ? "Eliminando..." : "Eliminar curso"}
          </button>
        </div>
      </form>
    </CourseDialog>
  );
}
