import {
  buildNotificationPayload,
  validateNotificationAttachment,
  NOTIFICATION_VALIDATION_MESSAGE,
} from "../validation/notifications.ts";
import { isNotificationAudience } from "./labels.ts";
import type {
  NotificationFailure,
  NotificationSendInput,
} from "./types.ts";
import type {
  DownloadNotificationState,
  NotificationActionDependencies,
  NotificationReadResult,
  NotificationSendResult,
  ReadNotificationState,
  SendNotificationState,
} from "./types.ts";

export interface AttachmentBlobSuccess {
  readonly ok: true;
  readonly blob: Blob;
  readonly filename: string;
  readonly contentType: string;
}

export type AttachmentBlobResult =
  | AttachmentBlobSuccess
  | NotificationFailure;

export interface BadgeDependencies {
  readonly getToken: () => Promise<string | null>;
  readonly countUnread: (token: string) => Promise<number | null>;
}

/** Núcleo testeable del conteo del badge. */
export async function badgeActionCore(
  dependencies: BadgeDependencies,
): Promise<number | null> {
  const token = await dependencies.getToken();

  if (!token) {
    return null;
  }

  return dependencies.countUnread(token);
}

export interface ReadActionDependencies
  extends NotificationActionDependencies<NotificationReadResult> {
  readonly redirect: (path: string) => never;
}

/** Núcleo testeable del marcado de lectura. */
export async function readActionCore(
  notificationId: string,
  dependencies: ReadActionDependencies,
): Promise<ReadNotificationState> {
  const id = notificationId.trim();

  if (id.length === 0) {
    return { status: "unavailable", message: "La notificación no está disponible." };
  }

  const access = await dependencies.getAccess();

  if (access.status !== "ok") {
    const message = access.message;

    if (access.kind === "unauthorized") {
      dependencies.redirect("/session-expired");
    }

    return { status: "error", message };
  }

  const result = await dependencies.callApi(access.token);

  if (!result.ok) {
    const message = result.message;

    if (result.kind === "unauthorized") {
      dependencies.redirect("/session-expired");
      return { status: "error", message };
    }

    if (result.kind === "not_found" || result.kind === "forbidden") {
      return { status: "unavailable", message };
    }

    return { status: "error", message };
  }

  return { status: "success", notification: result.notification };
}

export interface DownloadActionDependencies {
  readonly getAccess: () => Promise<
    | { readonly status: "ok"; readonly token: string }
    | {
        readonly status: "forbidden";
        readonly message: string;
        readonly kind: "forbidden" | "unauthorized";
      }
  >;
  readonly callApi: (token: string) => Promise<AttachmentBlobResult>;
  readonly redirect: (path: string) => never;
  readonly encodeAttachment: (blob: Blob) => Promise<string>;
}

/** Núcleo testeable de la descarga de adjuntos. */
export async function downloadActionCore(
  notificationId: string,
  dependencies: DownloadActionDependencies,
): Promise<DownloadNotificationState> {
  const id = notificationId.trim();

  if (id.length === 0) {
    return { status: "unavailable", message: "El adjunto no está disponible." };
  }

  const access = await dependencies.getAccess();

  if (access.status !== "ok") {
    const message = access.message;

    if (access.kind === "unauthorized") {
      dependencies.redirect("/session-expired");
      return { status: "expired", message };
    }

    return { status: "error", message };
  }

  const result = await dependencies.callApi(access.token);

  if (!result.ok) {
    const message = result.message;

    if (result.kind === "unauthorized") {
      dependencies.redirect("/session-expired");
      return { status: "expired", message };
    }

    if (result.kind === "not_found" || result.kind === "forbidden") {
      return { status: "unavailable", message };
    }

    return { status: "error", message };
  }

  return {
    status: "success",
    base64: await dependencies.encodeAttachment(result.blob),
    filename: result.filename,
    contentType: result.contentType,
  };
}

export interface SendActionDependencies {
  readonly getAccess: () => Promise<
    | { readonly status: "ok"; readonly token: string }
    | {
        readonly status: "forbidden";
        readonly message: string;
        readonly kind: "forbidden" | "unauthorized";
      }
  >;
  readonly callSendApi: (
    token: string,
    input: NotificationSendInput,
  ) => Promise<NotificationSendResult>;
  readonly redirect: (path: string) => never;
  readonly revalidate: (path: string) => void;
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function readAttachment(formData: FormData): File | null {
  const value = formData.get("attachment");

  if (typeof File === "undefined" || !(value instanceof File)) {
    return null;
  }

  return value;
}

/** Núcleo testeable del envío. */
export async function sendActionCore(
  formData: FormData,
  dependencies: SendActionDependencies,
): Promise<SendNotificationState> {
  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    if (access.kind === "unauthorized") {
      dependencies.redirect("/session-expired");
    }

    return { status: "forbidden", message: access.message };
  }

  const audience = readText(formData, "audience");
  const title = readText(formData, "title");
  const content = readText(formData, "content");
  const recipientId = readText(formData, "recipientId");
  const courseId = readText(formData, "courseId");
  const attachment = readAttachment(formData);

  if (!isNotificationAudience(audience)) {
    return {
      status: "validation",
      message: NOTIFICATION_VALIDATION_MESSAGE,
      fieldErrors: {},
    };
  }

  const built = buildNotificationPayload({
    audience,
    title,
    content,
    recipientId,
    courseId,
    attachment,
  });

  if (!built.ok) {
    return {
      status: "validation",
      message: NOTIFICATION_VALIDATION_MESSAGE,
      fieldErrors: built.fieldErrors,
    };
  }

  if (attachment) {
    const validation = validateNotificationAttachment(attachment);

    if (!validation.ok) {
      return {
        status: "validation",
        message: validation.message ?? NOTIFICATION_VALIDATION_MESSAGE,
        fieldErrors: {
          attachment: validation.message ?? NOTIFICATION_VALIDATION_MESSAGE,
        },
      };
    }
  }

  const result = await dependencies.callSendApi(access.token, {
    ...built.payload,
    attachment,
  });

  if (result.ok) {
    dependencies.revalidate("/dashboard/notifications");
    dependencies.revalidate("/dashboard");
    return { status: "success", message: result.message };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect("/session-expired");
    return { status: "error", message: result.message };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message };
  }

  if (result.kind === "too_large") {
    return { status: "too_large", message: result.message };
  }

  if (result.kind === "uncertain") {
    return { status: "uncertain", message: result.message };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
    };
  }

  return { status: "error", message: result.message };
}
