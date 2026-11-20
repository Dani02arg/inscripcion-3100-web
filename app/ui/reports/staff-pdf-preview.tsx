"use client";

import { useMemo, useState } from "react";

import { REPORT_VISUALIZATION_ERROR_MESSAGE } from "../../lib/reports/constants.ts";
import type { ReportArtifact } from "../../lib/reports/types.ts";
import ReportPreviewShell from "./report-preview-shell.tsx";

type ZoomMode = "manual" | "fit-width" | "fit-page";

interface StaffPdfPreviewProps {
  readonly artifact: ReportArtifact;
  readonly isEmpty?: boolean;
  readonly visualizationErrorMessage?: string | null;
  readonly onVisualizationError?: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const CONTROL_BUTTON_CLASSES =
  `inline-flex min-h-10 items-center justify-center rounded-lg border border-borde-input bg-superficie px-3 py-2 text-sm font-medium text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;
const DEFAULT_ZOOM = 100;

const NO_RECORDS_MESSAGE = "No hay registros de personal para mostrar.";

function buildPdfDataUrl(artifact: ReportArtifact): string {
  const contentType = artifact.contentType || "application/pdf";
  return `data:${contentType};base64,${artifact.base64}`;
}

export default function StaffPdfPreview({
  artifact,
  isEmpty = false,
  visualizationErrorMessage = null,
  onVisualizationError,
}: StaffPdfPreviewProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [mode, setMode] = useState<ZoomMode>("fit-width");
  const [internalVisualizationFailed, setInternalVisualizationFailed] =
    useState(false);

  const dataUrl = useMemo(() => buildPdfDataUrl(artifact), [artifact]);

  const showVisualizationError =
    Boolean(visualizationErrorMessage) || internalVisualizationFailed;
  const effectiveVisualizationMessage =
    visualizationErrorMessage ?? REPORT_VISUALIZATION_ERROR_MESSAGE;

  const handleZoomIn = () => {
    setMode("manual");
    setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setMode("manual");
    setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
  };

  const handleFitWidth = () => {
    setMode("fit-width");
  };

  const handleFitPage = () => {
    setMode("fit-page");
  };

  const handleObjectError = () => {
    setInternalVisualizationFailed(true);
    onVisualizationError?.();
  };

  const objectStyle: React.CSSProperties =
    mode === "fit-page"
      ? { width: "100%", height: "100%", minHeight: "100%" }
      : mode === "fit-width"
        ? { width: "100%", height: "70vh", minHeight: "20rem" }
        : { width: `${zoom}%`, height: "70vh", minHeight: "20rem" };

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Controles de zoom de la vista previa"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={mode === "manual" && zoom <= MIN_ZOOM}
          aria-label="Alejar"
          className={CONTROL_BUTTON_CLASSES}
        >
          Alejar
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={mode === "manual" && zoom >= MAX_ZOOM}
          aria-label="Acercar"
          className={CONTROL_BUTTON_CLASSES}
        >
          Acercar
        </button>
        <button
          type="button"
          onClick={handleFitWidth}
          aria-pressed={mode === "fit-width"}
          aria-label="Ajuste al ancho"
          className={CONTROL_BUTTON_CLASSES}
        >
          Ajuste al ancho
        </button>
        <button
          type="button"
          onClick={handleFitPage}
          aria-pressed={mode === "fit-page"}
          aria-label="Ajuste a la página"
          className={CONTROL_BUTTON_CLASSES}
        >
          Ajuste a la página
        </button>
        <span className="text-sm text-texto-principal" aria-live="polite">
          {mode === "manual"
            ? `Zoom: ${zoom}%`
            : mode === "fit-width"
              ? "Ajuste: ancho"
              : "Ajuste: página"}
        </span>
      </div>

      <ReportPreviewShell label="Vista previa del padrón de personal">
        {showVisualizationError ? (
          <div className="flex min-h-full items-center justify-center p-6">
            <section
              role="alert"
              className="max-w-xl rounded-xl border border-borde-input bg-superficie p-4 text-center"
            >
              <h2 className="text-lg font-bold text-texto-principal">
                No se pudo mostrar la vista previa
              </h2>
              <p className="mt-2 text-base text-texto-principal">
                {effectiveVisualizationMessage}
              </p>
              <p className="mt-2 text-sm text-texto-principal">
                Podés descargar el archivo para revisarlo.
              </p>
            </section>
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-full items-center justify-center p-6">
            <section
              role="status"
              aria-live="polite"
              className="max-w-xl rounded-xl border border-borde-input bg-superficie p-4 text-center"
            >
              <h2 className="text-lg font-bold text-texto-principal">
                Padrón de personal
              </h2>
              <p className="mt-2 text-base text-texto-principal">
                {NO_RECORDS_MESSAGE}
              </p>
            </section>
          </div>
        ) : (
          <div className="h-full min-h-[20rem] w-full">
            <object
              data={dataUrl}
              type={artifact.contentType || "application/pdf"}
              aria-label="Documento PDF del padrón de personal"
              className="block"
              style={objectStyle}
              onError={handleObjectError}
            >
              <div className="p-6 text-center text-base text-texto-principal">
                <p>{REPORT_VISUALIZATION_ERROR_MESSAGE}</p>
                <p className="mt-2">Podés descargar el archivo para revisarlo.</p>
              </div>
            </object>
          </div>
        )}
      </ReportPreviewShell>
    </div>
  );
}
