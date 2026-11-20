import {
  getAudienceLabel,
  truncateVisualFilename,
} from "../../lib/notifications/labels.ts";
import type { NotificationAudience } from "../../lib/notifications/types.ts";

interface SendConfirmationProps {
  readonly audience: NotificationAudience;
  readonly courseLabel: string | null;
  readonly tutorLabel: string | null;
  readonly title: string;
  readonly attachmentName: string | null;
  readonly sending: boolean;
  readonly uncertainMessage: string | null;
  readonly generalError: string | null;
  readonly onBack: () => void;
  readonly onConfirm: () => void;
}

const PRIMARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie disabled:cursor-not-allowed disabled:opacity-60";

const SECONDARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie disabled:cursor-not-allowed disabled:text-texto-secundario";

/** Confirmación previa al envío. */
export default function SendConfirmation({
  audience,
  courseLabel,
  tutorLabel,
  title,
  attachmentName,
  sending,
  uncertainMessage,
  generalError,
  onBack,
  onConfirm,
}: SendConfirmationProps) {
  return (
    <div className="space-y-4">
      <dl className="space-y-2 rounded-xl border border-borde-input bg-fondo-app p-3 text-sm">
        <div className="flex flex-wrap gap-1">
          <dt className="font-semibold text-texto-principal">Audiencia:</dt>
          <dd className="text-texto-principal">{getAudienceLabel(audience)}</dd>
        </div>

        {courseLabel ? (
          <div className="flex flex-wrap gap-1">
            <dt className="font-semibold text-texto-principal">Curso:</dt>
            <dd className="break-words text-texto-principal">{courseLabel}</dd>
          </div>
        ) : null}

        {tutorLabel ? (
          <div className="flex flex-wrap gap-1">
            <dt className="font-semibold text-texto-principal">Tutor:</dt>
            <dd className="break-words text-texto-principal">{tutorLabel}</dd>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1">
          <dt className="font-semibold text-texto-principal">Título:</dt>
          <dd className="break-words text-texto-principal">{title}</dd>
        </div>

        <div className="flex flex-wrap gap-1">
          <dt className="font-semibold text-texto-principal">Adjunto:</dt>
          <dd className="break-words text-texto-principal">
            {attachmentName ? (
              <span
                title={attachmentName}
                aria-label={`Adjunto: ${attachmentName}`}
              >
                {truncateVisualFilename(attachmentName)}
              </span>
            ) : (
              "Sin adjunto"
            )}
          </dd>
        </div>
      </dl>

      {uncertainMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-estado-pendiente bg-estado-pendiente-fondo px-3 py-2 text-sm font-medium text-estado-pendiente"
        >
          {uncertainMessage}
        </p>
      ) : null}

      {generalError ? (
        <p role="alert" className="text-sm font-medium text-estado-error-texto">
          {generalError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className={SECONDARY_CLASSES}
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={sending}
          className={PRIMARY_CLASSES}
        >
          {sending
            ? "Enviando…"
            : uncertainMessage
              ? "Reintentar de todos modos"
              : "Confirmar y enviar"}
        </button>
      </div>
    </div>
  );
}
