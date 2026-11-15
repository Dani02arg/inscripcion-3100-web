"use client";

import { useState } from "react";

interface RegistrationActionsFabProps {
  onApprove: () => void;
  onObserve: () => void;
  onReassign: () => void;
  onReject: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-base font-semibold transition-colors ${FOCUS_RING_CLASSES}`;

/** Botón flotante de acciones (móvil): icono → acciones disponibles. */
export default function RegistrationActionsFab({
  onApprove,
  onObserve,
  onReassign,
  onReject,
}: RegistrationActionsFabProps) {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: "Aprobar", onClick: onApprove, kind: "approve" as const },
    { label: "Devolver con observaciones", onClick: onObserve, kind: "observe" as const },
    { label: "Reasignar", onClick: onReassign, kind: "reassign" as const },
    { label: "Rechazar", onClick: onReject, kind: "reject" as const },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex w-64 flex-col gap-2 rounded-2xl border border-borde-input bg-superficie p-2 shadow-lg">
          {actions.map((action) => (
            <button
              key={action.kind}
              type="button"
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={
                action.kind === "approve"
                  ? `${ACTION_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`
                  : `${ACTION_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Acciones de la solicitud"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-azul-institucional text-superficie shadow-lg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    </div>
  );
}
