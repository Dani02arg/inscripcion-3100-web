"use client";

import { useState } from "react";

import { generateEnrolledStudentsReportAction } from "../../lib/actions/reports.ts";
import {
  canApplyEnrolledStudentsFilters,
  clearEnrolledStudentsFilterInputs,
  getEnrolledStudentsFiltersState,
  getInitialEnrolledStudentsFilterInputs,
  type FiltersAvailability,
} from "../../lib/reports/filters.ts";
import {
  failEnrolledStudentsGeneration,
  getInitialEnrolledStudentsPreviewStatus,
  hasEnrolledStudentsCurrentArtifact,
  keepEnrolledStudentsPreviewOnClearFilters,
  startEnrolledStudentsGeneration,
  succeedEnrolledStudentsGeneration,
} from "../../lib/reports/preview-state.ts";
import type {
  EnrolledStudentsFilterInputs,
  EnrolledStudentsPreviewStatus,
} from "../../lib/reports/types.ts";
import ReportDownloadButton from "./download-button.tsx";
import EnrolledStudentsFilters from "./enrolled-students-filters.tsx";
import EnrolledStudentsPreview from "./enrolled-students-preview.tsx";
import {
  ReportErrorState,
  ReportLoadingState,
  ReportResultState,
} from "./report-states.tsx";

interface EnrolledStudentsReportProps {
  readonly availability: FiltersAvailability;
}

export default function EnrolledStudentsReport({
  availability,
}: EnrolledStudentsReportProps) {
  const [inputs, setInputs] = useState<EnrolledStudentsFilterInputs>(
    getInitialEnrolledStudentsFilterInputs(),
  );
  const [status, setStatus] = useState<EnrolledStudentsPreviewStatus>(
    getInitialEnrolledStudentsPreviewStatus(),
  );
  const [lastGenerateInputs, setLastGenerateInputs] = useState<
    EnrolledStudentsFilterInputs | null
  >(null);

  const isGenerating = status.status === "loading";

  const runGeneration = async (requestInputs: EnrolledStudentsFilterInputs) => {
    setLastGenerateInputs(requestInputs);
    setStatus((current) => startEnrolledStudentsGeneration(current));

    const result = await generateEnrolledStudentsReportAction(
      requestInputs,
      availability,
    );

    if (result.ok) {
      setStatus(succeedEnrolledStudentsGeneration(result));
      return;
    }

    setStatus(
      failEnrolledStudentsGeneration({
        message: result.message,
        kind: result.kind,
        ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}),
      }),
    );
  };

  const handleGenerate = () => {
    const filterState = getEnrolledStudentsFiltersState(inputs, availability);
    if (!canApplyEnrolledStudentsFilters(filterState, isGenerating)) {
      return;
    }

    void runGeneration(inputs);
  };

  const handleRetry = () => {
    if (!lastGenerateInputs || isGenerating) {
      return;
    }

    void runGeneration(lastGenerateInputs);
  };

  const handleClear = () => {
    setInputs(clearEnrolledStudentsFilterInputs());
    setStatus((current) => keepEnrolledStudentsPreviewOnClearFilters(current));
  };

  const handleChange = (nextInputs: EnrolledStudentsFilterInputs) => {
    setInputs(nextInputs);
  };

  return (
    <div className="space-y-4">
      <EnrolledStudentsFilters
        inputs={inputs}
        availability={availability}
        isGenerating={isGenerating}
        onChange={handleChange}
        onGenerate={handleGenerate}
        onClear={handleClear}
      />

      {status.status === "initial" ? (
        <section
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
        >
          <h2 className="text-xl font-bold text-texto-principal">
            Vista previa del reporte
          </h2>
          <p className="mt-2 text-base text-texto-principal">
            Seleccioná los filtros y generá la vista previa para ver el listado
            de alumnos inscriptos.
          </p>
        </section>
      ) : null}

      {status.status === "loading" ? (
        <ReportLoadingState message="Generando vista previa del reporte…" />
      ) : null}

      {status.status === "error" ? (
        <ReportErrorState
          message={status.message}
          onRetry={lastGenerateInputs ? handleRetry : undefined}
        />
      ) : null}

      {hasEnrolledStudentsCurrentArtifact(status) ? (
        <ReportResultState label="Vista previa del listado de alumnos inscriptos">
          <div className="space-y-3">
            <EnrolledStudentsPreview preview={status.preview} />
            <ReportDownloadButton artifact={status.artifact} />
          </div>
        </ReportResultState>
      ) : null}
    </div>
  );
}
