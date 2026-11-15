import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_SHORT_LABELS,
  isRegistrationStatus,
} from "./labels.ts";
import type { RegistrationStatus, RegistrationStatusTab } from "./types.ts";

/** Pestaña del listado con su valor y su rótulo visible. */
export interface RegistrationStatusTabItem {
  readonly value: RegistrationStatusTab;
  readonly label: string;
}

/** Pestañas de estado en el orden de presentación. */
export const REGISTRATION_STATUS_TABS = Object.freeze([
  Object.freeze({ value: "ALL", label: "Todas" }),
  Object.freeze({ value: "PENDING", label: "Pendientes" }),
  Object.freeze({ value: "OBSERVED", label: "Observadas" }),
  Object.freeze({ value: "PROPOSED_REASSIGNMENT", label: "Reasignadas" }),
  Object.freeze({ value: "APPROVED", label: "Aprobadas" }),
  Object.freeze({ value: "REJECTED", label: "Rechazadas" }),
] as const satisfies readonly RegistrationStatusTabItem[]);

/** Pestaña inicial; la ausencia de parámetro abre en «Pendientes». */
export const DEFAULT_STATUS_TAB: RegistrationStatus = "PENDING";

/** Convierte una pestaña al valor del parámetro `status` de la URL. */
export function statusToParam(tab: RegistrationStatusTab): string {
  return tab === "ALL" ? "all" : tab;
}

/** Interpreta el parámetro `status`; ausente o inválido devuelve `PENDING`. */
export function paramToStatus(
  param: string | null | undefined,
): RegistrationStatusTab {
  if (param === "all") {
    return "ALL";
  }

  return isRegistrationStatus(param) ? param : DEFAULT_STATUS_TAB;
}

/** Nombre completo del estado. */
export function getStatusLabel(status: RegistrationStatus): string {
  return REGISTRATION_STATUS_LABELS[status];
}

/** Etiqueta corta del estado para el botón flotante. */
export function getStatusShortLabel(status: RegistrationStatus): string {
  return REGISTRATION_STATUS_SHORT_LABELS[status];
}
