import {
  isCourseCycle,
  isCourseShift,
  isCourseSpeciality,
} from "../courses/labels.ts";
import { COURSE_EDIT_PAST_YEAR_REASON } from "../courses/types.ts";
import type {
  CourseField,
  CourseFieldErrors,
  CourseFormInput,
  CoursePayload,
  CourseValidationOptions,
  CourseValidationResult,
} from "../courses/types.ts";

export const COURSE_FORM_FIELDS = [
  "year",
  "studyYear",
  "division",
  "cycle",
  "speciality",
  "shift",
  "maxCapacity",
] as const;

export const COURSE_VALIDATION_MESSAGES = {
  year: "Ingresá un año académico de cuatro dígitos.",
  yearPast: "El año académico debe ser el actual o uno futuro.",
  studyYear: "Ingresá un año de cursada entre 1 y 6.",
  division: "Ingresá una división de 1 a 10 caracteres.",
  cycle: "Seleccioná un ciclo válido.",
  speciality: "Seleccioná una especialidad válida.",
  shift: "Seleccioná un turno válido.",
  maxCapacity: "Ingresá una capacidad máxima mayor que cero.",
  maxCapacityBelowCurrent:
    "La capacidad máxima no puede ser menor que la capacidad actual.",
} as const;

export const COURSE_GENERAL_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";

/** Valores iniciales del formulario de creación. */
export function getCreateCourseDefaults(
  currentYear: number,
): CourseFormInput {
  return {
    year: String(currentYear),
    studyYear: "1",
    division: "",
    cycle: "basic",
    speciality: "basic",
    shift: "morning",
    maxCapacity: "",
  };
}

export interface CourseErrorTranslation {
  readonly errors: CourseFieldErrors;
  readonly generalMessage: string | null;
}

const ENGLISH_ERROR_PATTERNS: Record<
  CourseField,
  readonly { readonly pattern: RegExp; readonly message: string }[]
> = {
  year: [
    {
      pattern: /required|empty/i,
      message: COURSE_VALIDATION_MESSAGES.year,
    },
    {
      pattern: /integer|numeric|number|four|digit/i,
      message: COURSE_VALIDATION_MESSAGES.year,
    },
    {
      pattern: /current|future|past|after|before|greater|less|least|year/i,
      message: COURSE_VALIDATION_MESSAGES.yearPast,
    },
  ],
  studyYear: [
    {
      pattern: /required|empty|integer|numeric|number|between|1.*6/i,
      message: COURSE_VALIDATION_MESSAGES.studyYear,
    },
  ],
  division: [
    {
      pattern: /required|empty|string|character|1.*10|max/i,
      message: COURSE_VALIDATION_MESSAGES.division,
    },
  ],
  cycle: [
    {
      pattern: /required|empty|selected|invalid|valid/i,
      message: COURSE_VALIDATION_MESSAGES.cycle,
    },
  ],
  speciality: [
    {
      pattern: /required|empty|selected|invalid|valid/i,
      message: COURSE_VALIDATION_MESSAGES.speciality,
    },
  ],
  shift: [
    {
      pattern: /required|empty|selected|invalid|valid/i,
      message: COURSE_VALIDATION_MESSAGES.shift,
    },
  ],
  maxCapacity: [
    {
      pattern: /current|enrolled|inscriptions|occupied|equal|greater.*equal/i,
      message: COURSE_VALIDATION_MESSAGES.maxCapacityBelowCurrent,
    },
    {
      pattern: /required|empty|integer|numeric|number|greater|positive|min|1/i,
      message: COURSE_VALIDATION_MESSAGES.maxCapacity,
    },
  ],
};

function parseFourDigitYear(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d{4}$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseStudyYear(value: string): number | null {
  const trimmed = value.trim();

  if (!/^[1-6]$/.test(trimmed)) {
    return null;
  }

  return Number(trimmed);
}

/** Arma el payload exacto de siete campos a partir del formulario. */
export function buildCoursePayload(
  input: CourseFormInput,
): CoursePayload | null {
  const year = parseFourDigitYear(input.year);
  const studyYear = parseStudyYear(input.studyYear);
  const maxCapacity = parsePositiveInteger(input.maxCapacity);
  const division = input.division.trim();
  const cycle = input.cycle.trim();
  const speciality = input.speciality.trim();
  const shift = input.shift.trim();

  if (
    year === null ||
    studyYear === null ||
    maxCapacity === null ||
    division.length < 1 ||
    division.length > 10 ||
    !isCourseCycle(cycle) ||
    !isCourseSpeciality(speciality) ||
    !isCourseShift(shift)
  ) {
    return null;
  }

  return {
    year,
    studyYear,
    division,
    cycle,
    speciality,
    shift,
    maxCapacity,
  };
}

/** Valida los siete campos configurables de un curso. */
export function validateCourseInput(
  input: CourseFormInput,
  currentCapacity: number,
  currentYear: number,
  options: CourseValidationOptions = {},
): CourseValidationResult {
  const errors: CourseFieldErrors = {};
  const year = parseFourDigitYear(input.year);
  const studyYear = parseStudyYear(input.studyYear);
  const division = input.division.trim();
  const cycle = input.cycle.trim();
  const speciality = input.speciality.trim();
  const shift = input.shift.trim();
  const maxCapacity = parsePositiveInteger(input.maxCapacity);

  if (year === null) {
    errors.year = COURSE_VALIDATION_MESSAGES.year;
  } else if (
    options.originalYear !== undefined &&
    options.originalYear < currentYear
  ) {
    errors.year = COURSE_EDIT_PAST_YEAR_REASON;
  } else if (year < currentYear) {
    errors.year = COURSE_VALIDATION_MESSAGES.yearPast;
  }

  if (studyYear === null) {
    errors.studyYear = COURSE_VALIDATION_MESSAGES.studyYear;
  }

  if (division.length < 1 || division.length > 10) {
    errors.division = COURSE_VALIDATION_MESSAGES.division;
  }

  if (!isCourseCycle(cycle)) {
    errors.cycle = COURSE_VALIDATION_MESSAGES.cycle;
  }

  if (!isCourseSpeciality(speciality)) {
    errors.speciality = COURSE_VALIDATION_MESSAGES.speciality;
  }

  if (!isCourseShift(shift)) {
    errors.shift = COURSE_VALIDATION_MESSAGES.shift;
  }

  if (maxCapacity === null) {
    errors.maxCapacity = COURSE_VALIDATION_MESSAGES.maxCapacity;
  } else if (maxCapacity < currentCapacity) {
    errors.maxCapacity = COURSE_VALIDATION_MESSAGES.maxCapacityBelowCurrent;
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    payload: valid ? buildCoursePayload(input) : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() ? value : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const message = value.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );

  return message;
}

function isCourseField(value: string): value is CourseField {
  return COURSE_FORM_FIELDS.some((field) => field === value);
}

/** Lee los siete campos del formulario y normaliza ausentes a cadena vacía. */
export function readCourseFormData(formData: FormData): CourseFormInput {
  const read = (field: CourseField): string => {
    const value = formData.get(field);
    return typeof value === "string" ? value : "";
  };

  return {
    year: read("year"),
    studyYear: read("studyYear"),
    division: read("division"),
    cycle: read("cycle"),
    speciality: read("speciality"),
    shift: read("shift"),
    maxCapacity: read("maxCapacity"),
  };
}

/** Mapea solo los siete campos conocidos y descarta claves ajenas. */
export function mapCourseFieldErrors(value: unknown): CourseFieldErrors {
  const source =
    isRecord(value) && isRecord(value.errors) ? value.errors : value;

  if (!isRecord(source)) {
    return {};
  }

  const errors: CourseFieldErrors = {};

  for (const [key, rawMessages] of Object.entries(source)) {
    if (!isCourseField(key)) {
      continue;
    }

    const message = firstMessage(rawMessages);

    if (message) {
      errors[key] = message;
    }
  }

  return errors;
}

/** Traduce mensajes conocidos de Laravel y deriva los desconocidos a un aviso general. */
export function translateCourseFieldErrors(
  fieldErrors: CourseFieldErrors,
): CourseErrorTranslation {
  const errors: CourseFieldErrors = {};
  let hasUnknownMessage = false;

  for (const field of COURSE_FORM_FIELDS) {
    const message = fieldErrors[field];

    if (!message) {
      continue;
    }

    const translation = ENGLISH_ERROR_PATTERNS[field].find(({ pattern }) =>
      pattern.test(message),
    );

    if (translation) {
      errors[field] = translation.message;
    } else {
      hasUnknownMessage = true;
    }
  }

  return {
    errors,
    generalMessage: hasUnknownMessage ? COURSE_GENERAL_ERROR_MESSAGE : null,
  };
}
