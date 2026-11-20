"use client";

import { useRef } from "react";

import {
  formatNotificationFileSize,
  truncateVisualFilename,
} from "../../lib/notifications/labels.ts";
import { NOTIFICATION_TITLE_MAX } from "../../lib/validation/notifications.ts";

interface NotificationComposerProps {
  readonly enabled: boolean;
  readonly title: string;
  readonly titleLength: number;
  readonly content: string;
  readonly attachment: File | null;
  readonly titleError?: string;
  readonly contentError?: string;
  readonly attachmentError?: string;
  readonly onTitleChange: (value: string) => void;
  readonly onContentChange: (value: string) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onRemoveAttachment: () => void;
}

const CONTROL_CLASSES =
  "min-h-11 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal placeholder:text-placeholder focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

/** Redacción: título, contenido y adjunto opcional. */
export default function NotificationComposer({
  enabled,
  title,
  titleLength,
  content,
  attachment,
  titleError,
  contentError,
  attachmentError,
  onTitleChange,
  onContentChange,
  onFileChange,
  onRemoveAttachment,
}: NotificationComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const atLimit = titleLength >= NOTIFICATION_TITLE_MAX;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-end justify-between gap-2">
          <label
            htmlFor="notification-title"
            className="block text-sm font-semibold text-texto-principal"
          >
            Título
          </label>
          <span className="text-xs text-texto-secundario">
            {titleLength}/{NOTIFICATION_TITLE_MAX}
          </span>
        </div>
        <input
          id="notification-title"
          type="text"
          value={title}
          disabled={!enabled}
          maxLength={NOTIFICATION_TITLE_MAX * 4}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={
            titleError ? "notification-title-error" : "notification-title-hint"
          }
          onChange={(event) => {
            onTitleChange(event.target.value);
          }}
          className={CONTROL_CLASSES}
        />
        <p
          id="notification-title-hint"
          className="mt-1 text-xs text-texto-secundario"
        >
          {atLimit
            ? "Alcanzaste el límite de 80 caracteres."
            : "Hasta 80 caracteres; los espacios de los extremos no cuentan."}
        </p>
        {titleError ? (
          <p
            id="notification-title-error"
            role="alert"
            className="mt-1 text-sm font-medium text-estado-error-texto"
          >
            {titleError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="notification-content"
          className="mb-1 block text-sm font-semibold text-texto-principal"
        >
          Contenido
        </label>
        <textarea
          id="notification-content"
          value={content}
          rows={6}
          disabled={!enabled}
          aria-invalid={contentError ? true : undefined}
          aria-describedby={
            contentError ? "notification-content-error" : undefined
          }
          onChange={(event) => {
            onContentChange(event.target.value);
          }}
          className={`${CONTROL_CLASSES} min-h-32`}
        />
        {contentError ? (
          <p
            id="notification-content-error"
            role="alert"
            className="mt-1 text-sm font-medium text-estado-error-texto"
          >
            {contentError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="notification-attachment"
          className="mb-1 block text-sm font-semibold text-texto-principal"
        >
          Adjunto (opcional)
        </label>
        <input
          ref={fileInputRef}
          id="notification-attachment"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          disabled={!enabled}
          aria-describedby={
            attachmentError ? "notification-attachment-error" : undefined
          }
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            onFileChange(file);
          }}
          className="block w-full text-sm text-texto-principal file:mr-3 file:rounded-lg file:border file:border-borde-input file:bg-superficie file:px-3 file:py-2 file:text-sm file:font-semibold file:text-texto-principal disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-texto-secundario">
          PDF, JPG, JPEG, PNG o WEBP de hasta 5 MB.
        </p>

        {attachment ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-borde-input bg-fondo-app px-3 py-2">
            <span
              className="min-w-0 break-words text-sm text-texto-principal"
              title={attachment.name}
            >
              <span aria-hidden="true">
                {truncateVisualFilename(attachment.name)}
              </span>
              <span className="sr-only">{attachment.name}</span>
            </span>
            <span className="text-xs text-texto-secundario">
              {formatNotificationFileSize(attachment.size)}
            </span>
            <button
              type="button"
              onClick={() => {
                onRemoveAttachment();
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={!enabled}
              className="ml-auto text-sm font-semibold text-estado-error-texto underline underline-offset-2 disabled:text-texto-secundario"
            >
              Quitar
            </button>
          </div>
        ) : null}

        {attachmentError ? (
          <p
            id="notification-attachment-error"
            role="alert"
            className="mt-1 text-sm font-medium text-estado-error-texto"
          >
            {attachmentError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
