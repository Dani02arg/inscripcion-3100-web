"use client";

import { useState } from "react";

import {
  getDownloadRetryStrategy,
  isValidReportArtifact,
} from "../../lib/reports/artifact.ts";
import type { ReportArtifact } from "../../lib/reports/types.ts";

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const PRIMARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const SECONDARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const DOWNLOAD_ERROR_MESSAGE =
  "No se pudo descargar el reporte. Intentá nuevamente.";

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function triggerArtifactDownload(artifact: ReportArtifact): void {
  const bytes = decodeBase64(artifact.base64);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: artifact.contentType });
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = artifact.filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface ReportDownloadButtonProps {
  readonly artifact: ReportArtifact | null | undefined;
  readonly onRegenerate?: () => void | Promise<void>;
  readonly className?: string;
}

/**
 * Control de descarga que reutiliza el artefacto vigente en cliente.
 * Se muestra solo cuando existe un artefacto descargable según las reglas.
 */
export default function ReportDownloadButton({
  artifact,
  onRegenerate,
  className = "",
}: ReportDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isValidReportArtifact(artifact)) {
    return null;
  }

  const attemptDownload = () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);

    try {
      triggerArtifactDownload(artifact);
    } catch {
      setErrorMessage(DOWNLOAD_ERROR_MESSAGE);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = () => {
    if (isDownloading) {
      return;
    }

    if (getDownloadRetryStrategy(artifact) === "reuse-artifact") {
      attemptDownload();
      return;
    }

    if (onRegenerate) {
      void onRegenerate();
      return;
    }

    setErrorMessage(DOWNLOAD_ERROR_MESSAGE);
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <button
        type="button"
        onClick={attemptDownload}
        disabled={isDownloading}
        aria-busy={isDownloading}
        className={PRIMARY_ACTION_CLASSES}
      >
        {isDownloading ? "Descargando…" : "Descargar reporte"}
      </button>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-borde-input bg-superficie p-3 text-sm text-texto-principal"
        >
          <p>{errorMessage}</p>
          <div className="mt-2">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isDownloading}
              className={SECONDARY_ACTION_CLASSES}
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {isDownloading
          ? "Descarga en curso."
          : errorMessage
            ? "La descarga falló."
            : ""}
      </p>
    </div>
  );
}
