"use client";

import { useEffect, useRef, useState } from "react";

import { generateStaffReportAction } from "../../lib/actions/reports.ts";
import { isValidReportArtifact } from "../../lib/reports/artifact.ts";
import {
  REPORT_INVALID_ARTIFACT_MESSAGE,
  REPORT_VISUALIZATION_ERROR_MESSAGE,
} from "../../lib/reports/constants.ts";
import {
  failStaffAutoGeneration,
  failStaffGeneration,
  failStaffVisualization,
  getInitialStaffPreviewStatus,
  hasStaffCurrentArtifact,
  startStaffGeneration,
  succeedStaffGeneration,
} from "../../lib/reports/preview-state.ts";
import type { StaffPreviewStatus } from "../../lib/reports/types.ts";
import ReportDownloadButton from "./download-button.tsx";
import {
  ReportErrorState,
  ReportLoadingState,
  ReportResultState,
} from "./report-states.tsx";
import StaffPdfPreview from "./staff-pdf-preview.tsx";

export default function StaffReport() {
  const [status, setStatus] = useState<StaffPreviewStatus>(
    getInitialStaffPreviewStatus(),
  );
  const hasStartedRef = useRef(false);

  const isGenerating = status.status === "loading";

  const runGeneration = async (mode: "auto" | "manual") => {
    setStatus((current) => startStaffGeneration(current));

    const result = await generateStaffReportAction();

    if (result.ok) {
      if (!isValidReportArtifact(result.artifact)) {
        setStatus(
          failStaffGeneration({
            message: REPORT_INVALID_ARTIFACT_MESSAGE,
            kind: "invalid-artifact",
          }),
        );
        return;
      }

      setStatus(succeedStaffGeneration(result));
      return;
    }

    if (mode === "auto") {
      setStatus(
        failStaffAutoGeneration({
          message: result.message,
          kind: result.kind,
        }),
      );
      return;
    }

    setStatus(
      failStaffGeneration({
        message: result.message,
        kind: result.kind,
      }),
    );
  };

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    void runGeneration("auto");
  }, []);

  const handleRetry = () => {
    if (isGenerating) {
      return;
    }

    void runGeneration("manual");
  };

  const handleVisualizationError = () => {
    setStatus((current) => {
      if (!hasStaffCurrentArtifact(current)) {
        return current;
      }

      if (current.status === "visualization-error") {
        return current;
      }

      return failStaffVisualization({
        artifact: current.artifact,
        message: REPORT_VISUALIZATION_ERROR_MESSAGE,
      });
    });
  };

  const currentArtifact = hasStaffCurrentArtifact(status)
    ? status.artifact
    : null;

  return (
    <div className="space-y-4">
      {status.status === "initial" || status.status === "loading" ? (
        <ReportLoadingState message="Generando vista previa del padrón de personal…" />
      ) : null}

      {status.status === "error" ? (
        <ReportErrorState
          message={status.message}
          onRetry={handleRetry}
          title="No pudimos generar el padrón de personal"
        />
      ) : null}

      {status.status === "ready" ? (
        <ReportResultState label="Vista previa del padrón de personal">
          <div className="space-y-3">
            <StaffPdfPreview
              artifact={status.artifact}
              onVisualizationError={handleVisualizationError}
            />
            <ReportDownloadButton artifact={status.artifact} />
          </div>
        </ReportResultState>
      ) : null}

      {status.status === "visualization-error" ? (
        <ReportResultState label="Vista previa del padrón de personal">
          <div className="space-y-3">
            <StaffPdfPreview
              artifact={status.artifact}
              visualizationErrorMessage={status.message}
              onVisualizationError={handleVisualizationError}
            />
            {currentArtifact ? (
              <ReportDownloadButton artifact={currentArtifact} />
            ) : null}
          </div>
        </ReportResultState>
      ) : null}
    </div>
  );
}
