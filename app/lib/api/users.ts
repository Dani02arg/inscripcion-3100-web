import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  type UserRole,
} from "../auth/types.ts";
import { isIdentifierInput } from "../users/list.ts";
import { isStaffRole } from "../users/rules.ts";
import {
  mapUserFieldErrors,
  translateUserFieldErrors,
} from "../validation/users.ts";
import type {
  RoleRequestPayload,
  RoleRequestResult,
  UserActionFailure,
  UserActionResult,
  UserDetail,
  UserDetailResult,
  UserFailure,
  UserFilters,
  UserListMeta,
  UserListResult,
  UserSummary,
  TutorProfilePayload,
} from "../users/types.ts";
import { getApiMessage, isRecord, toStringArray } from "./auth.ts";
import { getApiBaseUrl } from "./config.ts";

export const USERS_ENDPOINT_PATH = "/api/users";
export const STAFF_ENDPOINT_PATH = "/api/users/staff";
export const USER_REQUEST_TIMEOUT_MS = 10_000;
export const USERS_PAGE_SIZE = 10;
export const STAFF_PAGE_SIZE = 100;
export const USERS_MAX_PAGES = 100;

export const USERS_LOAD_ERROR_MESSAGE =
  "No pudimos cargar los usuarios. Intentá nuevamente.";
export const STAFF_LOAD_ERROR_MESSAGE =
  "No pudimos cargar el directorio. Intentá nuevamente.";
export const USER_NOT_FOUND_MESSAGE =
  "El usuario no existe o fue dado de baja.";
export const USER_DETAIL_LOAD_ERROR_MESSAGE =
  "No pudimos cargar el usuario. Intentá nuevamente.";
export const USER_DELETE_SUCCESS_MESSAGE =
  "Usuario eliminado correctamente.";
export const USER_ROLE_UPDATED_MESSAGE =
  "Rol actualizado correctamente.";
export const USER_PROFILE_UPDATED_MESSAGE =
  "Perfil actualizado correctamente.";
export const TUTOR_PROFILE_ENDPOINT_PATH = "/api/profile/tutor";
export const ROLE_REQUEST_ENDPOINT_PATH = "/api/role-request";
export const ROLE_REQUEST_SUCCESS_MESSAGE =
  "Solicitud de cambio de rol enviada correctamente.";
export const USER_OPERATION_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";

function parseInteger(
  value: unknown,
  options: { readonly min?: number } = {},
): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return null;
  }

  if (options.min !== undefined && value < options.min) {
    return null;
  }

  return value;
}

function parseRequiredText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseUserId(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

/** Valida y normaliza un usuario resumido del padrón o del directorio. */
export function parseUserSummary(value: unknown): UserSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseUserId(value.id);
  const role = parseRequiredText(value.role);
  const name = parseRequiredText(value.name);
  const lastname = parseRequiredText(value.lastname);

  if (id === null || role === null || name === null || lastname === null) {
    return null;
  }

  return {
    id,
    role,
    name,
    lastname,
    dni: parseOptionalText(value.dni),
    cuil: parseOptionalText(value.cuil),
    email: parseOptionalText(value.email),
  };
}

/** Valida los metadatos de paginación de usuarios. */
export function parseUserListMeta(value: unknown): UserListMeta | null {
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
    total === null ||
    currentPage > lastPage
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

function getOutOfRangeLastPage(
  status: number,
  body: unknown,
  requestedPage: number,
  expectedPageSize: number,
): number | null {
  if (
    status < 200 ||
    status >= 300 ||
    !isRecord(body) ||
    hasApiErrors(body) ||
    !Array.isArray(body.data) ||
    body.data.length > 0 ||
    !isRecord(body.meta)
  ) {
    return null;
  }

  const currentPage = parseInteger(body.meta.current_page, { min: 1 });
  const lastPage = parseInteger(body.meta.last_page, { min: 1 });
  const perPage = parseInteger(body.meta.per_page, { min: 1 });
  const total = parseInteger(body.meta.total, { min: 0 });

  if (
    currentPage !== requestedPage ||
    lastPage === null ||
    currentPage <= lastPage ||
    perPage !== expectedPageSize ||
    total === null ||
    lastPage !== Math.max(1, Math.ceil(total / perPage))
  ) {
    return null;
  }

  return lastPage;
}

function failure(
  kind: UserFailure["kind"],
  status: number | null,
  message: string,
): UserFailure {
  return { ok: false, kind, status, message };
}

function actionFailure(
  kind: UserActionFailure["kind"],
  status: number | null,
  message: string,
  fieldErrors?: UserActionFailure["fieldErrors"],
): UserActionFailure {
  return {
    ok: false,
    kind,
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

function parseUserListResult(
  status: number,
  body: unknown,
  loadMessage: string,
  expectedPageSize?: number,
): UserListResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    return failure("failed", status, loadMessage);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return failure("failed", status, loadMessage);
  }

  const meta = parseUserListMeta(body.meta);

  if (
    !Array.isArray(body.data) ||
    meta === null ||
    (expectedPageSize !== undefined &&
      (meta.perPage !== expectedPageSize ||
        meta.lastPage !==
          Math.max(1, Math.ceil(meta.total / meta.perPage))))
  ) {
    return failure("failed", status, loadMessage);
  }

  const users: UserSummary[] = [];

  for (const item of body.data) {
    const user = parseUserSummary(item);

    if (!user) {
      return failure("failed", status, loadMessage);
    }

    users.push(user);
  }

  return {
    ok: true,
    users,
    meta,
    message: getApiMessage(body, ""),
  };
}

/** Interpreta la respuesta paginada de `GET /api/users`. */
export function parseUserListResponse(
  status: number,
  body: unknown,
): UserListResult {
  return parseUserListResult(
    status,
    body,
    USERS_LOAD_ERROR_MESSAGE,
    USERS_PAGE_SIZE,
  );
}

/** Interpreta la respuesta paginada de `GET /api/users/staff`. */
export function parseStaffListResponse(
  status: number,
  body: unknown,
): UserListResult {
  return parseUserListResult(status, body, STAFF_LOAD_ERROR_MESSAGE);
}

/** Valida y normaliza el detalle de un usuario, incluida la auditoría. */
export function parseUserDetail(value: unknown): UserDetail | null {
  const summary = parseUserSummary(value);

  if (!summary || !isRecord(value)) {
    return null;
  }

  return {
    ...summary,
    userPhone: parseOptionalText(value.user_phone),
    occupation: parseOptionalText(value.occupation),
    educationLevel: parseOptionalText(value.education_level),
    birthdate: parseOptionalText(value.birthdate),
    emailVerifiedAt: parseOptionalText(value.email_verified_at),
    createdAt: parseOptionalText(value.created_at),
    updatedAt: parseOptionalText(value.updated_at),
  };
}

/** Interpreta la respuesta de `GET /api/users/{userId}`. */
export function parseUserDetailResponse(
  status: number,
  body: unknown,
): UserDetailResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return failure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return failure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return failure("not_found", status, USER_NOT_FOUND_MESSAGE);
    }

    return failure("failed", status, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return failure("failed", status, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }

  const user = parseUserDetail(body.data);

  if (!user) {
    return failure("failed", status, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }

  return {
    ok: true,
    user,
    message: getApiMessage(body, ""),
  };
}

/** Interpreta la respuesta de `PUT /api/users/{userId}/role`. */
export function parseUserRoleChangeResponse(
  status: number,
  body: unknown,
): UserActionResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return actionFailure("not_found", status, USER_NOT_FOUND_MESSAGE);
    }

    if (status === 409) {
      return actionFailure(
        "conflict",
        status,
        getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
      );
    }

    if (status === 422) {
      const translated = translateUserFieldErrors(
        mapUserFieldErrors(body),
      );

      return actionFailure(
        "validation",
        status,
        translated.generalMessage ??
          getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
        translated.errors,
      );
    }

    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  const user = parseUserDetail(body.data);

  if (!user) {
    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return {
    ok: true,
    user,
    message: getApiMessage(body, USER_ROLE_UPDATED_MESSAGE),
  };
}

/** Interpreta la respuesta de `DELETE /api/users/{userId}`. */
export function parseUserDeleteResponse(
  status: number,
  body: unknown,
): UserActionResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return actionFailure("not_found", status, USER_NOT_FOUND_MESSAGE);
    }

    if (status === 409) {
      return actionFailure(
        "conflict",
        status,
        getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
      );
    }

    if (status === 422) {
      const translated = translateUserFieldErrors(
        mapUserFieldErrors(body),
      );

      return actionFailure(
        "validation",
        status,
        translated.generalMessage ??
          getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
        translated.errors,
      );
    }

    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  if (isRecord(body) && hasApiErrors(body)) {
    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return {
    ok: true,
    message: getApiMessage(body, USER_DELETE_SUCCESS_MESSAGE),
  };
}

/** Interpreta la respuesta de `PUT /api/profile/tutor`. */
export function parseTutorProfileResponse(
  status: number,
  body: unknown,
): UserActionResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return actionFailure("not_found", status, USER_NOT_FOUND_MESSAGE);
    }

    if (status === 409) {
      return actionFailure(
        "conflict",
        status,
        getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
      );
    }

    if (status === 422) {
      const translated = translateUserFieldErrors(
        mapUserFieldErrors(body),
      );

      return actionFailure(
        "validation",
        status,
        translated.generalMessage ??
          getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
        translated.errors,
      );
    }

    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  if (!isRecord(body) || hasApiErrors(body)) {
    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  const user = parseUserDetail(body.data);

  if (!user) {
    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return {
    ok: true,
    user,
    message: getApiMessage(body, USER_PROFILE_UPDATED_MESSAGE),
  };
}

/** Interpreta la respuesta de `POST /api/role-request`. */
export function parseRoleRequestResponse(
  status: number,
  body: unknown,
): RoleRequestResult {
  const isSuccess = status >= 200 && status < 300;

  if (!isSuccess) {
    if (status === 401) {
      return actionFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
    }

    if (status === 403) {
      return actionFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
    }

    if (status === 404) {
      return actionFailure("not_found", status, USER_NOT_FOUND_MESSAGE);
    }

    if (status === 409) {
      return actionFailure(
        "conflict",
        status,
        getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
      );
    }

    if (status === 422) {
      const translated = translateUserFieldErrors(
        mapUserFieldErrors(body),
      );

      return actionFailure(
        "validation",
        status,
        translated.generalMessage ??
          getApiMessage(body, USER_OPERATION_ERROR_MESSAGE),
        translated.errors,
      );
    }

    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  if (isRecord(body) && hasApiErrors(body)) {
    return actionFailure(
      "failed",
      status,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return {
    ok: true,
    message: getApiMessage(body, ROLE_REQUEST_SUCCESS_MESSAGE),
  };
}

export interface UserRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

function buildUsersPageParams(
  filters: UserFilters,
  page: number,
): URLSearchParams {
  const params = new URLSearchParams({
    per_page: String(USERS_PAGE_SIZE),
    page: String(page),
  });

  const dni = filters.dni.trim();
  if (dni.length > 0 && isIdentifierInput(dni)) {
    params.set("dni", dni);
  }

  const cuil = filters.cuil.trim();
  if (cuil.length > 0 && isIdentifierInput(cuil)) {
    params.set("cuil", cuil);
  }

  const name = filters.name.trim();
  if (name.length > 0) {
    params.set("name", name);
  }

  const lastname = filters.lastname.trim();
  if (lastname.length > 0) {
    params.set("lastname", lastname);
  }

  const email = filters.email.trim();
  if (email.length > 0) {
    params.set("email", email);
  }

  return params;
}

function buildStaffPageParams(page: number): URLSearchParams {
  return new URLSearchParams({
    per_page: String(STAFF_PAGE_SIZE),
    page: String(page),
  });
}

async function requestUserList(
  token: string,
  path: string,
  params: URLSearchParams,
  options: UserRequestOptions,
  parse: (status: number, body: unknown) => UserListResult,
  errorMessage: string,
  pageCorrection?: {
    readonly requestedPage: number;
    readonly expectedPageSize: number;
    readonly paramsForPage: (page: number) => URLSearchParams;
  },
): Promise<UserListResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? USER_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[users] ${detail}`);

    return failure("failed", null, errorMessage);
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}${path}?${params.toString()}`,
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

    const result = parse(response.status, body);

    if (!result.ok && pageCorrection) {
      const lastPage = getOutOfRangeLastPage(
        response.status,
        body,
        pageCorrection.requestedPage,
        pageCorrection.expectedPageSize,
      );

      if (lastPage !== null && lastPage < pageCorrection.requestedPage) {
        return requestUserList(
          token,
          path,
          pageCorrection.paramsForPage(lastPage),
          options,
          parse,
          errorMessage,
        );
      }
    }

    return result;
  } catch {
    return failure("failed", null, errorMessage);
  }
}

/** Solicita una página del padrón con Bearer y filtros activos. */
export async function listUsersPage(
  token: string,
  filters: UserFilters,
  page = 1,
  options: UserRequestOptions = {},
): Promise<UserListResult> {
  const safePage =
    Number.isSafeInteger(page) && page > 0 ? page : 1;

  return requestUserList(
    token,
    USERS_ENDPOINT_PATH,
    buildUsersPageParams(filters, safePage),
    options,
    parseUserListResponse,
    USERS_LOAD_ERROR_MESSAGE,
    {
      requestedPage: safePage,
      expectedPageSize: USERS_PAGE_SIZE,
      paramsForPage: (adjustedPage) =>
        buildUsersPageParams(filters, adjustedPage),
    },
  );
}

/** Solicita una página del directorio de staff. */
export async function listStaffPage(
  token: string,
  page = 1,
  options: UserRequestOptions = {},
): Promise<UserListResult> {
  const safePage =
    Number.isSafeInteger(page) && page > 0 ? page : 1;

  return requestUserList(
    token,
    STAFF_ENDPOINT_PATH,
    buildStaffPageParams(safePage),
    options,
    parseStaffListResponse,
    STAFF_LOAD_ERROR_MESSAGE,
  );
}

/**
 * Obtiene todo el directorio recorriendo las páginas con tope de seguridad.
 * Si una página falla, no devuelve datos parciales. Excluye `TUTOR` y
 * recalcula total y páginas sobre el conjunto resultante.
 */
export async function listAllStaff(
  token: string,
  options: UserRequestOptions = {},
): Promise<UserListResult> {
  const firstPage = await listStaffPage(token, 1, options);

  if (!firstPage.ok) {
    return firstPage;
  }

  if (firstPage.meta.lastPage > USERS_MAX_PAGES) {
    return failure("failed", null, STAFF_LOAD_ERROR_MESSAGE);
  }

  const users = firstPage.users.filter((user) => isStaffRole(user.role));
  let lastPage = firstPage.meta.lastPage;

  for (let page = 2; page <= lastPage; page += 1) {
    const result = await listStaffPage(token, page, options);

    if (!result.ok) {
      return result;
    }

    lastPage = Math.max(lastPage, result.meta.lastPage);

    if (lastPage > USERS_MAX_PAGES) {
      return failure("failed", null, STAFF_LOAD_ERROR_MESSAGE);
    }

    users.push(
      ...result.users.filter((user) => isStaffRole(user.role)),
    );
  }

  const perPage = firstPage.meta.perPage;
  const total = users.length;

  return {
    ok: true,
    users,
    meta: {
      currentPage: 1,
      lastPage: Math.max(1, Math.ceil(total / perPage)),
      perPage,
      total,
    },
    message: firstPage.message,
  };
}

interface UserJsonSuccess {
  readonly ok: true;
  readonly status: number;
  readonly body: unknown;
}

interface UserJsonFailure {
  readonly ok: false;
}

type UserJsonResult = UserJsonSuccess | UserJsonFailure;

interface UserJsonRequest {
  readonly method?: "GET" | "POST" | "PUT" | "DELETE";
  readonly body?: unknown;
}

async function requestUserJson(
  token: string,
  path: string,
  options: UserRequestOptions,
  request: UserJsonRequest = {},
): Promise<UserJsonResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? USER_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[users] ${detail}`);

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

/** Obtiene el detalle de un usuario con su auditoría disponible. */
export async function getUser(
  token: string,
  userId: string,
  options: UserRequestOptions = {},
): Promise<UserDetailResult> {
  const id = userId.trim();

  if (id.length === 0) {
    return failure("failed", null, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }

  const response = await requestUserJson(
    token,
    `${USERS_ENDPOINT_PATH}/${encodeURIComponent(id)}`,
    options,
  );

  if (!response.ok) {
    return failure("failed", null, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }

  return parseUserDetailResponse(response.status, response.body);
}

/** Cambia el rol de un usuario con el payload `{ newRole }`. */
export async function changeUserRole(
  token: string,
  userId: string,
  newRole: UserRole,
  options: UserRequestOptions = {},
): Promise<UserActionResult> {
  const id = userId.trim();

  if (id.length === 0) {
    return actionFailure(
      "failed",
      null,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  const response = await requestUserJson(
    token,
    `${USERS_ENDPOINT_PATH}/${encodeURIComponent(id)}/role`,
    options,
    { method: "PUT", body: { newRole } },
  );

  if (!response.ok) {
    return actionFailure(
      "failed",
      null,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return parseUserRoleChangeResponse(response.status, response.body);
}

/** Da de baja lógicamente a un usuario. */
export async function deleteUser(
  token: string,
  userId: string,
  options: UserRequestOptions = {},
): Promise<UserActionResult> {
  const id = userId.trim();

  if (id.length === 0) {
    return actionFailure(
      "failed",
      null,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  const response = await requestUserJson(
    token,
    `${USERS_ENDPOINT_PATH}/${encodeURIComponent(id)}`,
    options,
    { method: "DELETE" },
  );

  if (!response.ok) {
    return actionFailure(
      "failed",
      null,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return parseUserDeleteResponse(response.status, response.body);
}

/** Actualiza ocupación y nivel educativo del tutor autenticado. */
export async function updateTutorProfile(
  token: string,
  payload: TutorProfilePayload,
  options: UserRequestOptions = {},
): Promise<UserActionResult> {
  const response = await requestUserJson(
    token,
    TUTOR_PROFILE_ENDPOINT_PATH,
    options,
    { method: "PUT", body: payload },
  );

  if (!response.ok) {
    return actionFailure(
      "failed",
      null,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return parseTutorProfileResponse(response.status, response.body);
}

/** Envía la solicitud de cambio de rol del tutor autenticado. */
export async function requestRoleChange(
  token: string,
  payload: RoleRequestPayload,
  options: UserRequestOptions = {},
): Promise<RoleRequestResult> {
  const response = await requestUserJson(
    token,
    ROLE_REQUEST_ENDPOINT_PATH,
    options,
    { method: "POST", body: payload },
  );

  if (!response.ok) {
    return actionFailure(
      "failed",
      null,
      USER_OPERATION_ERROR_MESSAGE,
    );
  }

  return parseRoleRequestResponse(response.status, response.body);
}
