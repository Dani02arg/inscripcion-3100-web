"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  downloadNotificationAttachment,
  listNotifications,
  markNotificationRead,
  sendNotification,
} from "../api/notifications.ts";
import { countUnreadNotifications } from "../notifications/rules.ts";
import {
  getNotificationCoursesData,
  getNotificationTutorsData,
} from "../notifications/data.ts";
import {
  getNotificationBadgeToken,
  getNotificationReaderActionAccess,
  getNotificationSenderActionAccess,
} from "../notifications/guard.ts";
import {
  badgeActionCore,
  downloadActionCore,
  readActionCore,
  sendActionCore,
} from "../notifications/action-core.ts";
import type {
  CourseOptionsResult,
  DownloadNotificationState,
  ReadNotificationState,
  SendNotificationState,
  TutorDirectoryResult,
} from "../notifications/types.ts";

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

/** Conteo de no leídas para el badge; nunca redirige. */
export async function getNotificationBadgeAction(): Promise<number | null> {
  return badgeActionCore({
    getToken: getNotificationBadgeToken,
    countUnread: async (token) => {
      const result = await listNotifications(token);

      return result.ok
        ? countUnreadNotifications(result.notifications)
        : null;
    },
  });
}

/** Marca una notificación propia como leída. */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ReadNotificationState> {
  return readActionCore(notificationId, {
    getAccess: getNotificationReaderActionAccess,
    callApi: (token) => markNotificationRead(token, notificationId),
    redirect,
  });
}

/** Descarga el adjunto y lo entrega como base64. */
export async function downloadNotificationAttachmentAction(
  notificationId: string,
): Promise<DownloadNotificationState> {
  return downloadActionCore(notificationId, {
    getAccess: getNotificationReaderActionAccess,
    callApi: (token) => downloadNotificationAttachment(token, notificationId),
    redirect,
    encodeAttachment: blobToBase64,
  });
}

/** Envía una notificación con la audiencia y el adjunto indicados. */
export async function sendNotificationAction(
  _previousState: SendNotificationState,
  formData: FormData,
): Promise<SendNotificationState> {
  return sendActionCore(formData, {
    getAccess: getNotificationSenderActionAccess,
    callSendApi: sendNotification,
    redirect,
    revalidate: (path) => revalidatePath(path),
  });
}

/** Carga los cursos del año vigente para el selector. */
export async function loadNotificationCoursesAction(): Promise<CourseOptionsResult> {
  const access = await getNotificationSenderActionAccess();

  if (access.status === "forbidden") {
    if (access.kind === "unauthorized") {
      redirect("/session-expired");
    }

    return {
      ok: false,
      kind: "forbidden",
      status: null,
      message: access.message,
    };
  }

  const year = new Date().getFullYear();
  const result = await getNotificationCoursesData(access.token, year);

  if (!result.ok && result.kind === "unauthorized") {
    redirect("/session-expired");
  }

  return result;
}

/** Carga el directorio completo de tutores para el selector. */
export async function loadNotificationTutorsAction(): Promise<TutorDirectoryResult> {
  const access = await getNotificationSenderActionAccess();

  if (access.status === "forbidden") {
    if (access.kind === "unauthorized") {
      redirect("/session-expired");
    }

    return {
      ok: false,
      kind: "forbidden",
      status: null,
      message: access.message,
    };
  }

  const result = await getNotificationTutorsData(access.token);

  if (!result.ok && result.kind === "unauthorized") {
    redirect("/session-expired");
  }

  return result;
}
