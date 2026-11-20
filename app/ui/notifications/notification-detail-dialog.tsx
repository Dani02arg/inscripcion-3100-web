"use client";

import { useState } from "react";

import { downloadNotificationAttachmentAction } from "../../lib/actions/notifications.ts";
import {
  formatNotificationDate,
} from "../../lib/notifications/labels.ts";
import type { NotificationItem } from "../../lib/notifications/types.ts";
import CourseDialog from "../courses/course-dialog.tsx";

interface NotificationDetailDialogProps {
  readonly open: boolean;
  readonly notification: NotificationItem | null;
  readonly readPending: boolean;
  readonly readError: string | null;
  readonly onClose: () => void;
}

type DownloadState =
  | { readonly status: "idle" }
  | { readonly status: "pending" }
  | { readonly status: "error"; readonly message: string };

const SECONDARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie disabled:cursor-not-allowed disabled:text-texto-secundario";

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: contentType });
}

/** Detalle completo con lectura y descarga del adjunto. */
export default function NotificationDetailDialog({
  open,
  notification,
  readPending,
  readError,
  onClose,
}: NotificationDetailDialogProps) {
  const [download, setDownload] = useState<DownloadState>({ status: "idle" });

  if (!notification) {
    return null;
  }

  const handleDownload = (): void => {
    if (download.status === "pending") {
      return;
    }

    setDownload({ status: "pending" });

    downloadNotificationAttachmentAction(notification.id)
      .then((result) => {
        if (result.status === "success") {
          const blob = base64ToBlob(result.base64, result.contentType);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = result.filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
          setDownload({ status: "idle" });
          return;
        }

        setDownload({ status: "error", message: result.message });
      })
      .catch(() => {
        setDownload({
          status: "error",
          message: "No pudimos descargar el adjunto. Intentá nuevamente.",
        });
      });
  };

  return (
    <CourseDialog
      open={open}
      id="notification-detail"
      title="Detalle de la notificación"
      onClose={onClose}
      closeOnBackdrop
    >
      <article className="space-y-4">
        <header>
          <h3 className="break-words text-xl font-bold text-texto-principal">
            {notification.title}
          </h3>
          <p className="mt-1 text-sm text-texto-secundario">
            Enviada el {formatNotificationDate(notification.sentAt)}
          </p>
          <p className="mt-1 text-sm text-texto-secundario">
            {notification.isRead
              ? `Leída el ${formatNotificationDate(notification.readAt)}`
              : "No leída"}
          </p>
        </header>

        <p className="whitespace-pre-wrap break-words text-base text-texto-principal">
          {notification.content}
        </p>

        {readPending ? (
          <p role="status" aria-live="polite" className="text-sm text-texto-secundario">
            Marcando como leída…
          </p>
        ) : null}

        {readError ? (
          <p role="alert" className="text-sm font-medium text-estado-error-texto">
            {readError}
          </p>
        ) : null}

        {notification.hasAttachment ? (
          <div className="rounded-xl border border-borde-input bg-fondo-app p-3">
            <p className="text-sm font-semibold text-texto-principal">Adjunto</p>
            <button
              type="button"
              onClick={handleDownload}
              disabled={download.status === "pending"}
              className={`mt-2 ${SECONDARY_CLASSES}`}
            >
              {download.status === "pending"
                ? "Descargando…"
                : "Descargar adjunto"}
            </button>
            {download.status === "error" ? (
              <p role="alert" className="mt-2 text-sm font-medium text-estado-error-texto">
                {download.message}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-texto-secundario">Sin adjunto</p>
        )}
      </article>
    </CourseDialog>
  );
}
