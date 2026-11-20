import { isRecord } from "../api/auth.ts";
import {
  NOTIFICATION_FIELDS,
  type NotificationAudience,
  type NotificationField,
  type NotificationFieldErrors,
  type NotificationSendInput,
} from "../notifications/types.ts";

export const NOTIFICATION_TITLE_MAX = 80;
export const NOTIFICATION_ATTACHMENT_MAX_BYTES = 5_000_000;

export const NOTIFICATION_TITLE_REQUIRED_MESSAGE =
  "Ingresá un título de hasta 80 caracteres.";
export const NOTIFICATION_TITLE_TOO_LONG_MESSAGE =
  "El título no puede superar los 80 caracteres.";
export const NOTIFICATION_CONTENT_REQUIRED_MESSAGE =
  "Ingresá el contenido de la notificación.";
export const NOTIFICATION_ATTACHMENT_REQUIRED_MESSAGE =
  "El archivo no puede estar vacío.";
export const NOTIFICATION_ATTACHMENT_TOO_LARGE_MESSAGE =
  "El adjunto supera el límite de 5 MB.";
export const NOTIFICATION_ATTACHMENT_FORMAT_MESSAGE =
  "El adjunto debe ser PDF, JPG, JPEG, PNG o WEBP.";
export const NOTIFICATION_RECIPIENT_REQUIRED_MESSAGE =
  "Seleccioná un tutor.";
export const NOTIFICATION_COURSE_REQUIRED_MESSAGE =
  "Seleccioná un curso.";
export const NOTIFICATION_VALIDATION_MESSAGE =
  "Revisá los datos ingresados.";

const ATTACHMENT_MIME_BY_EXTENSION: Readonly<Record<string, string>> =
  Object.freeze({
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  });

export interface AttachmentMeta {
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

export interface TitleValidation {
  readonly ok: boolean;
  readonly value: string;
  readonly length: number;
  readonly message?: string;
}

export interface AttachmentValidation {
  readonly ok: boolean;
  readonly message?: string;
}

function getExtension(name: string): string {
  const base = name.trim().toLowerCase();
  const index = base.lastIndexOf(".");

  if (index < 0 || index === base.length - 1) {
    return "";
  }

  return base.slice(index + 1);
}

/** Indica si la extensión y el MIME declarado son compatibles. */
export function isAttachmentCompatible(
  name: string,
  type: string,
): boolean {
  const extension = getExtension(name);
  const expected = ATTACHMENT_MIME_BY_EXTENSION[extension];

  if (!expected) {
    return false;
  }

  const declared = type.trim().toLowerCase();

  if (declared.length === 0) {
    return true;
  }

  return declared === expected;
}

/** Cuenta caracteres Unicode por puntos de código. */
export function countTitleCharacters(value: string): number {
  return Array.from(value).length;
}

/** Recorta espacios, tabulaciones y saltos de los extremos. */
export function normalizeNotificationTitle(value: string): string {
  return value.replace(/^\s+|\s+$/g, "");
}

/** Valida el título sobre el valor recortado. */
export function validateNotificationTitle(value: string): TitleValidation {
  const normalized = normalizeNotificationTitle(value);
  const length = countTitleCharacters(normalized);

  if (length === 0) {
    return {
      ok: false,
      value: normalized,
      length,
      message: NOTIFICATION_TITLE_REQUIRED_MESSAGE,
    };
  }

  if (length > NOTIFICATION_TITLE_MAX) {
    return {
      ok: false,
      value: normalized,
      length,
      message: NOTIFICATION_TITLE_TOO_LONG_MESSAGE,
    };
  }

  return { ok: true, value: normalized, length };
}

/** Exige al menos un carácter no blanco. */
export function validateNotificationContent(value: string): string | null {
  return /\S/.test(value) ? null : NOTIFICATION_CONTENT_REQUIRED_MESSAGE;
}

/** Valida un adjunto candidato antes de incorporarlo. */
export function validateNotificationAttachment(
  file: AttachmentMeta,
): AttachmentValidation {
  if (file.size <= 0) {
    return {
      ok: false,
      message: NOTIFICATION_ATTACHMENT_REQUIRED_MESSAGE,
    };
  }

  if (file.size > NOTIFICATION_ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      message: NOTIFICATION_ATTACHMENT_TOO_LARGE_MESSAGE,
    };
  }

  if (!isAttachmentCompatible(file.name, file.type)) {
    return {
      ok: false,
      message: NOTIFICATION_ATTACHMENT_FORMAT_MESSAGE,
    };
  }

  return { ok: true };
}

export interface NotificationPayload {
  readonly audience: NotificationAudience;
  readonly title: string;
  readonly content: string;
  readonly recipientId?: string;
  readonly courseId?: string;
}

export type PayloadResult =
  | { readonly ok: true; readonly payload: NotificationPayload }
  | { readonly ok: false; readonly fieldErrors: NotificationFieldErrors };

/**
 * Construye el cuerpo del envío con un único identificador según la
 * audiencia y valida los campos requeridos.
 */
export function buildNotificationPayload(
  input: NotificationSendInput,
): PayloadResult {
  const title = validateNotificationTitle(input.title);
  const contentError = validateNotificationContent(input.content);
  const fieldErrors: NotificationFieldErrors = {};

  if (!title.ok) {
    fieldErrors.title = title.message ?? NOTIFICATION_TITLE_REQUIRED_MESSAGE;
  }

  if (contentError) {
    fieldErrors.content = contentError;
  }

  if (input.audience === "individual" && !input.recipientId?.trim()) {
    fieldErrors.recipientId = NOTIFICATION_RECIPIENT_REQUIRED_MESSAGE;
  }

  if (input.audience === "course" && !input.courseId?.trim()) {
    fieldErrors.courseId = NOTIFICATION_COURSE_REQUIRED_MESSAGE;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const base = {
    audience: input.audience,
    title: title.value,
    content: input.content,
  };

  if (input.audience === "individual") {
    return {
      ok: true,
      payload: { ...base, recipientId: input.recipientId?.trim() ?? "" },
    };
  }

  if (input.audience === "course") {
    return {
      ok: true,
      payload: { ...base, courseId: input.courseId?.trim() ?? "" },
    };
  }

  return { ok: true, payload: base };
}

function isNotificationField(value: string): value is NotificationField {
  return (NOTIFICATION_FIELDS as readonly string[]).includes(value);
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);

      if (message) {
        return message;
      }
    }
  }

  return null;
}

/** Extrae el sobre de errores del servicio sin inventar campos. */
export function mapNotificationFieldErrors(
  value: unknown,
): NotificationFieldErrors {
  const source =
    isRecord(value) && isRecord(value.errors) ? value.errors : value;

  if (!isRecord(source)) {
    return {};
  }

  const errors: NotificationFieldErrors = {};

  for (const [key, raw] of Object.entries(source)) {
    if (!isNotificationField(key)) {
      continue;
    }

    const message = firstMessage(raw);

    if (message) {
      errors[key] = message;
    }
  }

  return errors;
}

/** Conserva los mensajes en español del servicio. */
export function translateNotificationFieldErrors(
  fieldErrors: NotificationFieldErrors,
): NotificationFieldErrors {
  return { ...fieldErrors };
}
