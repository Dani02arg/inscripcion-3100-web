"use client";

import type { Registration } from "../../lib/registrations/types.ts";
import type { DictamenOptionalPayload } from "../../lib/validation/registrations.ts";
import DictamenConfirmDialog from "./dictamen-confirm-dialog.tsx";

interface RejectDialogProps {
  open: boolean;
  id: string;
  registration: Registration;
  onSubmit: (payload: DictamenOptionalPayload) => void;
  onBack: () => void;
}

/** Formulario de rechazo: recolecta opcionales y confirma antes de enviar. */
export default function RejectDialog({
  open,
  id,
  registration,
  onSubmit,
  onBack,
}: RejectDialogProps) {
  return (
    <DictamenConfirmDialog
      open={open}
      id={id}
      registration={registration}
      title="Rechazar solicitud"
      action="rechazar la solicitud"
      confirmLabel="Rechazar"
      onConfirm={onSubmit}
      onBack={onBack}
    />
  );
}
