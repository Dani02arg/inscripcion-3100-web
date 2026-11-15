"use client";

import CourseDialog from "../courses/course-dialog.tsx";

interface ApproveChoiceDialogProps {
  open: boolean;
  id: string;
  onRequested: () => void;
  onReassign: () => void;
  onBack: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

const PRIMARY_CLASSES =
  `inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 ${FOCUS_RING_CLASSES}`;

const SECONDARY_CLASSES =
  `inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

/** Alerta de elección de aprobar: curso solicitado o reasignación. */
export default function ApproveChoiceDialog({
  open,
  id,
  onRequested,
  onReassign,
  onBack,
}: ApproveChoiceDialogProps) {
  return (
    <CourseDialog open={open} id={id} title="Aprobar solicitud" onClose={onBack}>
      <p className="text-base text-texto-principal">
        Elegí cómo querés aprobar la solicitud:
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRequested}
          className={PRIMARY_CLASSES}
        >
          Aprobar en el curso solicitado
        </button>
        <button
          type="button"
          onClick={onReassign}
          className={SECONDARY_CLASSES}
        >
          Reasignar a otro curso
        </button>
        <button type="button" onClick={onBack} className={SECONDARY_CLASSES}>
          Volver atrás
        </button>
      </div>
    </CourseDialog>
  );
}
