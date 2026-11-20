import {
  ALL_FILTER_VALUE,
  INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS,
  NO_SPECIFIC_OPTIONS_MESSAGE,
} from "./constants.ts";
import type {
  AllFilterValue,
  EnrolledStudentsAppliedFilters,
  EnrolledStudentsFilterErrors,
  EnrolledStudentsFilterInputs,
  EnrolledStudentsFilterKey,
  EnrolledStudentsFiltersState,
  EnrolledStudentsShiftApiValue,
  EnrolledStudentsSpecialityApiValue,
  FilterCriterionState,
  StudyYearInputValue,
  StudyYearValue,
} from "./types.ts";

const VALID_STUDY_YEARS = new Set<StudyYearInputValue>([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
]);

const VALID_SHIFTS = new Set<EnrolledStudentsShiftApiValue>([
  "morning",
  "afternoon",
  "night",
]);

const VALID_SPECIALITIES = new Set<EnrolledStudentsSpecialityApiValue>([
  "basic",
  "informatics",
  "electronics",
]);

const INVALID_CRITERION_MESSAGE =
  "El criterio seleccionado no es válido.";

const INDETERMINATE_CRITERION_MESSAGE =
  "No se pudo determinar el estado del criterio.";

const INVALID_FILTERS_MESSAGE =
  "Revisá los filtros antes de generar la vista previa.";

/**
 * Disponibilidad de opciones específicas del año lectivo.
 * - `number[]`: años específicos disponibles (puede ser vacío).
 * - `null`: no determinable.
 */
export type YearAvailability = readonly number[] | null;

export interface FiltersAvailability {
  readonly year: YearAvailability;
}

export type BuildAppliedFiltersResult =
  | {
      readonly ok: true;
      readonly applied: EnrolledStudentsAppliedFilters;
      readonly state: EnrolledStudentsFiltersState;
      readonly errors: EnrolledStudentsFilterErrors;
    }
  | {
      readonly ok: false;
      readonly state: EnrolledStudentsFiltersState;
      readonly errors: EnrolledStudentsFilterErrors;
    };

function isAll(value: unknown): value is AllFilterValue {
  return value === ALL_FILTER_VALUE;
}

function isValidStudyYearInput(
  value: unknown,
): value is StudyYearInputValue {
  return typeof value === "string" && VALID_STUDY_YEARS.has(value as StudyYearInputValue);
}

function isValidShiftInput(
  value: unknown,
): value is EnrolledStudentsShiftApiValue {
  return typeof value === "string" && VALID_SHIFTS.has(value as EnrolledStudentsShiftApiValue);
}

function isValidSpecialityInput(
  value: unknown,
): value is EnrolledStudentsSpecialityApiValue {
  return (
    typeof value === "string" &&
    VALID_SPECIALITIES.has(value as EnrolledStudentsSpecialityApiValue)
  );
}

function toStudyYearValue(value: StudyYearInputValue): StudyYearValue {
  return Number(value) as StudyYearValue;
}

function parseYearInput(value: string): number | null {
  if (!/^\d{4}$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

/** Estado inicial de entradas: todos los criterios en «Todos/Todas». */
export function getInitialEnrolledStudentsFilterInputs(): EnrolledStudentsFilterInputs {
  return INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS;
}

/** Restablece entradas a «Todos/Todas» sin disparar generación. */
export function clearEnrolledStudentsFilterInputs(): EnrolledStudentsFilterInputs {
  return INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS;
}

export function getYearCriterionState(
  value: EnrolledStudentsFilterInputs["year"],
  availability: YearAvailability,
): FilterCriterionState {
  if (availability === null) {
    return { status: "indeterminate", message: INDETERMINATE_CRITERION_MESSAGE };
  }

  if (isAll(value)) {
    if (availability.length === 0) {
      return {
        status: "informative-no-options",
        message: NO_SPECIFIC_OPTIONS_MESSAGE,
      };
    }
    return { status: "valid" };
  }

  if (typeof value !== "string") {
    return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
  }

  const parsed = parseYearInput(value);
  if (parsed === null) {
    return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
  }

  if (availability.length === 0) {
    return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
  }

  if (!availability.includes(parsed)) {
    return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
  }

  return { status: "valid" };
}

export function getStudyYearCriterionState(
  value: EnrolledStudentsFilterInputs["studyYear"],
): FilterCriterionState {
  if (isAll(value)) {
    return { status: "valid" };
  }

  if (isValidStudyYearInput(value)) {
    return { status: "valid" };
  }

  return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
}

export function getShiftCriterionState(
  value: EnrolledStudentsFilterInputs["shift"],
): FilterCriterionState {
  if (isAll(value)) {
    return { status: "valid" };
  }

  if (isValidShiftInput(value)) {
    return { status: "valid" };
  }

  return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
}

export function getSpecialityCriterionState(
  value: EnrolledStudentsFilterInputs["speciality"],
): FilterCriterionState {
  if (isAll(value)) {
    return { status: "valid" };
  }

  if (isValidSpecialityInput(value)) {
    return { status: "valid" };
  }

  return { status: "invalid", message: INVALID_CRITERION_MESSAGE };
}

export function getEnrolledStudentsFiltersState(
  inputs: EnrolledStudentsFilterInputs,
  availability: FiltersAvailability,
): EnrolledStudentsFiltersState {
  return {
    year: getYearCriterionState(inputs.year, availability.year),
    studyYear: getStudyYearCriterionState(inputs.studyYear),
    shift: getShiftCriterionState(inputs.shift),
    speciality: getSpecialityCriterionState(inputs.speciality),
  };
}

export function isBlockingCriterionState(
  state: FilterCriterionState,
): state is Extract<
  FilterCriterionState,
  { status: "invalid" | "indeterminate" }
> {
  return state.status === "invalid" || state.status === "indeterminate";
}

/** Habilita aplicar/generar solo con criterios válidos o informativos y sin generación en curso. */
export function canApplyEnrolledStudentsFilters(
  state: EnrolledStudentsFiltersState,
  isGenerating = false,
): boolean {
  if (isGenerating) {
    return false;
  }

  return !(
    isBlockingCriterionState(state.year) ||
    isBlockingCriterionState(state.studyYear) ||
    isBlockingCriterionState(state.shift) ||
    isBlockingCriterionState(state.speciality)
  );
}

function collectErrors(
  state: EnrolledStudentsFiltersState,
): EnrolledStudentsFilterErrors {
  const fieldErrors: Partial<Record<EnrolledStudentsFilterKey, string>> = {};
  const keys: readonly EnrolledStudentsFilterKey[] = [
    "year",
    "studyYear",
    "shift",
    "speciality",
  ];

  for (const key of keys) {
    const criterion = state[key];
    if (isBlockingCriterionState(criterion)) {
      fieldErrors[key] = criterion.message;
    }
  }

  const hasBlocking = Object.keys(fieldErrors).length > 0;
  return {
    fieldErrors,
    generalMessage: hasBlocking ? INVALID_FILTERS_MESSAGE : null,
  };
}

export function buildEnrolledStudentsAppliedFilters(
  inputs: EnrolledStudentsFilterInputs,
  availability: FiltersAvailability,
): BuildAppliedFiltersResult {
  const state = getEnrolledStudentsFiltersState(inputs, availability);
  const errors = collectErrors(state);

  if (!canApplyEnrolledStudentsFilters(state, false)) {
    return { ok: false, state, errors };
  }

  const yearValue = isAll(inputs.year)
    ? null
    : parseYearInput(inputs.year);
  const studyYearValue = isAll(inputs.studyYear)
    ? null
    : toStudyYearValue(inputs.studyYear);
  const shiftValue = isAll(inputs.shift) ? null : inputs.shift;
  const specialityValue = isAll(inputs.speciality) ? null : inputs.speciality;

  const applied: EnrolledStudentsAppliedFilters = {
    year: yearValue,
    studyYear: studyYearValue,
    shift: shiftValue,
    speciality: specialityValue,
  };

  return { ok: true, applied, state, errors };
}

/** Serializa filtros aplicados omitiendo criterios no restrictivos («Todos/Todas»). */
export function serializeEnrolledStudentsAppliedFilters(
  applied: EnrolledStudentsAppliedFilters,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (applied.year !== null) {
    params.year = String(applied.year);
  }
  if (applied.studyYear !== null) {
    params.studyYear = String(applied.studyYear);
  }
  if (applied.shift !== null) {
    params.shift = applied.shift;
  }
  if (applied.speciality !== null) {
    params.speciality = applied.speciality;
  }

  return params;
}
