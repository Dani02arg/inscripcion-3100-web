"use client";

import { useState } from "react";

import { REPORT_TYPE_LABELS } from "../../lib/reports/constants.ts";
import type { FiltersAvailability } from "../../lib/reports/filters.ts";
import type { ReportType, ReportsAccessRole } from "../../lib/reports/types.ts";
import EnrolledStudentsReport from "./enrolled-students-report.tsx";
import StaffReport from "./staff-report.tsx";

interface ReportsViewProps {
  readonly role: ReportsAccessRole;
  readonly enrolledStudentsAvailability: FiltersAvailability;
}

const SEGMENT_BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app sm:text-base";

export default function ReportsView({
  role,
  enrolledStudentsAvailability,
}: ReportsViewProps) {
  const [selectedReport, setSelectedReport] =
    useState<ReportType>("enrolled-students");

  const isAdmin = role === "ADMINISTRADOR";
  const activeReport: ReportType = isAdmin
    ? selectedReport
    : "enrolled-students";

  return (
    <section className="space-y-4" aria-label="Reportes">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-texto-principal">Reportes</h1>
        <p className="text-base text-texto-principal">
          Generá y descargá los reportes disponibles para tu rol.
        </p>
      </header>

      {isAdmin ? (
        <div
          role="group"
          aria-label="Selección de reporte"
          className="inline-flex flex-wrap gap-2 rounded-2xl border border-borde-input bg-superficie p-2 shadow-sm"
        >
          <button
            type="button"
            onClick={() => setSelectedReport("enrolled-students")}
            aria-pressed={activeReport === "enrolled-students"}
            className={`${SEGMENT_BASE_CLASSES} ${
              activeReport === "enrolled-students"
                ? "bg-azul-institucional text-superficie"
                : "bg-fondo-app text-texto-principal hover:bg-borde-input/30"
            }`}
          >
            {REPORT_TYPE_LABELS["enrolled-students"]}
          </button>
          <button
            type="button"
            onClick={() => setSelectedReport("staff")}
            aria-pressed={activeReport === "staff"}
            className={`${SEGMENT_BASE_CLASSES} ${
              activeReport === "staff"
                ? "bg-azul-institucional text-superficie"
                : "bg-fondo-app text-texto-principal hover:bg-borde-input/30"
            }`}
          >
            {REPORT_TYPE_LABELS.staff}
          </button>
        </div>
      ) : null}

      {activeReport === "enrolled-students" ? (
        <EnrolledStudentsReport availability={enrolledStudentsAvailability} />
      ) : (
        <StaffReport />
      )}
    </section>
  );
}
