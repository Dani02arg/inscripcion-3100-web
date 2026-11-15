"use client";

import { REGISTRATION_STATUS_TABS } from "../../lib/registrations/status.ts";
import type { RegistrationStatusTab } from "../../lib/registrations/types.ts";

interface StatusTabsProps {
  value: RegistrationStatusTab;
  onChange: (tab: RegistrationStatusTab) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Pestañas de estado del listado. */
export default function StatusTabs({ value, onChange }: StatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Estados de las solicitudes"
      className="flex flex-wrap gap-2"
    >
      {REGISTRATION_STATUS_TABS.map((tab) => {
        const selected = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`min-h-11 rounded-xl px-4 py-2 text-base font-semibold transition-colors ${FOCUS_RING_CLASSES} ${
              selected
                ? "bg-azul-institucional text-superficie"
                : "border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
