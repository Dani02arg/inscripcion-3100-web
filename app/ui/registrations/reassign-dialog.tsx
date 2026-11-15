"use client";

import { useState } from "react";

import { formatRegistrationStudentName } from "../../lib/registrations/labels.ts";
import { isSelectorEmpty } from "../../lib/registrations/reassignment.ts";
import type {
  AvailableCourse,
  Registration,
} from "../../lib/registrations/types.ts";
import {
  buildReassignPayload,
  validateReassignment,
  type DictamenFieldErrors,
  type ReassignPayload,
} from "../../lib/validation/registrations.ts";
import CourseDialog from "../courses/course-dialog.tsx";

interface ReassignDialogProps {
  open: boolean;
  id: string;
  registration: Registration;
  courses: readonly AvailableCourse[];
  onSubmit: (payload: ReassignPayload) => void;
  onBack: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

const PRIMARY_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const SECONDARY_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

const CONTROL_CLASSES =
  `min-h-11 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus ${FOCUS_RING_CLASSES}`;

/** Formulario de reasignación con selector, motivo, opcionales y advertencia. */
export default function ReassignDialog({
  open,
  id,
  registration,
  courses,
  onSubmit,
  onBack,
}: ReassignDialogProps) {
  const [newCourseId, setNewCourseId] = useState("");
  const [reason, setReason] = useState("");
  const [observations, setObservations] = useState("");
  const [pendingSubjects, setPendingSubjects] = useState("");
  const [missingDocumentation, setMissingDocumentation] = useState("");
  const [errors, setErrors] = useState<DictamenFieldErrors>({});

  const selectorEmpty = isSelectorEmpty(courses);

  const summary = `Vas a proponer una reasignación de la solicitud de ${formatRegistrationStudentName(registration.student)}.`;

  const handleConfirm = () => {
    const validationErrors = validateReassignment({
      newCourseId,
      reassignmentReason: reason,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(
      buildReassignPayload({
        newCourseId,
        reassignmentReason: reason,
        observations,
        pendingSubjects,
        missingDocumentation,
      }),
    );
  };

  return (
    <CourseDialog
      open={open}
      id={id}
      title="Reasignar solicitud"
      onClose={onBack}
    >
      <p className="text-base text-texto-principal">{summary}</p>
      <p className="mt-2 text-sm text-texto-secundario">
        Si el tutor acepta la propuesta, la reasignación se concreta y pasa a
        ser una inscripción aprobada.
      </p>

      {selectorEmpty ? (
        <p className="mt-4 rounded-xl border border-borde-input bg-fondo-app px-3 py-2 text-base text-texto-principal">
          No hay cursos disponibles con cupo en el año lectivo.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={`${id}-course`}
              className="mb-1 block text-sm font-medium text-texto-principal"
            >
              Curso de destino
            </label>
            <select
              id={`${id}-course`}
              value={newCourseId}
              onChange={(event) => setNewCourseId(event.target.value)}
              aria-invalid={errors.newCourseId ? true : undefined}
              className={CONTROL_CLASSES}
            >
              <option value="">Seleccioná un curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}
                </option>
              ))}
            </select>
            {errors.newCourseId ? (
              <p className="mt-1 text-sm text-texto-principal">
                {errors.newCourseId}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${id}-reason`}
              className="mb-1 block text-sm font-medium text-texto-principal"
            >
              Motivo
            </label>
            <textarea
              id={`${id}-reason`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              aria-invalid={errors.reassignmentReason ? true : undefined}
              className={CONTROL_CLASSES}
            />
            {errors.reassignmentReason ? (
              <p className="mt-1 text-sm text-texto-principal">
                {errors.reassignmentReason}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${id}-observations`}
              className="mb-1 block text-sm font-medium text-texto-principal"
            >
              Observaciones
            </label>
            <textarea
              id={`${id}-observations`}
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              rows={2}
              className={CONTROL_CLASSES}
            />
          </div>

          <div>
            <label
              htmlFor={`${id}-subjects`}
              className="mb-1 block text-sm font-medium text-texto-principal"
            >
              Materias adeudadas
            </label>
            <input
              id={`${id}-subjects`}
              type="text"
              value={pendingSubjects}
              onChange={(event) => setPendingSubjects(event.target.value)}
              placeholder="Separadas por coma"
              className={CONTROL_CLASSES}
            />
          </div>

          <div>
            <label
              htmlFor={`${id}-missing`}
              className="mb-1 block text-sm font-medium text-texto-principal"
            >
              Documentación faltante
            </label>
            <input
              id={`${id}-missing`}
              type="text"
              value={missingDocumentation}
              onChange={(event) => setMissingDocumentation(event.target.value)}
              className={CONTROL_CLASSES}
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onBack} className={SECONDARY_CLASSES}>
          Volver atrás
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectorEmpty}
          className={PRIMARY_CLASSES}
        >
          Confirmar
        </button>
      </div>
    </CourseDialog>
  );
}
