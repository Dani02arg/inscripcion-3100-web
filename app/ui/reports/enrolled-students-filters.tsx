"use client";

import {
  ALL_FILTER_VALUE,
  ALL_OPTION_LABEL,
  CLEAR_FILTERS_LABEL,
  GENERATE_PREVIEW_LABEL,
  SHIFT_OPTIONS,
  SPECIALITY_OPTIONS,
  STUDY_YEAR_OPTIONS,
} from "../../lib/reports/constants.ts";
import {
  canApplyEnrolledStudentsFilters,
  getEnrolledStudentsFiltersState,
  isBlockingCriterionState,
  type FiltersAvailability,
} from "../../lib/reports/filters.ts";
import type {
  EnrolledStudentsFilterInputs,
  EnrolledStudentsFilterKey,
  FilterCriterionState,
} from "../../lib/reports/types.ts";

interface EnrolledStudentsFiltersProps {
  readonly inputs: EnrolledStudentsFilterInputs;
  readonly availability: FiltersAvailability;
  readonly isGenerating: boolean;
  readonly onChange: (inputs: EnrolledStudentsFilterInputs) => void;
  readonly onGenerate: () => void;
  readonly onClear: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const LABEL_CLASSES = "mb-1 block text-sm font-medium text-texto-principal";

const CONTROL_CLASSES =
  `min-h-11 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const PRIMARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const SECONDARY_ACTION_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

function getYearOptions(availability: FiltersAvailability) {
  const years = availability.year ?? [];
  return [
    { value: ALL_FILTER_VALUE, label: ALL_OPTION_LABEL },
    ...years.map((year) => ({
      value: String(year),
      label: String(year),
    })),
  ];
}

function FieldMessage({
  id,
  state,
}: {
  readonly id: string;
  readonly state: FilterCriterionState;
}) {
  if (state.status === "informative-no-options") {
    return (
      <p id={id} className="mt-1 text-sm text-texto-principal" role="status">
        {state.message}
      </p>
    );
  }

  if (isBlockingCriterionState(state)) {
    return (
      <p id={id} className="mt-1 text-sm text-estado-rechazado" role="alert">
        {state.message}
      </p>
    );
  }

  return null;
}

export default function EnrolledStudentsFilters({
  inputs,
  availability,
  isGenerating,
  onChange,
  onGenerate,
  onClear,
}: EnrolledStudentsFiltersProps) {
  const state = getEnrolledStudentsFiltersState(inputs, availability);
  const canApply = canApplyEnrolledStudentsFilters(state, isGenerating);

  const update = <K extends EnrolledStudentsFilterKey>(
    key: K,
    value: EnrolledStudentsFilterInputs[K],
  ) => {
    onChange({ ...inputs, [key]: value });
  };

  const yearOptions = getYearOptions(availability);

  const yearMessageId = "report-filter-year-message";
  const studyYearMessageId = "report-filter-study-year-message";
  const shiftMessageId = "report-filter-shift-message";
  const specialityMessageId = "report-filter-speciality-message";

  const yearDescribedBy =
    state.year.status === "valid" ? undefined : yearMessageId;
  const studyYearDescribedBy =
    state.studyYear.status === "valid" ? undefined : studyYearMessageId;
  const shiftDescribedBy =
    state.shift.status === "valid" ? undefined : shiftMessageId;
  const specialityDescribedBy =
    state.speciality.status === "valid" ? undefined : specialityMessageId;

  return (
    <section
      aria-label="Filtros del listado de alumnos inscriptos"
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="report-filter-year" className={LABEL_CLASSES}>
            Año lectivo
          </label>
          <select
            id="report-filter-year"
            value={inputs.year}
            onChange={(event) => update("year", event.target.value)}
            disabled={isGenerating}
            aria-invalid={isBlockingCriterionState(state.year)}
            aria-describedby={yearDescribedBy}
            className={CONTROL_CLASSES}
          >
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldMessage id={yearMessageId} state={state.year} />
        </div>

        <div>
          <label htmlFor="report-filter-study-year" className={LABEL_CLASSES}>
            Año de estudio
          </label>
          <select
            id="report-filter-study-year"
            value={inputs.studyYear}
            onChange={(event) =>
              update(
                "studyYear",
                event.target.value as EnrolledStudentsFilterInputs["studyYear"],
              )
            }
            disabled={isGenerating}
            aria-invalid={isBlockingCriterionState(state.studyYear)}
            aria-describedby={studyYearDescribedBy}
            className={CONTROL_CLASSES}
          >
            {STUDY_YEAR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldMessage id={studyYearMessageId} state={state.studyYear} />
        </div>

        <div>
          <label htmlFor="report-filter-shift" className={LABEL_CLASSES}>
            Turno
          </label>
          <select
            id="report-filter-shift"
            value={inputs.shift}
            onChange={(event) =>
              update(
                "shift",
                event.target.value as EnrolledStudentsFilterInputs["shift"],
              )
            }
            disabled={isGenerating}
            aria-invalid={isBlockingCriterionState(state.shift)}
            aria-describedby={shiftDescribedBy}
            className={CONTROL_CLASSES}
          >
            {SHIFT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldMessage id={shiftMessageId} state={state.shift} />
        </div>

        <div>
          <label htmlFor="report-filter-speciality" className={LABEL_CLASSES}>
            Especialidad
          </label>
          <select
            id="report-filter-speciality"
            value={inputs.speciality}
            onChange={(event) =>
              update(
                "speciality",
                event.target.value as EnrolledStudentsFilterInputs["speciality"],
              )
            }
            disabled={isGenerating}
            aria-invalid={isBlockingCriterionState(state.speciality)}
            aria-describedby={specialityDescribedBy}
            className={CONTROL_CLASSES}
          >
            {SPECIALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldMessage id={specialityMessageId} state={state.speciality} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClear}
          disabled={isGenerating}
          aria-label={CLEAR_FILTERS_LABEL}
          className={SECONDARY_ACTION_CLASSES}
        >
          {CLEAR_FILTERS_LABEL}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canApply}
          aria-label={GENERATE_PREVIEW_LABEL}
          className={PRIMARY_ACTION_CLASSES}
        >
          {isGenerating ? "Generando vista previa…" : GENERATE_PREVIEW_LABEL}
        </button>
      </div>
    </section>
  );
}
