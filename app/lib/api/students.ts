import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/types.ts";
import { isRecord } from "./auth.ts";
import { getApiBaseUrl } from "./config.ts";
import { isGender } from "../students/labels.ts";
import { translateStudentApiErrors } from "../validation/students.ts";
import type {
  Student,
  StudentActionFailure,
  StudentActionFailureKind,
  StudentActionResult,
  StudentFailureKind,
  StudentFilters,
  StudentListMeta,
  StudentListResult,
  StudentResult,
  StudentTutor,
  StudentTutorResult,
} from "../students/types.ts";

export const STUDENTS_ENDPOINT_PATH = "/api/students";
export const STUDENTS_ME_ENDPOINT_PATH = "/api/students/me";
export const STUDENT_REQUEST_TIMEOUT_MS = 10_000;
export const STUDENTS_PAGE_SIZE = 100;
export const STUDENTS_MAX_PAGES = 100;

export interface StudentRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}
export const STUDENTS_LOAD_ERROR_MESSAGE =
  "No pudimos cargar los alumnos. Intentá nuevamente.";
export const STUDENT_NOT_FOUND_MESSAGE =
  "El alumno no existe o no tenés permisos.";
export const STUDENT_OPERATION_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";
export const STUDENT_VALIDATION_MESSAGE =
  "Revisá los datos del formulario e intentá nuevamente.";
export const STUDENT_CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";
export const STUDENT_TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";
export const STUDENT_API_NOT_CONFIGURED_MESSAGE =
  "El servicio de alumnos no está disponible en este momento. Intentá nuevamente.";

function parseInteger(
  value: unknown,
  min?: number,
): number | null {
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

function parseId(value: unknown): string | null {
  if (typeof value === "string") {
    return parseText(value);
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value);
  }

  return null;
}

/** Valida y normaliza un alumno; devuelve `null` si falta un campo obligatorio. */
export function parseStudent(value: unknown): Student | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseId(value.id);
  const studentDni = parseText(value.studentDni);
  const studentCuil = parseText(value.studentCuil);
  const firstName = parseText(value.firstName);
  const lastName = parseText(value.lastName);
  const birthdate = parseText(value.birthdate);
  const gender = isGender(value.gender) ? value.gender : null;
  const createdAt = parseText(value.created_at);
  const updatedAt = parseText(value.updated_at);

  if (
    !id ||
    !studentDni ||
    !studentCuil ||
    !firstName ||
    !lastName ||
    !birthdate ||
    !gender
  ) {
    return null;
  }

  return {
    id,
    studentDni,
    studentCuil,
    firstName,
    lastName,
    studentEmail: parseText(value.studentEmail),
    studentPhone: parseText(value.studentPhone),
    birthdate,
    gender,
    birthplace: parseText(value.birthplace),
    address: parseText(value.address),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
}

/** Valida y normaliza al tutor responsable de un alumno. */
export function parseStudentTutor(
  value: unknown,
): StudentTutor | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = parseText(value.name);
  const lastname = parseText(value.lastname);
  const email = parseText(value.email);

  if (!name || !lastname || !email) {
    return null;
  }

  return {
    name,
    lastname,
    email,
    user_phone: parseText(value.user_phone),
  };
}

/** Valida los metadatos de paginación del listado general. */
export function parseStudentListMeta(
  value: unknown,
): StudentListMeta | null {
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
  kind: StudentFailureKind,
  status: number | null,
  message: string,
): StudentListResult {
  return { ok: false, kind, status, message };
}

function failure(
  kind: StudentFailureKind,
  status: number | null,
  message: string,
): StudentResult {
  return { ok: false, kind, status, message };
}

function tutorFailure(
  kind: StudentFailureKind,
  status: number | null,
  message: string,
): StudentTutorResult {
  return { ok: false, kind, status, message };
}

function actionFailure(
  kind: StudentActionFailureKind,
  status: number | null,
  message: string,
  fieldErrors?: Record<string, string>,
): StudentActionFailure {
  return {
    ok: false,
    kind,
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

function parseStudents(
  items: readonly unknown[],
): Student[] | null {
  const students: Student[] = [];

  for (const item of items) {
    const student = parseStudent(item);

    if (!student) {
      return null;
    }

    students.push(student);
  }

  return students;
}

/** Interpreta el listado general paginado. */
export function parseStudentListResponse(
  status: number,
  body: unknown,
): StudentListResult {
  if (status === 401) {
    return listFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return listFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status !== 200 || !isRecord(body) || !Array.isArray(body.data)) {
    return listFailure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  const meta = parseStudentListMeta(body.meta);
  const students = parseStudents(body.data);

  if (!meta || !students) {
    return listFailure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  return { ok: true, students, meta, message: "" };
}

/** Interpreta el listado de alumnos propios del tutor, sin paginar. */
export function parseMyStudentsResponse(
  status: number,
  body: unknown,
): StudentListResult {
  if (status === 401) {
    return listFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return listFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status !== 200 || !isRecord(body) || !Array.isArray(body.data)) {
    return listFailure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  const students = parseStudents(body.data);

  if (!students) {
    return listFailure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  return {
    ok: true,
    students,
    meta: {
      currentPage: 1,
      lastPage: 1,
      perPage: students.length,
      total: students.length,
    },
    message: "",
  };
}

/** Interpreta el detalle de un alumno. */
export function parseStudentDetailResponse(
  status: number,
  body: unknown,
): StudentResult {
  if (status === 401) {
    return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return failure("not_found", status, STUDENT_NOT_FOUND_MESSAGE);
  }

  if (status !== 200 || !isRecord(body) || !isRecord(body.data)) {
    return failure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  const student = parseStudent(body.data);

  if (!student) {
    return failure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  return { ok: true, student, message: "" };
}

/** Interpreta los datos del tutor responsable. */
export function parseStudentTutorResponse(
  status: number,
  body: unknown,
): StudentTutorResult {
  if (status === 401) {
    return tutorFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return tutorFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return tutorFailure("not_found", status, STUDENT_NOT_FOUND_MESSAGE);
  }

  if (status !== 200 || !isRecord(body) || !isRecord(body.data)) {
    return tutorFailure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  const tutor = parseStudentTutor(body.data);

  if (!tutor) {
    return tutorFailure("failed", status, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  return { ok: true, tutor, message: "" };
}

function parseValidationFailure(
  status: number,
  body: unknown,
): StudentActionFailure {
  const translated = translateStudentApiErrors(body);
  const fieldErrors: Record<string, string> = {};

  for (const [key, value] of Object.entries(translated.errors)) {
    if (typeof value === "string" && value.length > 0) {
      fieldErrors[key] = value;
    }
  }

  return actionFailure(
    "validation",
    status,
    translated.generalMessage ?? STUDENT_VALIDATION_MESSAGE,
    fieldErrors,
  );
}

/** Interpreta la respuesta de alta (`201`) o edición (`200`). */
export function parseStudentMutationResponse(
  status: number,
  body: unknown,
  successStatus: 200 | 201,
): StudentActionResult {
  if (status === 401) {
    return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  if (status === 404) {
    return actionFailure("not_found", status, STUDENT_NOT_FOUND_MESSAGE);
  }

  if (status === 422) {
    return parseValidationFailure(status, body);
  }

  if (
    status !== successStatus ||
    !isRecord(body) ||
    !isRecord(body.data)
  ) {
    return actionFailure(
      "failed",
      status,
      STUDENT_OPERATION_ERROR_MESSAGE,
    );
  }

  const student = parseStudent(body.data);

  if (!student) {
    return actionFailure(
      "failed",
      status,
      STUDENT_OPERATION_ERROR_MESSAGE,
    );
  }

  return {
    ok: true,
    message:
      successStatus === 201
        ? "Alumno registrado correctamente"
        : "Alumno actualizado correctamente",
    student,
  };
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

type StudentTransportFailure = {
  readonly ok: false;
  readonly status: number | null;
  readonly message: string;
};

type StudentJsonResult =
  | {
      readonly ok: true;
      readonly status: number;
      readonly body: unknown;
    }
  | StudentTransportFailure;

interface StudentJsonRequest {
  readonly method?: "GET" | "POST" | "PUT";
  readonly body?: unknown;
}

async function requestStudentJson(
  token: string,
  path: string,
  options: StudentRequestOptions,
  request: StudentJsonRequest = {},
): Promise<StudentJsonResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? STUDENT_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[students] ${detail}`);
    return {
      ok: false,
      status: null,
      message: STUDENT_API_NOT_CONFIGURED_MESSAGE,
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
        ? STUDENT_TIMEOUT_ERROR_MESSAGE
        : STUDENT_CONNECTION_ERROR_MESSAGE,
    };
  }
}

const EMPTY_STUDENT_FILTERS: StudentFilters = Object.freeze({
  studentDni: "",
  studentCuil: "",
  firstName: "",
  lastName: "",
});

function buildStudentPageParams(
  filters: StudentFilters,
  page: number,
): URLSearchParams {
  const params = new URLSearchParams({
    per_page: String(STUDENTS_PAGE_SIZE),
    page: String(page),
  });

  const studentDni = filters.studentDni.trim();
  if (studentDni) {
    params.set("studentDni", studentDni);
  }

  const studentCuil = filters.studentCuil.trim();
  if (studentCuil) {
    params.set("studentCuil", studentCuil);
  }

  const firstName = filters.firstName.trim();
  if (firstName) {
    params.set("firstName", firstName);
  }

  const lastName = filters.lastName.trim();
  if (lastName) {
    params.set("lastName", lastName);
  }

  return params;
}

async function requestStudentListPage(
  token: string,
  filters: StudentFilters,
  page: number,
  options: StudentRequestOptions,
): Promise<StudentListResult> {
  const response = await requestStudentJson(
    token,
    `${STUDENTS_ENDPOINT_PATH}?${buildStudentPageParams(filters, page).toString()}`,
    options,
  );

  if (!response.ok) {
    return listFailure("failed", response.status, response.message);
  }

  return parseStudentListResponse(response.status, response.body);
}

/** Lista los alumnos propios del tutor autenticado, sin paginar. */
export async function listMyStudents(
  token: string,
  options: StudentRequestOptions = {},
): Promise<StudentListResult> {
  const response = await requestStudentJson(
    token,
    STUDENTS_ME_ENDPOINT_PATH,
    options,
  );

  if (!response.ok) {
    return listFailure("failed", response.status, response.message);
  }

  return parseMyStudentsResponse(response.status, response.body);
}

/** Lista una página del padrón con los filtros documentados. */
export async function listStudentsPage(
  token: string,
  filters: StudentFilters,
  page = 1,
  options: StudentRequestOptions = {},
): Promise<StudentListResult> {
  const safePage =
    Number.isSafeInteger(page) && page > 0 ? page : 1;

  return requestStudentListPage(
    token,
    filters,
    safePage,
    options,
  );
}

/**
 * Obtiene todo el padrón recorriendo páginas de 100 con tope de 100 páginas.
 * Si una página falla o el tope se excede, no devuelve datos parciales.
 */
export async function listAllStudents(
  token: string,
  options: StudentRequestOptions = {},
): Promise<StudentListResult> {
  const firstPage = await requestStudentListPage(
    token,
    EMPTY_STUDENT_FILTERS,
    1,
    options,
  );

  if (!firstPage.ok) {
    return firstPage;
  }

  if (firstPage.meta.lastPage > STUDENTS_MAX_PAGES) {
    return listFailure("failed", null, STUDENTS_LOAD_ERROR_MESSAGE);
  }

  const students = [...firstPage.students];
  let lastPage = firstPage.meta.lastPage;

  for (let page = 2; page <= lastPage; page += 1) {
    const result = await requestStudentListPage(
      token,
      EMPTY_STUDENT_FILTERS,
      page,
      options,
    );

    if (!result.ok) {
      return result;
    }

    lastPage = Math.max(lastPage, result.meta.lastPage);

    if (lastPage > STUDENTS_MAX_PAGES) {
      return listFailure("failed", null, STUDENTS_LOAD_ERROR_MESSAGE);
    }

    students.push(...result.students);
  }

  const perPage = firstPage.meta.perPage;

  return {
    ok: true,
    students,
    meta: {
      currentPage: 1,
      lastPage: Math.max(1, Math.ceil(students.length / perPage)),
      perPage,
      total: students.length,
    },
    message: firstPage.message,
  };
}

/** Registra un alumno a cargo del tutor. */
export async function registerStudent(
  token: string,
  payload: unknown,
  options: StudentRequestOptions = {},
): Promise<StudentActionResult> {
  const response = await requestStudentJson(
    token,
    STUDENTS_ENDPOINT_PATH,
    options,
    { method: "POST", body: payload },
  );

  if (!response.ok) {
    return actionFailure("failed", response.status, response.message);
  }

  return parseStudentMutationResponse(
    response.status,
    response.body,
    201,
  );
}

/** Actualiza los datos editables de un alumno propio. */
export async function updateStudent(
  token: string,
  studentId: string,
  payload: unknown,
  options: StudentRequestOptions = {},
): Promise<StudentActionResult> {
  const response = await requestStudentJson(
    token,
    `${STUDENTS_ENDPOINT_PATH}/${encodeURIComponent(studentId)}`,
    options,
    { method: "PUT", body: payload },
  );

  if (!response.ok) {
    return actionFailure("failed", response.status, response.message);
  }

  return parseStudentMutationResponse(
    response.status,
    response.body,
    200,
  );
}

/** Consulta el detalle de un alumno para los roles administrativos. */
export async function getStudentDetail(
  token: string,
  studentId: string,
  options: StudentRequestOptions = {},
): Promise<StudentResult> {
  const id = studentId.trim();

  if (id.length === 0) {
    return failure("not_found", null, STUDENT_NOT_FOUND_MESSAGE);
  }

  const response = await requestStudentJson(
    token,
    `${STUDENTS_ENDPOINT_PATH}/${encodeURIComponent(id)}`,
    options,
  );

  if (!response.ok) {
    return failure("failed", response.status, response.message);
  }

  return parseStudentDetailResponse(response.status, response.body);
}

/** Consulta los datos de contacto del tutor responsable. */
export async function getStudentTutor(
  token: string,
  studentId: string,
  options: StudentRequestOptions = {},
): Promise<StudentTutorResult> {
  const id = studentId.trim();

  if (id.length === 0) {
    return tutorFailure("not_found", null, STUDENT_NOT_FOUND_MESSAGE);
  }

  const response = await requestStudentJson(
    token,
    `${STUDENTS_ENDPOINT_PATH}/${encodeURIComponent(id)}/tutor`,
    options,
  );

  if (!response.ok) {
    return tutorFailure("failed", response.status, response.message);
  }

  return parseStudentTutorResponse(response.status, response.body);
}
