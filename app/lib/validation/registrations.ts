import type {
  ApproveForm,
  DictamenOptionalFields,
  ObserveForm,
  ReassignForm,
} from "../registrations/types.ts";

/** Campos reconocidos de un dictamen para el mapeo de errores. */
export const REGISTRATION_DICTAMEN_FIELDS = [
  "observations",
  "pendingSubjects",
  "missingDocumentation",
  "newCourseId",
  "reassignmentReason",
  "course",
] as const;

export type DictamenField = (typeof REGISTRATION_DICTAMEN_FIELDS)[number];
export type DictamenFieldErrors = Partial<Record<DictamenField, string>>;

export const REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE =
  "Debe detallar qué falta o está mal en la solicitud.";
export const REGISTRATION_COURSE_REQUIRED_MESSAGE =
  "Seleccioná un curso de destino.";
export const REGISTRATION_REASON_REQUIRED_MESSAGE =
  "Ingresá el motivo de la reasignación.";
export const REGISTRATION_GENERAL_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";

/** Payload opcional compartido (observaciones, materias y documentación). */
export interface DictamenOptionalPayload {
  readonly observations?: string;
  readonly pendingSubjects?: readonly string[];
  readonly missingDocumentation?: string;
}

export type ApprovePayload = DictamenOptionalPayload;
export type RejectPayload = DictamenOptionalPayload;

export interface ObservePayload {
  readonly observations: string;
}

export interface ReassignPayload extends DictamenOptionalPayload {
  readonly newCourseId: string;
  readonly reassignmentReason: string;
}

/** Valida las observaciones obligatorias de «Devolver con observaciones». */
export function validateObservations(value: string): string | null {
  return value.trim().length > 0
    ? null
    : REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE;
}

/** Valida el curso de destino y el motivo obligatorios de la reasignación. */
export function validateReassignment(
  input: Pick<ReassignForm, "newCourseId" | "reassignmentReason">,
): DictamenFieldErrors {
  const errors: DictamenFieldErrors = {};

  if (input.newCourseId.trim().length === 0) {
    errors.newCourseId = REGISTRATION_COURSE_REQUIRED_MESSAGE;
  }

  if (input.reassignmentReason.trim().length === 0) {
    errors.reassignmentReason = REGISTRATION_REASON_REQUIRED_MESSAGE;
  }

  return errors;
}

function splitSubjects(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildOptionalPayload(
  form: DictamenOptionalFields,
): DictamenOptionalPayload {
  const observations = form.observations.trim();
  const missingDocumentation = form.missingDocumentation.trim();
  const pendingSubjects = splitSubjects(form.pendingSubjects);

  return {
    ...(observations.length > 0 ? { observations } : {}),
    ...(pendingSubjects.length > 0 ? { pendingSubjects } : {}),
    ...(missingDocumentation.length > 0 ? { missingDocumentation } : {}),
  };
}

/** Arma el payload de aprobar con solo los campos informados. */
export function buildApprovePayload(form: ApproveForm): ApprovePayload {
  return buildOptionalPayload(form);
}

/** Arma el payload de rechazar con solo los campos informados. */
export function buildRejectPayload(form: ApproveForm): RejectPayload {
  return buildOptionalPayload(form);
}

/** Arma el payload de devolver con observaciones. */
export function buildObservePayload(form: ObserveForm): ObservePayload {
  return { observations: form.observations.trim() };
}

/** Arma el payload de reasignar con curso, motivo y opcionales. */
export function buildReassignPayload(form: ReassignForm): ReassignPayload {
  return {
    newCourseId: form.newCourseId.trim(),
    reassignmentReason: form.reassignmentReason.trim(),
    ...buildOptionalPayload(form),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDictamenField(value: string): value is DictamenField {
  return REGISTRATION_DICTAMEN_FIELDS.some((field) => field === value);
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function unwrapErrors(value: unknown): Record<string, unknown> {
  if (isRecord(value) && isRecord(value.errors)) {
    return value.errors;
  }

  return isRecord(value) ? value : {};
}

/** Mapea solo los campos conocidos y conserva el mensaje crudo del servicio. */
export function mapDictamenFieldErrors(
  value: unknown,
): DictamenFieldErrors {
  const source = unwrapErrors(value);
  const errors: DictamenFieldErrors = {};

  for (const [key, raw] of Object.entries(source)) {
    if (!isDictamenField(key)) {
      continue;
    }

    const message = firstMessage(raw);

    if (message) {
      errors[key] = message;
    }
  }

  return errors;
}

export interface DictamenErrorTranslation {
  readonly errors: DictamenFieldErrors;
  readonly generalMessage: string | null;
}

const REQUIRED_PATTERN = /required|empty|min|obligat/i;
const COURSE_FULL_PATTERN = /lleno|cupo|capacidad|recibe más|capacity|full/i;

function translateDictamenMessage(
  field: DictamenField,
  message: string,
): string | null {
  if (field === "observations" && REQUIRED_PATTERN.test(message)) {
    return REGISTRATION_OBSERVATIONS_REQUIRED_MESSAGE;
  }

  if (field === "reassignmentReason" && REQUIRED_PATTERN.test(message)) {
    return REGISTRATION_REASON_REQUIRED_MESSAGE;
  }

  if (field === "newCourseId") {
    return COURSE_FULL_PATTERN.test(message)
      ? "El curso seleccionado no tiene cupo disponible."
      : REGISTRATION_COURSE_REQUIRED_MESSAGE;
  }

  if (field === "course" && COURSE_FULL_PATTERN.test(message)) {
    return "El cupo del curso solicitado está lleno. Debe proponer una reasignación a otro curso.";
  }

  return null;
}

/** Traduce los mensajes conocidos y deriva los desconocidos a un aviso general. */
export function translateDictamenFieldErrors(
  fieldErrors: DictamenFieldErrors,
): DictamenErrorTranslation {
  const errors: DictamenFieldErrors = {};
  let hasUnknownMessage = false;

  for (const field of REGISTRATION_DICTAMEN_FIELDS) {
    const message = fieldErrors[field];

    if (!message) {
      continue;
    }

    const translated = translateDictamenMessage(field, message);

    if (translated) {
      errors[field] = translated;
    } else {
      hasUnknownMessage = true;
    }
  }

  return {
    errors,
    generalMessage: hasUnknownMessage
      ? REGISTRATION_GENERAL_ERROR_MESSAGE
      : null,
  };
}

/** Mapea y traduce el sobre de errores del servicio. */
export function translateDictamenApiErrors(
  value: unknown,
): DictamenErrorTranslation {
  return translateDictamenFieldErrors(mapDictamenFieldErrors(value));
}
