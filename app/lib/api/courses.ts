import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/types.ts";
import { getApiBaseUrl } from "./config.ts";
import { getApiMessage, isRecord, toStringArray } from "./auth.ts";
import {
  mapCourseFieldErrors,
  translateCourseFieldErrors,
} from "../validation/course.ts";
import type {
  Course,
  CourseActionFailure,
  CourseActionResult,
  CourseCloneYearResult,
  CourseFailure,
  CourseListMeta,
  CourseListResult,
  CoursePayload,
  CourseReport,
  CourseReportResult,
  CourseReportRow,
  CourseResult,
  CourseStatus,
} from "../courses/types.ts";

export const COURSES_ENDPOINT_PATH = "/api/courses";
export const COURSE_REQUEST_TIMEOUT_MS = 10_000;
export const COURSES_PAGE_SIZE = 100;
export const COURSES_MAX_PAGES = 100;
export const COURSES_LOAD_ERROR_MESSAGE =
  "No pudimos cargar los cursos. Intentá nuevamente.";
export const COURSE_REPORT_ERROR_MESSAGE =
  "No pudimos cargar las inscripciones. Intentá nuevamente.";
export const COURSE_OPERATION_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";
export const COURSE_NOT_FOUND_MESSAGE =
  "El curso no existe o fue eliminado.";
export const COURSE_MISSING_MESSAGE = "El curso ya no existe.";
export const COURSE_DELETE_BLOCKED_MESSAGE =
  "No se puede eliminar: el curso tiene inscriptos.";

function parseInteger(
  value: unknown,
  options: { readonly min?: number; readonly max?: number } = {},
): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return null;
  }

  if (options.min !== undefined && value < options.min) {
    return null;
  }

  if (options.max !== undefined && value > options.max) {
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

function parseCode(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

function parseAvailablePlaces(
  value: unknown,
  maxCapacity: number,
  currentCapacity: number,
): number | null {
  if (value === undefined || value === null) {
    const derived = maxCapacity - currentCapacity;
    return derived >= 0 ? derived : null;
  }

  const parsed = parseInteger(value, { min: 0 });
  return parsed;
}

/** Valida y normaliza un curso; devuelve `null` si faltan campos obligatorios. */
export function parseCourse(value: unknown): Course | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    typeof value.id === "string"
      ? value.id
      : typeof value.id === "number" && Number.isFinite(value.id)
        ? String(value.id)
        : null;

  const code = parseCode(value.code);
  const year = parseInteger(value.year, { min: 1 });
  const studyYear = parseInteger(value.studyYear, { min: 1, max: 6 });
  const division = parseText(value.division);
  const cycle = parseText(value.cycle);
  const speciality = parseText(value.speciality);
  const shift = parseText(value.shift);
  const maxCapacity = parseInteger(value.maxCapacity, { min: 1 });
  const currentCapacity = parseInteger(value.currentCapacity, { min: 0 });
  const status = parseText(value.status);

  if (
    id === null ||
    code === undefined ||
    year === null ||
    studyYear === null ||
    division === null ||
    cycle === null ||
    speciality === null ||
    shift === null ||
    maxCapacity === null ||
    currentCapacity === null ||
    status === null
  ) {
    return null;
  }

  const course: Course = {
    id,
    code,
    year,
    studyYear,
    division,
    cycle,
    speciality,
    shift,
    maxCapacity,
    currentCapacity,
    availablePlaces: parseAvailablePlaces(
      value.availablePlaces,
      maxCapacity,
      currentCapacity,
    ),
    status,
  };

  return {
    ...course,
    ...(typeof value.createdAt === "string"
      ? { createdAt: value.createdAt }
      : {}),
    ...(typeof value.updatedAt === "string"
      ? { updatedAt: value.updatedAt }
      : {}),
  };
}

function parseListMeta(value: unknown): CourseListMeta | null {
  if (!isRecord(value)) {
    return null;
  }

  const currentPage = parseInteger(value.current_page, { min: 1 });
  const lastPage = parseInteger(value.last_page, { min: 1 });
  const perPage = parseInteger(value.per_page, { min: 1 });
  const total = parseInteger(value.total, { min: 0 });

  if (
    currentPage === null ||
    lastPage === null ||
    perPage === null ||
    total === null
  ) {
    return null;
  }

  return { currentPage, lastPage, perPage, total };
}

function hasApiErrors(body: unknown): boolean {
  if (!isRecord(body)) {
    return false;
  }

  if (toStringArray(body.errors).length > 0) {
    return true;
  }

  return isRecord(body.errors) && Object.keys(body.errors).length > 0;
}

function failure(
  kind: CourseFailure["kind"],
  status: number | null,
  message: string,
): CourseFailure {
  return { ok: false, kind, status, message };
}

/** Interpreta la respuesta paginada de `GET /api/courses`. */
export function parseCourseListResponse(
  status: number,
  body: unknown,
): CourseListResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
  }

  const meta = parseListMeta(body.meta);

  if (!Array.isArray(body.data) || meta === null) {
    return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
  }

  const courses: Course[] = [];

  for (const item of body.data) {
    const course = parseCourse(item);

    if (!course) {
      return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
    }

    courses.push(course);
  }

  return {
    ok: true,
    courses,
    meta,
    message: getApiMessage(body, ""),
  };
}

/** Interpreta la respuesta de `GET /api/courses/{id}`. */
export function parseCourseResponse(
  status: number,
  body: unknown,
): CourseResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return failure("not_found", status, COURSE_NOT_FOUND_MESSAGE);
    }

    return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
  }

  const course = parseCourse(body.data);

  if (!course) {
    return failure("failed", status, COURSES_LOAD_ERROR_MESSAGE);
  }

  return {
    ok: true,
    course,
    message: getApiMessage(body, ""),
  };
}

interface CourseMutationParseOptions {
  readonly conflictOn422?: boolean;
}

/** Interpreta una escritura que responde con el curso actualizado. */
export function parseCourseMutationResponse(
  status: number,
  body: unknown,
  options: CourseMutationParseOptions = {},
): CourseActionResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return actionFailure("not_found", status, COURSE_MISSING_MESSAGE);
    }

    if (status === 422) {
      if (options.conflictOn422) {
        return actionFailure("conflict", status, COURSE_OPERATION_ERROR_MESSAGE);
      }

      const translated = translateCourseFieldErrors(
        mapCourseFieldErrors(body),
      );

      return actionFailure(
        "validation",
        status,
        translated.generalMessage ?? COURSE_OPERATION_ERROR_MESSAGE,
        translated.errors,
      );
    }

    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  const course = parseCourse(body.data);

  if (!course) {
    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return {
    ok: true,
    course,
    message: getApiMessage(body, ""),
  };
}

function parseOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseReportRow(value: unknown): CourseReportRow | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    lastname: parseOptionalText(value.lastname),
    name: parseOptionalText(value.name),
    dni: parseOptionalText(value.dni),
    phone: parseOptionalText(value.phone),
    email: parseOptionalText(value.email),
  };
}

/** Interpreta la respuesta de `GET /api/courses/{id}/report`. */
export function parseCourseReportResponse(
  status: number,
  body: unknown,
): CourseReportResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return failure("not_found", status, COURSE_NOT_FOUND_MESSAGE);
    }

    return failure("failed", status, COURSE_REPORT_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return failure("failed", status, COURSE_REPORT_ERROR_MESSAGE);
  }

  if (!Array.isArray(body.list)) {
    return failure("failed", status, COURSE_REPORT_ERROR_MESSAGE);
  }

  const rows: CourseReportRow[] = [];

  for (const item of body.list) {
    const row = parseReportRow(item);

    if (!row) {
      return failure("failed", status, COURSE_REPORT_ERROR_MESSAGE);
    }

    rows.push(row);
  }

  const totalInscriptions =
    isRecord(body.header)
      ? parseInteger(body.header.totalInscriptions, { min: 0 })
      : null;

  const report: CourseReport = {
    totalInscriptions,
    rows,
  };

  return {
    ok: true,
    report,
    message: getApiMessage(body, ""),
  };
}

/** Interpreta la respuesta de `POST /api/courses/{id}/clone`. */
export function parseCloneCourseResponse(
  status: number,
  body: unknown,
): CourseResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return failure("not_found", status, COURSE_MISSING_MESSAGE);
    }

    return failure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return failure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  const course = parseCourse(body.data);

  if (!course) {
    return failure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return {
    ok: true,
    course,
    message: getApiMessage(body, ""),
  };
}

function actionFailure(
  kind: CourseActionFailure["kind"],
  status: number | null,
  message: string,
  fieldErrors?: CourseActionFailure["fieldErrors"],
): CourseActionFailure {
  return {
    ok: false,
    kind,
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

/** Interpreta la respuesta de `POST /api/courses/clone/{oldYear}`. */
export function parseCloneYearResponse(
  status: number,
  body: unknown,
  attempted?: number,
): CourseCloneYearResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  const cloned = parseInteger(body.cloned, { min: 0 });

  if (cloned === null) {
    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (body.courses !== undefined && !Array.isArray(body.courses)) {
    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (body.courses === undefined && cloned > 0) {
    return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
  }

  const courses: Course[] = [];

  for (const item of body.courses ?? []) {
    const course = parseCourse(item);

    if (!course) {
      return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
    }

    courses.push(course);
  }

  const attemptedCount =
    attempted !== undefined &&
    Number.isSafeInteger(attempted) &&
    attempted >= 0
      ? attempted
      : cloned;

  return {
    ok: true,
    message: getApiMessage(body, ""),
    cloned,
    attempted: attemptedCount,
    courses,
  };
}

/** Interpreta la respuesta de `DELETE /api/courses/{id}`. */
export function parseDeleteResponse(
  status: number,
  _body: unknown,
): CourseActionResult {
  const isSuccess = status >= 200 && status < 300;

  if (isSuccess) {
    return {
      ok: true,
      message: "Curso eliminado correctamente.",
    };
  }

  if (status === 401) {
    return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return actionFailure("not_found", status, COURSE_MISSING_MESSAGE);
  }

  if (status === 422) {
    return actionFailure("conflict", status, COURSE_DELETE_BLOCKED_MESSAGE);
  }

  return actionFailure("failed", status, COURSE_OPERATION_ERROR_MESSAGE);
}

export interface CourseRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

function buildCoursesPageUrl(baseUrl: string, page: number): string {
  const params = new URLSearchParams({
    per_page: String(COURSES_PAGE_SIZE),
    page: String(page),
  });

  return `${baseUrl}${COURSES_ENDPOINT_PATH}?${params.toString()}`;
}

/** Solicita una página del listado de cursos. */
export async function listCoursesPage(
  token: string,
  page = 1,
  options: CourseRequestOptions = {},
): Promise<CourseListResult> {
  const safePage =
    Number.isSafeInteger(page) && page > 0 ? page : 1;
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? COURSE_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[courses] ${detail}`);

    return failure("failed", null, COURSES_LOAD_ERROR_MESSAGE);
  }

  try {
    const response = await fetchImpl(
      buildCoursesPageUrl(baseUrl, safePage),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return parseCourseListResponse(response.status, body);
  } catch {
    return failure("failed", null, COURSES_LOAD_ERROR_MESSAGE);
  }
}

/** Obtiene todas las páginas del listado respetando el tope de seguridad. */
export async function listAllCourses(
  token: string,
  options: CourseRequestOptions = {},
): Promise<CourseListResult> {
  const firstPage = await listCoursesPage(token, 1, options);

  if (!firstPage.ok) {
    return firstPage;
  }

  if (firstPage.meta.lastPage > COURSES_MAX_PAGES) {
    return failure("failed", null, COURSES_LOAD_ERROR_MESSAGE);
  }

  const courses = [...firstPage.courses];
  let lastPage = firstPage.meta.lastPage;

  for (let page = 2; page <= lastPage; page += 1) {
    const result = await listCoursesPage(token, page, options);

    if (!result.ok) {
      return result;
    }

    lastPage = Math.max(lastPage, result.meta.lastPage);

    if (lastPage > COURSES_MAX_PAGES) {
      return failure("failed", null, COURSES_LOAD_ERROR_MESSAGE);
    }

    courses.push(...result.courses);
  }

  return {
    ok: true,
    courses,
    meta: {
      currentPage: 1,
      lastPage,
      perPage: firstPage.meta.perPage,
      total: firstPage.meta.total,
    },
    message: firstPage.message,
  };
}

interface CourseJsonSuccess {
  readonly ok: true;
  readonly status: number;
  readonly body: unknown;
}

interface CourseJsonFailure {
  readonly ok: false;
}

type CourseJsonResult = CourseJsonSuccess | CourseJsonFailure;

interface CourseJsonRequest {
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
}

async function requestCourseJson(
  token: string,
  path: string,
  options: CourseRequestOptions,
  request: CourseJsonRequest = {},
): Promise<CourseJsonResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? COURSE_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[courses] ${detail}`);

    return { ok: false };
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

    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return { ok: true, status: response.status, body };
  } catch {
    return { ok: false };
  }
}

/** Obtiene el detalle de un curso. */
export async function getCourse(
  token: string,
  courseId: string,
  options: CourseRequestOptions = {},
): Promise<CourseResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/${encodeURIComponent(courseId)}`,
    options,
  );

  if (!response.ok) {
    return failure("failed", null, COURSES_LOAD_ERROR_MESSAGE);
  }

  return parseCourseResponse(response.status, response.body);
}

/** Obtiene el reporte de inscripciones activas de un curso. */
export async function getCourseReport(
  token: string,
  courseId: string,
  options: CourseRequestOptions = {},
): Promise<CourseReportResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/${encodeURIComponent(courseId)}/report`,
    options,
  );

  if (!response.ok) {
    return failure("failed", null, COURSE_REPORT_ERROR_MESSAGE);
  }

  return parseCourseReportResponse(response.status, response.body);
}

/** Crea un curso con el payload exacto de siete campos. */
export async function createCourse(
  token: string,
  payload: CoursePayload,
  options: CourseRequestOptions = {},
): Promise<CourseActionResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/create`,
    options,
    { method: "POST", body: payload },
  );

  if (!response.ok) {
    return actionFailure("failed", null, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return parseCourseMutationResponse(response.status, response.body);
}

/** Actualiza un curso con los siete campos configurables. */
export async function updateCourse(
  token: string,
  courseId: string,
  payload: CoursePayload,
  options: CourseRequestOptions = {},
): Promise<CourseActionResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/${encodeURIComponent(courseId)}`,
    options,
    { method: "PATCH", body: payload },
  );

  if (!response.ok) {
    return actionFailure("failed", null, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return parseCourseMutationResponse(response.status, response.body);
}

/** Elimina lógicamente un curso. */
export async function deleteCourse(
  token: string,
  courseId: string,
  options: CourseRequestOptions = {},
): Promise<CourseActionResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/${encodeURIComponent(courseId)}`,
    options,
    { method: "DELETE" },
  );

  if (!response.ok) {
    return actionFailure("failed", null, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return parseDeleteResponse(response.status, response.body);
}

/** Clona un curso a un año destino. */
export async function cloneCourse(
  token: string,
  courseId: string,
  year: number,
  options: CourseRequestOptions = {},
): Promise<CourseActionResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/${encodeURIComponent(courseId)}/clone`,
    options,
    { method: "POST", body: { year } },
  );

  if (!response.ok) {
    return actionFailure("failed", null, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return parseCourseMutationResponse(response.status, response.body, {
    conflictOn422: true,
  });
}

/** Clona todos los cursos de un año anterior al actual. */
export async function cloneCoursesByYear(
  token: string,
  oldYear: number,
  options: CourseRequestOptions = {},
  attempted?: number,
): Promise<CourseCloneYearResult> {
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/clone/${encodeURIComponent(String(oldYear))}`,
    options,
    { method: "POST" },
  );

  if (!response.ok) {
    return actionFailure("failed", null, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return parseCloneYearResponse(response.status, response.body, attempted);
}

/** Activa o desactiva un curso. */
export async function setCourseStatus(
  token: string,
  courseId: string,
  status: CourseStatus,
  options: CourseRequestOptions = {},
): Promise<CourseActionResult> {
  const action = status === "active" ? "show" : "hide";
  const response = await requestCourseJson(
    token,
    `${COURSES_ENDPOINT_PATH}/${encodeURIComponent(courseId)}/${action}`,
    options,
    { method: "PATCH" },
  );

  if (!response.ok) {
    return actionFailure("failed", null, COURSE_OPERATION_ERROR_MESSAGE);
  }

  return parseCourseMutationResponse(response.status, response.body, {
    conflictOn422: true,
  });
}
