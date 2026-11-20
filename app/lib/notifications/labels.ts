import type { UserSummary } from "../users/types.ts";
import type {
  NotificationAudience,
  NotificationItem,
} from "./types.ts";
import { NOTIFICATION_AUDIENCES } from "./types.ts";

export const NOTIFICATION_NO_INFO_LABEL = "No disponible";
export const NOTIFICATION_UNKNOWN_AUDIENCE_LABEL = "Audiencia desconocida";
export const NOTIFICATION_NO_CONTACT_LABEL = "Sin datos de contacto";
export const NOTIFICATION_SUMMARY_MAX_LENGTH = 140;
export const NOTIFICATION_FILENAME_VISUAL_MAX = 60;

export const NOTIFICATION_AUDIENCE_LABELS: Record<
  NotificationAudience,
  string
> = {
  individual: "Un tutor",
  course: "Por curso",
  allTutors: "Todos los tutores",
};

export const NOTIFICATION_AUDIENCE_DESCRIPTIONS: Record<
  NotificationAudience,
  string
> = {
  individual: "Recibe un único tutor verificado.",
  course: "Reciben los tutores verificados del curso elegido.",
  allTutors: "Reciben todos los tutores verificados de la institución.",
};

const ISO_WALL_CLOCK_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const utc = new Date(Date.UTC(year, month - 1, day));

  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/**
 * Presenta el instante con la hora de pared del offset informado por el
 * servicio. No convierte a la zona del navegador ni del servidor.
 */
export function formatNotificationDate(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") {
    return NOTIFICATION_NO_INFO_LABEL;
  }

  const trimmed = value.trim();
  const match = ISO_WALL_CLOCK_PATTERN.exec(trimmed);

  if (!match) {
    return NOTIFICATION_NO_INFO_LABEL;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    !isValidCalendarDate(year, month, day) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return NOTIFICATION_NO_INFO_LABEL;
  }

  const pad = (part: number): string => String(part).padStart(2, "0");

  return `${pad(day)}/${pad(month)}/${year} ${pad(hour)}:${pad(minute)}`;
}

/** Indica si el instante ISO puede interpretarse con el formato esperado. */
export function isValidNotificationDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    formatNotificationDate(value) !== NOTIFICATION_NO_INFO_LABEL
  );
}

/** Colapsa blancos y recorta el resumen a 140 puntos de código. */
export function summarizeNotificationContent(
  content: string,
  max = NOTIFICATION_SUMMARY_MAX_LENGTH,
): string {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "";
  }

  const safeMax =
    Number.isSafeInteger(max) && max > 0
      ? max
      : NOTIFICATION_SUMMARY_MAX_LENGTH;
  const characters = Array.from(normalized);

  if (characters.length <= safeMax) {
    return normalized;
  }

  return `${characters.slice(0, safeMax).join("")}…`;
}

/** Nombre accesible de una fila de la bandeja. */
export function buildNotificationRowLabel(
  item: Pick<
    NotificationItem,
    "title" | "isRead" | "hasAttachment" | "sentAt"
  >,
): string {
  const state = item.isRead ? "Leída" : "No leída";
  const attachment = item.hasAttachment ? "Con adjunto" : "Sin adjunto";

  return `${item.title}. ${state}. Enviada el ${formatNotificationDate(item.sentAt)}. ${attachment}.`;
}

/** Nombre accesible del ítem del menú según el conteo conocido. */
export function buildNotificationMenuLabel(count: number | null): string {
  if (count === null || !Number.isSafeInteger(count) || count < 0) {
    return "Notificaciones";
  }

  if (count === 0) {
    return "Notificaciones, no hay notificaciones sin leer";
  }

  return `Notificaciones, ${count} sin leer`;
}

/** Texto corto para el badge; `null` cuando no corresponde mostrarlo. */
export function formatUnreadBadge(count: number | null): string | null {
  if (count === null || !Number.isSafeInteger(count) || count <= 0) {
    return null;
  }

  return count >= 100 ? "99+" : String(count);
}

/** Indica si una cadena es una audiencia documentada. */
export function isNotificationAudience(
  value: unknown,
): value is NotificationAudience {
  return (
    typeof value === "string" &&
    (NOTIFICATION_AUDIENCES as readonly string[]).includes(value)
  );
}

/** Etiqueta visible de una audiencia. */
export function getAudienceLabel(value: string): string {
  return isNotificationAudience(value)
    ? NOTIFICATION_AUDIENCE_LABELS[value]
    : NOTIFICATION_UNKNOWN_AUDIENCE_LABEL;
}

/** Etiqueta de un tutor para los resultados del buscador. */
export function buildTutorOptionLabel(user: UserSummary): string {
  const fullName = `${user.lastname}, ${user.name}`.trim();
  const contact = user.dni ?? user.email ?? NOTIFICATION_NO_CONTACT_LABEL;

  return `${fullName} — ${contact}`;
}

/** Extrae el nombre de archivo de `Content-Disposition`. */
export function parseContentDispositionFilename(
  header: string | null,
): string {
  if (!header) {
    return "";
  }

  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);

  if (encoded?.[1]) {
    try {
      return sanitizeAttachmentFilename(decodeURIComponent(encoded[1].trim()));
    } catch {
      return sanitizeAttachmentFilename(encoded[1].trim());
    }
  }

  const simple = /filename\s*=\s*"([^"]*)"|filename\s*=\s*([^;]+)/i.exec(
    header,
  );
  const value = simple?.[1] ?? simple?.[2] ?? "";

  return sanitizeAttachmentFilename(value.trim());
}

/** Quita rutas y caracteres de control de un nombre de archivo. */
export function sanitizeAttachmentFilename(name: string): string {
  const withoutControls = name.replace(/[\u0000-\u001f\u007f]/g, "");
  const segments = withoutControls.split(/[\\/]/);
  const last = segments[segments.length - 1]?.trim() ?? "";

  return last.length > 0 ? last : "adjunto";
}

/** Trunca visualmente un nombre de archivo conservando el original aparte. */
export function truncateVisualFilename(
  name: string,
  max = NOTIFICATION_FILENAME_VISUAL_MAX,
): string {
  const characters = Array.from(name);

  if (characters.length <= max) {
    return name;
  }

  return `${characters.slice(0, max).join("")}…`;
}

/** Tamaño en megabytes con un decimal y coma decimal. */
export function formatNotificationFileSize(bytes: number): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  const megabytes = (safe / 1_000_000).toFixed(1).replace(".", ",");

  return `${megabytes} MB`;
}
