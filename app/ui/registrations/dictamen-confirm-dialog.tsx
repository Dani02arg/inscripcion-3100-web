"use client";

import { useState } from "react";

import { formatRegistrationStudentName } from "../../lib/registrations/labels.ts";
import { buildApprovePayload } from "../../lib/validation/registrations.ts";
import type { DictamenOptionalPayload } from "../../lib/validation/registrations.ts";
import type { Registration } from "../../lib/registrations/types.ts";
import CourseDialog from "../courses/course-dialog.tsx";

interface DictamenConfirmDialogProps {
  open: boolean;
  id: string;
  registration: Registration;
  title: string;
  action: string;
  confirmLabel: string;
  onConfirm: (payload: DictamenOptionalPayload) => void;
  onBack: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

const PRIMARY_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 ${FOCUS_RING_CLASSES}`;

const SECONDARY_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

const CONTROL_CLASSES =
  `min-h-11 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus ${FOCUS_RING_CLASSES}`;

/**
 * Alerta de confirmación genérica que identifica la solicitud, describe la
 * acción y recolecta los campos opcionales antes de confirmar o volver atrás.
 */
export default function DictamenConfirmDialog({
  open,
  id,
  registration,
  title,
  action,
  confirmLabel,
  onConfirm,
  onBack,
}: DictamenConfirmDialogProps) {
  const [observations, setObservations] = useState("");
  const [pendingSubjects, setPendingSubjects] = useState("");
  const [missingDocumentation, setMissingDocumentation] = useState("");

  const summary = `Vas a ${action} de ${formatRegistrationStudentName(registration.student)} en el curso ${registration.course.code}.`;

  const handleConfirm = () => {
    onConfirm(
      buildApprovePayload({
        observations,
        pendingSubjects,
        missingDocumentation,
      }),
    );
  };

  return (
    <CourseDialog open={open} id={id} title={title} onClose={onBack}>
      <p className="text-base text-texto-principal">{summary}</p>

      <div className="mt-4 space-y-3">
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
            rows={3}
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

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onBack} className={SECONDARY_CLASSES}>
          Volver atrás
        </button>
        <button type="button" onClick={handleConfirm} className={PRIMARY_CLASSES}>
          {confirmLabel}
        </button>
      </div>
    </CourseDialog>
  );
}
