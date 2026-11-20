import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/types.ts";
import { getApiMessage, isRecord } from "./auth.ts";
import { getApiBaseUrl } from "./config.ts";
import { isRegistrationStatus } from "../registrations/labels.ts";
import { translateDictamenApiErrors } from "../validation/registrations.ts";
import type {
  AvailableCourse,
  DictamenActionFailureKind,
  DictamenActionResult,
  Registration,
  RegistrationCourse,
  RegistrationDetailResult,
  RegistrationFailureKind,
  RegistrationListMeta,
  RegistrationListResult,
  RegistrationStatus,
  RegistrationStudent,
} from "../registrations/types.ts";

export const REGISTRATIONS_ENDPOINT_PATH = "/api/registrations";
export const COURSES_AVAILABLE_ENDPOINT_PATH = "/api/courses/available";
export const REGISTRATION_REQUEST_TIMEOUT_MS = 10_000;
export const REGISTRATIONS_PAGE_SIZE = 100;
export const REGISTRATIONS_MAX_PAGES = 100;

export interface RegistrationRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export const REGISTRATIONS_LOAD_ERROR_MESSAGE =
  "No pudimos cargar las inscripciones. Intentá nuevamente.";
export const REGISTRATION_NOT_FOUND_MESSAGE = "La inscripción no existe.";
export const REGISTRATION_OPERATION_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";
export const REGISTRATION_VALIDATION_MESSAGE =
  "Revisá los datos del formulario e intentá nuevamente.";
export const REGISTRATION_CONFLICT_MESSAGE =
  "La inscripción cambió de estado. Recargá e intentá nuevamente.";
export const REGISTRATION_CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";
export const REGISTRATION_TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";
export const REGISTRATION_API_NOT_CONFIGURED_MESSAGE =
  "El servicio de inscripciones no está disponible en este momento. Intentá nuevamente.";

function parseInteger(value: unknown, min?: number): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return null;
  }

  if (min !== undefined && value < min) {
    return null;
  }

  return value;
}

function parseText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseRegistrationStudent(value: unknown): RegistrationStudent | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseText(value.id);
  const studentCuil = parseText(value.studentCuil);
  const firstName = parseText(value.firstName);
  const lastName = parseText(value.lastName);

  if (!id || !studentCuil || !firstName || !lastName) {
    return null;
  }

  return { id, studentCuil, firstName, lastName };
}

function parseRegistrationCourse(value: unknown): RegistrationCourse | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseText(value.id);
  const code = parseText(value.code);
  const year = parseInteger(value.year);
  const studyYear = parseInteger(value.studyYear, 1);
  const division = parseText(value.division);
  const cycle = parseText(value.cycle);
  const shift = parseText(value.shift);
  const speciality = parseText(value.speciality);

  if (
    !id ||
    !code ||
    year === null ||
    studyYear === null ||
    !division ||
    !cycle ||
    !shift ||
    !speciality
  ) {
    return null;
  }

  const currentCapacity = parseInteger(value.currentCapacity, 0);
  const maxCapacity = parseInteger(value.maxCapacity, 0);

  return {
    id,
    code,
    year,
    studyYear,
    division,
    cycle,
    shift,
    speciality,
    ...(currentCapacity !== null ? { currentCapacity } : {}),
    ...(maxCapacity !== null ? { maxCapacity } : {}),
  };
}

function parseStringArrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items: string[] = [];

  for (const item of value) {
    if (typeof item === "string" && item.trim().length > 0) {
      items.push(item.trim());
    }
  }

  return items;
}

/** Valida y normaliza una inscripción; `null` si falta un campo obligatorio. */
export function parseRegistration(value: unknown): Registration | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseText(value.id);
  const status: RegistrationStatus | null = isRegistrationStatus(value.status)
    ? value.status
    : null;
  const studentId = parseText(value.studentId);
  const idCourse = parseText(value.idCourse);
  const relationship = parseText(value.relationship);
  const student = parseRegistrationStudent(value.student);
  const course = parseRegistrationCourse(value.course);
  const proposedCourse =
    value.proposedCourse == null
      ? null
      : parseRegistrationCourse(value.proposedCourse);
  const created_at = parseText(value.created_at);
  const updated_at = parseText(value.updated_at);

  const photoAuthorization = parseBoolean(value.photoAuthorization);
  const healthProblem = parseBoolean(value.healthProblem);
  const inclusionStudent = parseBoolean(value.inclusionStudent);
  const contactImpediment = parseBoolean(value.contactImpediment);
  const legalProceedings = parseBoolean(value.legalProceedings);
  const hasHealthProblemCertificate = parseBoolean(
    value.hasHealthProblemCertificate,
  );
  const hasInclusionStudentCertificate = parseBoolean(
    value.hasInclusionStudentCertificate,
  );
  const hasContactImpedimentCertificate = parseBoolean(
    value.hasContactImpedimentCertificate,
  );
  const hasLegalProceedingsCertificate = parseBoolean(
    value.hasLegalProceedingsCertificate,
  );

  if (
    !id ||
    !status ||
    !studentId ||
    !idCourse ||
    !relationship ||
    !student ||
    !course ||
    !created_at ||
    !updated_at ||
    photoAuthorization === null ||
    healthProblem === null ||
    inclusionStudent === null ||
    contactImpediment === null ||
    legalProceedings === null ||
    hasHealthProblemCertificate === null ||
    hasInclusionStudentCertificate === null ||
    hasContactImpedimentCertificate === null ||
    hasLegalProceedingsCertificate === null
  ) {
    return null;
  }

  return {
    id,
    status,
    studentId,
    idCourse,
    proposedCourseId: parseText(value.proposedCourseId),
    institutionOfOrigin: parseText(value.institutionOfOrigin),
    relationship,
    photoAuthorization,
    healthProblem,
    inclusionStudent,
    contactImpediment,
    legalProceedings,
    hasHealthProblemCertificate,
    hasInclusionStudentCertificate,
    hasContactImpedimentCertificate,
    hasLegalProceedingsCertificate,
    reassignmentReason: parseText(value.reassignmentReason),
    observations: parseText(value.observations),
    pendingSubjects: parseStringArrayOrNull(value.pendingSubjects),
    missingDocumentation: parseText(value.missingDocumentation),
    student,
    course,
    proposedCourse,
    created_at,
    updated_at,
  };
}

/** Valida los metadatos de paginación del padrón. */
export function parseRegistrationListMeta(
  value: unknown,
): RegistrationListMeta | null {
  if (!isRecord(value)) {
    return null;
  }

  const currentPage = parseInteger(value.current_page, 1);
  const lastPage = parseInteger(value.last_page, 1);
  const perPage = parseInteger(value.per_page, 1);
  const total = parseInteger(value.total, 0);

  if (
    currentPage === null ||
    lastPage === null ||
    perPage === null ||
    total === null ||
    currentPage > lastPage
  ) {
    return null;
  }

  return { currentPage, lastPage, perPage, total };
}

function listFailure(
  kind: RegistrationFailureKind,
  status: number | null,
  message: string,
): RegistrationListResult {
  return { ok: false, kind, status, message };
}

function detailFailure(
  kind: RegistrationFailureKind,
  status: number | null,
  message: string,
): RegistrationDetailResult {
  return { ok: false, kind, status, message };
}

function actionFailure(
  kind: DictamenActionFailureKind,
  status: number | null,
  message: string,
  fieldErrors?: Record<string, string>,
): DictamenActionResult {
  return {
    ok: false,
    kind,
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

function parseRegistrations(
  items: readonly unknown[],
): Registration[] | null {
  const registrations: Registration[] = [];

  for (const item of items) {
    const registration = parseRegistration(item);

    if (!registration) {
      return null;
    }

    registrations.push(registration);
  }

  return registrations;
}

/** Interpreta el padrón paginado. */
export function parseRegistrationListResponse(
  status: number,
  body: unknown,
): RegistrationListResult {
  if (status === 401) {
    return listFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return listFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status !== 200 || !isRecord(body) || !Array.isArray(body.data)) {
    return listFailure("failed", status, REGISTRATIONS_LOAD_ERROR_MESSAGE);
  }

  const meta = parseRegistrationListMeta(body.meta);
  const registrations = parseRegistrations(body.data);

  if (!meta || !registrations) {
    return listFailure("failed", status, REGISTRATIONS_LOAD_ERROR_MESSAGE);
  }

  return { ok: true, registrations, meta, message: "" };
}

/** Interpreta el detalle de una inscripción. */
export function parseRegistrationDetailResponse(
  status: number,
  body: unknown,
): RegistrationDetailResult {
  if (status === 401) {
    return detailFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return detailFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return detailFailure("not_found", status, REGISTRATION_NOT_FOUND_MESSAGE);
  }

  if (status !== 200 || !isRecord(body) || !isRecord(body.data)) {
    return detailFailure("failed", status, REGISTRATIONS_LOAD_ERROR_MESSAGE);
  }

  const registration = parseRegistration(body.data);

  if (!registration) {
    return detailFailure("failed", status, REGISTRATIONS_LOAD_ERROR_MESSAGE);
  }

  return { ok: true, registration, tutor: null, message: "" };
}

/** Interpreta una respuesta de dictamen (aprobación, rechazo, etc.). */
export function parseDictamenResponse(
  status: number,
  body: unknown,
): DictamenActionResult {
  if (status === 401) {
    return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return actionFailure("not_found", status, REGISTRATION_NOT_FOUND_MESSAGE);
  }

  if (status === 409) {
    return actionFailure("conflict", status, REGISTRATION_CONFLICT_MESSAGE);
  }

  if (status === 422) {
    const translated = translateDictamenApiErrors(body);
    const fieldErrors: Record<string, string> = {};

    for (const [key, value] of Object.entries(translated.errors)) {
      if (value.length > 0) {
        fieldErrors[key] = value;
      }
    }

    return actionFailure(
      "validation",
      status,
      translated.generalMessage ?? REGISTRATION_VALIDATION_MESSAGE,
      fieldErrors,
    );
  }

  if (status !== 200 || !isRecord(body) || !isRecord(body.data)) {
    return actionFailure(
      "failed",
      status,
      REGISTRATION_OPERATION_ERROR_MESSAGE,
    );
  }

  const registration = parseRegistration(body.data);

  if (!registration) {
    return actionFailure(
      "failed",
      status,
      REGISTRATION_OPERATION_ERROR_MESSAGE,
    );
  }

  return { ok: true, message: getApiMessage(body, ""), registration };
}

/** Extrae el total de pendientes de una respuesta de listado. */
export function parsePendingTotal(
  status: number,
  body: unknown,
): number | null {
  const result = parseRegistrationListResponse(status, body);
  return result.ok ? result.meta.total : null;
}

function getErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name;
  }

  if (isRecord(error) && typeof error.name === "string") {
    return error.name;
  }

  return "";
}

type RegistrationTransportFailure = {
  readonly ok: false;
  readonly status: number | null;
  readonly message: string;
};

type RegistrationJsonResult =
  | { readonly ok: true; readonly status: number; readonly body: unknown }
  | RegistrationTransportFailure;

interface RegistrationJsonRequest {
  readonly method?: "GET" | "PUT";
  readonly body?: unknown;
}

async function requestRegistrationJson(
  token: string,
  path: string,
  options: RegistrationRequestOptions,
  request: RegistrationJsonRequest = {},
): Promise<RegistrationJsonResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? REGISTRATION_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[registrations] ${detail}`);
    return {
      ok: false,
      status: null,
      message: REGISTRATION_API_NOT_CONFIGURED_MESSAGE,
    };
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (request.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: request.method ?? "GET",
      headers,
      ...(request.body === undefined
        ? {}
        : { body: JSON.stringify(request.body) }),
      credentials: "omit",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    let body: unknown = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return { ok: true, status: response.status, body };
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return {
      ok: false,
      status: null,
      message: isTimeout
        ? REGISTRATION_TIMEOUT_ERROR_MESSAGE
        : REGISTRATION_CONNECTION_ERROR_MESSAGE,
    };
  }
}

async function requestRegistrationListPage(
  token: string,
  page: number,
  options: RegistrationRequestOptions,
): Promise<RegistrationListResult> {
  const params = new URLSearchParams({
    per_page: String(REGISTRATIONS_PAGE_SIZE),
    page: String(page),
  });

  const response = await requestRegistrationJson(
    token,
    `${REGISTRATIONS_ENDPOINT_PATH}?${params.toString()}`,
    options,
  );

  if (!response.ok) {
    return listFailure("failed", response.status, response.message);
  }

  return parseRegistrationListResponse(response.status, response.body);
}

/** Obtiene todo el padrón con `per_page=100` y tope de 100, sin datos parciales. */
export async function listAllRegistrations(
  token: string,
  options: RegistrationRequestOptions = {},
): Promise<RegistrationListResult> {
  const firstPage = await requestRegistrationListPage(token, 1, options);

  if (!firstPage.ok) {
    return firstPage;
  }

  if (firstPage.meta.lastPage > REGISTRATIONS_MAX_PAGES) {
    return listFailure("failed", null, REGISTRATIONS_LOAD_ERROR_MESSAGE);
  }

  const registrations = [...firstPage.registrations];
  let lastPage = firstPage.meta.lastPage;

  for (let page = 2; page <= lastPage; page += 1) {
    const result = await requestRegistrationListPage(token, page, options);

    if (!result.ok) {
      return result;
    }

    lastPage = Math.max(lastPage, result.meta.lastPage);

    if (lastPage > REGISTRATIONS_MAX_PAGES) {
      return listFailure("failed", null, REGISTRATIONS_LOAD_ERROR_MESSAGE);
    }

    registrations.push(...result.registrations);
  }

  const perPage = firstPage.meta.perPage;

  return {
    ok: true,
    registrations,
    meta: {
      currentPage: 1,
      lastPage: Math.max(1, Math.ceil(registrations.length / perPage)),
      perPage,
      total: registrations.length,
    },
    message: firstPage.message,
  };
}

/** Consulta el detalle de una inscripción. */
export async function getRegistration(
  token: string,
  registrationId: string,
  options: RegistrationRequestOptions = {},
): Promise<RegistrationDetailResult> {
  const id = registrationId.trim();

  if (id.length === 0) {
    return detailFailure("not_found", null, REGISTRATION_NOT_FOUND_MESSAGE);
  }

  const response = await requestRegistrationJson(
    token,
    `${REGISTRATIONS_ENDPOINT_PATH}/${encodeURIComponent(id)}`,
    options,
  );

  if (!response.ok) {
    return detailFailure("failed", response.status, response.message);
  }

  return parseRegistrationDetailResponse(response.status, response.body);
}

async function requestDictamen(
  token: string,
  registrationId: string,
  action: "approve" | "reject" | "observe" | "propose-reassignment",
  payload: unknown,
  options: RegistrationRequestOptions,
): Promise<DictamenActionResult> {
  const response = await requestRegistrationJson(
    token,
    `${REGISTRATIONS_ENDPOINT_PATH}/${encodeURIComponent(registrationId)}/${action}`,
    options,
    { method: "PUT", body: payload },
  );

  if (!response.ok) {
    return actionFailure("failed", response.status, response.message);
  }

  return parseDictamenResponse(response.status, response.body);
}

/** Aprueba una solicitud. */
export async function approveRegistration(
  token: string,
  registrationId: string,
  payload: unknown,
  options: RegistrationRequestOptions = {},
): Promise<DictamenActionResult> {
  return requestDictamen(token, registrationId, "approve", payload, options);
}

/** Rechaza una solicitud. */
export async function rejectRegistration(
  token: string,
  registrationId: string,
  payload: unknown,
  options: RegistrationRequestOptions = {},
): Promise<DictamenActionResult> {
  return requestDictamen(token, registrationId, "reject", payload, options);
}

/** Devuelve una solicitud con observaciones. */
export async function observeRegistration(
  token: string,
  registrationId: string,
  payload: unknown,
  options: RegistrationRequestOptions = {},
): Promise<DictamenActionResult> {
  return requestDictamen(token, registrationId, "observe", payload, options);
}

/** Propone una reasignación de curso. */
export async function proposeReassignment(
  token: string,
  registrationId: string,
  payload: unknown,
  options: RegistrationRequestOptions = {},
): Promise<DictamenActionResult> {
  return requestDictamen(
    token,
    registrationId,
    "propose-reassignment",
    payload,
    options,
  );
}

/** Consulta el total de solicitudes pendientes. */
export async function getPendingRegistrationsTotal(
  token: string,
  options: RegistrationRequestOptions = {},
): Promise<number | null> {
  const params = new URLSearchParams({
    status: "PENDING",
    per_page: "1",
    page: "1",
  });

  const response = await requestRegistrationJson(
    token,
    `${REGISTRATIONS_ENDPOINT_PATH}?${params.toString()}`,
    options,
  );

  if (!response.ok) {
    return null;
  }

  return parsePendingTotal(response.status, response.body);
}

function parseAvailableCourse(value: unknown): AvailableCourse | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseText(value.id);
  const code = parseText(value.code);
  const year = parseInteger(value.year);
  const studyYear = parseInteger(value.studyYear, 1);
  const division = parseText(value.division);
  const cycle = parseText(value.cycle);
  const shift = parseText(value.shift);
  const speciality = parseText(value.speciality);
  const availablePlaces = parseInteger(value.availablePlaces, 0);

  if (
    !id ||
    !code ||
    year === null ||
    studyYear === null ||
    !division ||
    !cycle ||
    !shift ||
    !speciality ||
    availablePlaces === null
  ) {
    return null;
  }

  return {
    id,
    code,
    year,
    studyYear,
    division,
    cycle,
    shift,
    speciality,
    availablePlaces,
  };
}

function parseAvailableCourses(
  items: readonly unknown[],
): AvailableCourse[] | null {
  const courses: AvailableCourse[] = [];

  for (const item of items) {
    const course = parseAvailableCourse(item);

    if (!course) {
      return null;
    }

    courses.push(course);
  }

  return courses;
}

/** Consulta los cursos activos con cupo del año indicado. */
export async function listAvailableCourses(
  token: string,
  year: number,
  options: RegistrationRequestOptions = {},
): Promise<AvailableCourse[] | null> {
  const params = new URLSearchParams({ year: String(year) });

  const response = await requestRegistrationJson(
    token,
    `${COURSES_AVAILABLE_ENDPOINT_PATH}?${params.toString()}`,
    options,
  );

  if (
    !response.ok ||
    !isRecord(response.body) ||
    !Array.isArray(response.body.data)
  ) {
    return null;
  }

  return parseAvailableCourses(response.body.data);
}
