import { REGISTRATION_STATUSES } from "./types.ts";
import type {
  Registration,
  RegistrationStatus,
  RegistrationStudent,
} from "./types.ts";

/** Reutiliza las etiquetas de ciclo, turno y especialidad de Cursos. */
export {
  getCycleLabel,
  getShiftLabel,
  getSpecialityLabel,
} from "../courses/labels.ts";

/** Texto para un dato opcional sin informar. */
export const REGISTRATION_NO_INFO_LABEL = "No informado";

/** Texto para un valor que el servicio devuelve fuera de lo documentado. */
export const REGISTRATION_UNKNOWN_LABEL = "No disponible";

/** Nombre completo de cada estado de la solicitud. */
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "Pendiente",
  OBSERVED: "Observada",
  PROPOSED_REASSIGNMENT: "Propuesta de Reasignación",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

/** Etiqueta corta de cada estado para el botón flotante. */
export const REGISTRATION_STATUS_SHORT_LABELS: Record<
  RegistrationStatus,
  string
> = {
  PENDING: "P",
  OBSERVED: "O",
  PROPOSED_REASSIGNMENT: "PR",
  APPROVED: "A",
  REJECTED: "R",
};

/** Indica si el valor es uno de los estados documentados. */
export function isRegistrationStatus(
  value: unknown,
): value is RegistrationStatus {
  return (
    typeof value === "string" &&
    (REGISTRATION_STATUSES as readonly string[]).includes(value)
  );
}

export interface RegistrationDateOptions {
  readonly timeZone?: string;
}

/** Presenta un instante ISO como `DD/MM/AAAA HH:mm`; por defecto usa la zona local. */
export function formatRegistrationDate(
  value: string | null | undefined,
  options: RegistrationDateOptions = {},
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return REGISTRATION_NO_INFO_LABEL;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return REGISTRATION_NO_INFO_LABEL;
  }

  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat("en-GB", {
      ...(options.timeZone ? { timeZone: options.timeZone } : {}),
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return REGISTRATION_NO_INFO_LABEL;
  }

  const parts = formatter.formatToParts(date);
  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("day")}/${getPart("month")}/${getPart("year")} ${getPart("hour")}:${getPart("minute")}`;
}

/** Devuelve «Apellido, Nombre», o «No informado» si no hay nombre utilizable. */
export function formatRegistrationStudentName(
  student: Pick<RegistrationStudent, "firstName" | "lastName">,
): string {
  const lastname = student.lastName.trim();
  const firstName = student.firstName.trim();

  if (lastname.length > 0 && firstName.length > 0) {
    return `${lastname}, ${firstName}`;
  }

  if (lastname.length > 0) {
    return lastname;
  }

  if (firstName.length > 0) {
    return firstName;
  }

  return REGISTRATION_NO_INFO_LABEL;
}

/** Nombre accesible de una tarjeta de inscripción. */
export function buildCardLabel(
  registration: Pick<Registration, "student">,
): string {
  return `Inscripción de ${formatRegistrationStudentName(registration.student)}`;
}
