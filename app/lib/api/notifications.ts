import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  INVALID_RESPONSE_MESSAGE,
} from "../auth/types.ts";
import {
  getApiMessage,
  isRecord,
} from "./auth.ts";
import { getApiBaseUrl } from "./config.ts";
import {
  isValidNotificationDate,
  parseContentDispositionFilename,
  sanitizeAttachmentFilename,
} from "../notifications/labels.ts";
import {
  mapNotificationFieldErrors,
  translateNotificationFieldErrors,
  validateNotificationAttachment,
} from "../validation/notifications.ts";
import type {
  NotificationFailure,
  NotificationFieldErrors,
  NotificationItem,
  NotificationListResult,
  NotificationReadResult,
  NotificationSendInput,
  NotificationSendResult,
} from "../notifications/types.ts";

export const NOTIFICATIONS_ENDPOINT_PATH = "/api/notifications";
export const NOTIFICATIONS_TIMEOUT_MS = 10_000;
export const NOTIFICATION_SEND_TIMEOUT_MS = 30_000;
export const NOTIFICATION_ATTACHMENT_TIMEOUT_MS = 20_000;

export const NOTIFICATIONS_LOAD_ERROR_MESSAGE =
  "No pudimos cargar las notificaciones. Intentá nuevamente.";
export const NOTIFICATION_NOT_FOUND_MESSAGE =
  "La notificación no está disponible.";
export const NOTIFICATION_READ_ERROR_MESSAGE =
  "No pudimos registrar la lectura. Intentá nuevamente.";
export const NOTIFICATION_ATTACHMENT_NOT_FOUND_MESSAGE =
  "El adjunto no está disponible.";
export const NOTIFICATION_ATTACHMENT_ERROR_MESSAGE =
  "No pudimos descargar el adjunto. Intentá nuevamente.";
export const NOTIFICATION_SEND_ERROR_MESSAGE =
  "No pudimos enviar la notificación. Intentá nuevamente.";
export const NOTIFICATION_SEND_UNCERTAIN_MESSAGE =
  "No sabemos si la notificación se envió. Revisá antes de reintentar.";
export const NOTIFICATION_SEND_TOO_LARGE_MESSAGE =
  "El adjunto supera el tamaño permitido por el servicio.";
export const NOTIFICATION_SEND_FORBIDDEN_MESSAGE =
  "Tu cuenta no tiene permiso para enviar notificaciones.";
export const NOTIFICATION_TUTOR_NOT_FOUND_MESSAGE =
  "El tutor no existe o no está verificado.";
export const NOTIFICATION_SEND_VALIDATION_MESSAGE =
  "Revisá los datos señalados por el servicio.";

export interface NotificationRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export interface NotificationAttachmentBlobSuccess {
  readonly ok: true;
  readonly blob: Blob;
  readonly filename: string;
  readonly contentType: string;
}

export type NotificationAttachmentBlobResult =
  | NotificationAttachmentBlobSuccess
  | NotificationFailure;

function failure(
  kind: NotificationFailure["kind"],
  status: number | null,
  message: string,
  fieldErrors?: NotificationFieldErrors,
): NotificationFailure {
  return {
    ok: false,
    kind,
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

function statusFailure(
  status: number,
  body: unknown,
  messages: {
    readonly notFound: string;
    readonly fallback: string;
  },
): NotificationFailure {
  if (status === 401) {
    return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return failure("not_found", status, messages.notFound);
  }

  if (status === 413) {
    return failure(
      "too_large",
      status,
      getApiMessage(body, NOTIFICATION_SEND_TOO_LARGE_MESSAGE),
    );
  }

  if (status === 422) {
    const translated = translateNotificationFieldErrors(
      mapNotificationFieldErrors(body),
    );

    return failure(
      "validation",
      status,
      getApiMessage(body, NOTIFICATION_SEND_VALIDATION_MESSAGE),
      translated,
    );
  }

  return failure("server", status, messages.fallback);
}

function parseRequiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Valida y normaliza una notificación del servicio. */
export function parseNotification(value: unknown): NotificationItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseRequiredText(value.id);
  const title = parseRequiredText(value.title);
  const content = parseRequiredText(value.content);
  const isRead = value.isRead;
  const hasAttachment = value.hasAttachment;

  if (
    id === null ||
    title === null ||
    content === null ||
    typeof isRead !== "boolean" ||
    typeof hasAttachment !== "boolean"
  ) {
    return null;
  }

  if (!isValidNotificationDate(value.sentAt)) {
    return null;
  }

  const readAt = value.readAt ?? null;

  if (
    readAt !== null &&
    (!isValidNotificationDate(readAt) || !isRead)
  ) {
    return null;
  }

  if (isRead && readAt === null) {
    return null;
  }

  const attachmentUrl = value.attachmentUrl ?? null;

  if (hasAttachment) {
    if (typeof attachmentUrl !== "string" || attachmentUrl.trim().length === 0) {
      return null;
    }
  } else if (attachmentUrl !== null && attachmentUrl !== undefined) {
    return null;
  }

  return {
    id,
    title,
    content,
    isRead,
    readAt: typeof readAt === "string" ? readAt : null,
    hasAttachment,
    attachmentUrl: typeof attachmentUrl === "string" ? attachmentUrl : null,
    sentAt: value.sentAt,
  };
}

function parseNotifications(value: unknown): NotificationItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items: NotificationItem[] = [];
  const ids = new Set<string>();

  for (const entry of value) {
    const item = parseNotification(entry);

    if (!item || ids.has(item.id)) {
      return null;
    }

    ids.add(item.id);
    items.push(item);
  }

  return items;
}

/** Interpreta `GET /api/notifications`. */
export function parseNotificationListResponse(
  status: number,
  body: unknown,
): NotificationListResult {
  if (status !== 200) {
    return statusFailure(status, body, {
      notFound: NOTIFICATIONS_LOAD_ERROR_MESSAGE,
      fallback: NOTIFICATIONS_LOAD_ERROR_MESSAGE,
    });
  }

  if (!isRecord(body)) {
    return failure("server", status, INVALID_RESPONSE_MESSAGE);
  }

  const notifications = parseNotifications(body.data);

  if (notifications === null) {
    return failure("server", status, INVALID_RESPONSE_MESSAGE);
  }

  return {
    ok: true,
    notifications,
    message: getApiMessage(body, ""),
  };
}

/** Interpreta `PATCH /api/notifications/{id}/read`. */
export function parseNotificationReadResponse(
  status: number,
  body: unknown,
): NotificationReadResult {
  if (status !== 200) {
    if (status === 403 || status === 404) {
      return failure("not_found", status, NOTIFICATION_NOT_FOUND_MESSAGE);
    }

    return statusFailure(status, body, {
      notFound: NOTIFICATION_NOT_FOUND_MESSAGE,
      fallback: NOTIFICATION_READ_ERROR_MESSAGE,
    });
  }

  if (!isRecord(body)) {
    return failure("server", status, INVALID_RESPONSE_MESSAGE);
  }

  const notification = parseNotification(body.data);

  if (!notification) {
    return failure("server", status, INVALID_RESPONSE_MESSAGE);
  }

  return {
    ok: true,
    notification,
    message: getApiMessage(body, ""),
  };
}

/** Interpreta la respuesta de `POST /api/notifications`. */
export function parseNotificationSendResponse(
  status: number,
  body: unknown,
): NotificationSendResult {
  if (status >= 200 && status < 300) {
    const id =
      isRecord(body) && isRecord(body.data)
        ? parseRequiredText(body.data.id)
        : null;

    return {
      ok: true,
      id,
      message: getApiMessage(body, "Notificación enviada correctamente."),
    };
  }

  if (status === 401) {
    return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return failure("forbidden", status, NOTIFICATION_SEND_FORBIDDEN_MESSAGE);
  }

  if (status === 404) {
    return failure("not_found", status, NOTIFICATION_TUTOR_NOT_FOUND_MESSAGE);
  }

  if (status === 413) {
    return failure(
      "too_large",
      status,
      getApiMessage(body, NOTIFICATION_SEND_TOO_LARGE_MESSAGE),
    );
  }

  if (status === 422) {
    const translated = translateNotificationFieldErrors(
      mapNotificationFieldErrors(body),
    );

    return failure(
      "validation",
      status,
      getApiMessage(body, NOTIFICATION_SEND_VALIDATION_MESSAGE),
      translated,
    );
  }

  return failure(
    "server",
    status,
    getApiMessage(body, NOTIFICATION_SEND_ERROR_MESSAGE),
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resolveBaseUrl(
  options: NotificationRequestOptions,
  logLabel: string,
): string | null {
  try {
    return getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[${logLabel}] ${detail}`);
    return null;
  }
}

function buildSendRequest(
  input: NotificationSendInput,
): { readonly headers: Record<string, string>; readonly body: BodyInit } {
  const baseHeaders: Record<string, string> = { Accept: "application/json" };

  if (input.attachment) {
    const formData = new FormData();
    formData.set("title", input.title);
    formData.set("content", input.content);
    formData.set("audience", input.audience);

    if (input.audience === "individual" && input.recipientId) {
      formData.set("recipientId", input.recipientId);
    }

    if (input.audience === "course" && input.courseId) {
      formData.set("courseId", input.courseId);
    }

    formData.set("attachment", input.attachment, input.attachment.name);

    return { headers: baseHeaders, body: formData };
  }

  const payload: Record<string, string> = {
    title: input.title,
    content: input.content,
    audience: input.audience,
  };

  if (input.audience === "individual" && input.recipientId) {
    payload.recipientId = input.recipientId;
  }

  if (input.audience === "course" && input.courseId) {
    payload.courseId = input.courseId;
  }

  return {
    headers: { ...baseHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

/** Obtiene la bandeja propia. */
export async function listNotifications(
  token: string,
  options: NotificationRequestOptions = {},
): Promise<NotificationListResult> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? NOTIFICATIONS_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = resolveBaseUrl(options, "notifications");

  if (!baseUrl) {
    return failure("server", null, NOTIFICATIONS_LOAD_ERROR_MESSAGE);
  }

  try {
    const response = await fetchImpl(`${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    return parseNotificationListResponse(
      response.status,
      await readJson(response),
    );
  } catch {
    return failure("server", null, NOTIFICATIONS_LOAD_ERROR_MESSAGE);
  }
}

/** Marca una notificación propia como leída. */
export async function markNotificationRead(
  token: string,
  notificationId: string,
  options: NotificationRequestOptions = {},
): Promise<NotificationReadResult> {
  const id = notificationId.trim();

  if (id.length === 0) {
    return failure("not_found", null, NOTIFICATION_NOT_FOUND_MESSAGE);
  }

  const timeoutMs = Math.max(1, options.timeoutMs ?? NOTIFICATIONS_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = resolveBaseUrl(options, "notifications");

  if (!baseUrl) {
    return failure("server", null, NOTIFICATION_READ_ERROR_MESSAGE);
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}/${encodeURIComponent(id)}/read`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    return parseNotificationReadResponse(
      response.status,
      await readJson(response),
    );
  } catch {
    return failure("server", null, NOTIFICATION_READ_ERROR_MESSAGE);
  }
}

/** Envía una notificación; JSON sin adjunto y multipart con adjunto. */
export async function sendNotification(
  token: string,
  input: NotificationSendInput,
  options: NotificationRequestOptions = {},
): Promise<NotificationSendResult> {
  if (input.attachment) {
    const validation = validateNotificationAttachment(input.attachment);

    if (!validation.ok) {
      return failure(
        "validation",
        null,
        validation.message ?? NOTIFICATION_SEND_VALIDATION_MESSAGE,
        { attachment: validation.message ?? NOTIFICATION_SEND_VALIDATION_MESSAGE },
      );
    }
  }

  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? NOTIFICATION_SEND_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = resolveBaseUrl(options, "notifications");

  if (!baseUrl) {
    return failure("server", null, NOTIFICATION_SEND_ERROR_MESSAGE);
  }

  const request = buildSendRequest(input);

  try {
    const response = await fetchImpl(`${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}`, {
      method: "POST",
      headers: {
        ...request.headers,
        Authorization: `Bearer ${token}`,
      },
      body: request.body,
      credentials: "omit",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    return parseNotificationSendResponse(
      response.status,
      await readJson(response),
    );
  } catch {
    return failure("uncertain", null, NOTIFICATION_SEND_UNCERTAIN_MESSAGE);
  }
}

/** Descarga el adjunto de una notificación propia. */
export async function downloadNotificationAttachment(
  token: string,
  notificationId: string,
  options: NotificationRequestOptions = {},
): Promise<NotificationAttachmentBlobResult> {
  const id = notificationId.trim();

  if (id.length === 0) {
    return failure(
      "not_found",
      null,
      NOTIFICATION_ATTACHMENT_NOT_FOUND_MESSAGE,
    );
  }

  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? NOTIFICATION_ATTACHMENT_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = resolveBaseUrl(options, "notifications");

  if (!baseUrl) {
    return failure("server", null, NOTIFICATION_ATTACHMENT_ERROR_MESSAGE);
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}${NOTIFICATIONS_ENDPOINT_PATH}/${encodeURIComponent(id)}/attachment`,
      {
        method: "GET",
        headers: {
          Accept: "application/octet-stream",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    if (response.status !== 200) {
      return statusFailure(response.status, null, {
        notFound: NOTIFICATION_ATTACHMENT_NOT_FOUND_MESSAGE,
        fallback: NOTIFICATION_ATTACHMENT_ERROR_MESSAGE,
      });
    }

    const blob = await response.blob();
    const filename =
      parseContentDispositionFilename(
        response.headers.get("Content-Disposition"),
      ) || sanitizeAttachmentFilename("");
    const contentType =
      response.headers.get("Content-Type") ?? "application/octet-stream";

    return { ok: true, blob, filename, contentType };
  } catch {
    return failure("server", null, NOTIFICATION_ATTACHMENT_ERROR_MESSAGE);
  }
}
