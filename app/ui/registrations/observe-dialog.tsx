"use client";

import { useState } from "react";

import { formatRegistrationStudentName } from "../../lib/registrations/labels.ts";
import type { Registration } from "../../lib/registrations/types.ts";
import {
  buildObservePayload,
  validateObservations,
  type ObservePayload,
} from "../../lib/validation/registrations.ts";
import CourseDialog from "../courses/course-dialog.tsx";

interface ObserveDialogProps {
  open: boolean;
  id: string;
  registration: Registration;
  onSubmit: (payload: ObservePayload) => void;
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

/** Formulario de devolución con observaciones obligatorias y confirmación. */
export default function ObserveDialog({
  open,
  id,
  registration,
  onSubmit,
  onBack,
}: ObserveDialogProps) {
  const [observations, setObservations] = useState("");
  const [error, setError] = useState<string | null>(null);

  const summary = `Vas a devolver con observaciones la solicitud de ${formatRegistrationStudentName(registration.student)}.`;

  const handleConfirm = () => {
    const validationError = validateObservations(observations);

    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(buildObservePayload({ observations }));
  };

  return (
    <CourseDialog
      open={open}
      id={id}
      title="Devolver con observaciones"
      onClose={onBack}
    >
      <p className="text-base text-texto-principal">{summary}</p>

      <div className="mt-4">
        <label
          htmlFor={`${id}-observations`}
          className="mb-1 block text-sm font-medium text-texto-principal"
        >
          Observaciones
        </label>
        <textarea
          id={`${id}-observations`}
          value={observations}
          onChange={(event) => {
            setObservations(event.target.value);
            setError(null);
          }}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={CONTROL_CLASSES}
        />
        {error ? (
          <p id={`${id}-error`} className="mt-1 text-sm text-texto-principal">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onBack} className={SECONDARY_CLASSES}>
          Volver atrás
        </button>
        <button type="button" onClick={handleConfirm} className={PRIMARY_CLASSES}>
          Confirmar
        </button>
      </div>
    </CourseDialog>
  );
}
