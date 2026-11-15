"use client";

import { useState } from "react";

import { getStatusLabel, getStatusShortLabel } from "../../lib/registrations/status.ts";
import type { RegistrationStatus } from "../../lib/registrations/types.ts";

interface RegistrationStatusFabProps {
  status: RegistrationStatus;
}

/** Botón flotante de estado (móvil): etiqueta corta → nombre completo. */
export default function RegistrationStatusFab({
  status,
}: RegistrationStatusFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          role="status"
          className="rounded-xl bg-superficie px-3 py-2 text-sm font-semibold text-texto-principal shadow-lg"
        >
          {getStatusLabel(status)}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Estado: ${getStatusLabel(status)}`}
        className="flex h-14 min-w-14 items-center justify-center rounded-full bg-azul-institucional px-3 text-lg font-bold text-superficie shadow-lg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
      >
        {getStatusShortLabel(status)}
      </button>
    </div>
  );
}
