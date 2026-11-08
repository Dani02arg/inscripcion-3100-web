import { getApiBaseUrl } from "./config.ts";
import { getApiMessage, isRecord, toStringArray } from "./auth.ts";
import { isKnownRole } from "../auth/session.ts";
import type { CurrentUser } from "../auth/types.ts";
import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  USER_LOAD_ERROR_MESSAGE,
} from "../auth/types.ts";

export const ME_ENDPOINT_PATH = "/api/auth/me";
export const ME_REQUEST_TIMEOUT_MS = 10_000;

export interface MeRequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface CurrentUserSuccess {
  ok: true;
  user: CurrentUser;
  message: string;
}

export type CurrentUserFailureKind = "unauthorized" | "forbidden" | "failed";

export interface CurrentUserFailure {
  ok: false;
  kind: CurrentUserFailureKind;
  status: number | null;
  message: string;
}

export type CurrentUserResult = CurrentUserSuccess | CurrentUserFailure;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseUserData(value: unknown): CurrentUser | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" && typeof value.id !== "number") {
    return null;
  }

  if (!isNonEmptyString(value.name)) {
    return null;
  }

  if (!isNonEmptyString(value.lastname)) {
    return null;
  }

  if (!isNonEmptyString(value.email)) {
    return null;
  }

  if (!isKnownRole(value.role)) {
    return null;
  }

  const userPhone = parseOptionalText(value.user_phone);
  const birthdate = parseOptionalText(value.birthdate);
  const occupation = parseOptionalText(value.occupation);
  const educationLevel = parseOptionalText(value.education_level);
  const emailVerifiedAt = parseOptionalText(value.email_verified_at);
  const createdAt = parseOptionalText(value.created_at);
  const updatedAt = parseOptionalText(value.updated_at);

  return {
    id: String(value.id),
    name: value.name,
    lastname: value.lastname,
    email: value.email,
    role: value.role,
    ...(userPhone ? { userPhone } : {}),
    ...(birthdate ? { birthdate } : {}),
    ...(occupation ? { occupation } : {}),
    ...(educationLevel ? { educationLevel } : {}),
    ...(emailVerifiedAt ? { emailVerifiedAt } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function createFailure(
  kind: CurrentUserFailureKind,
  status: number | null,
  message: string,
): CurrentUserFailure {
  return { ok: false, kind, status, message };
}

/** Interpreta la respuesta de `GET /api/auth/me`. */
export function parseCurrentUserResponse(
  status: number,
  body: unknown,
): CurrentUserResult {
  const isSuccess = status >= 200 && status < 300;

  if (isSuccess) {
    const errors =
      isRecord(body) && "errors" in body ? toStringArray(body.errors) : [];

    if (errors.length > 0) {
      return createFailure("failed", status, USER_LOAD_ERROR_MESSAGE);
    }

    const user =
      isRecord(body) && "data" in body ? parseUserData(body.data) : null;

    if (!user) {
      return createFailure("failed", status, USER_LOAD_ERROR_MESSAGE);
    }

    return { ok: true, user, message: getApiMessage(body, "") };
  }

  if (status === 401) {
    return createFailure("unauthorized", status, SESSION_EXPIRED_MESSAGE);
  }

  if (status === 403) {
    return createFailure("forbidden", status, ACCESS_DENIED_MESSAGE);
  }

  return createFailure(
    "failed",
    status,
    getApiMessage(body, USER_LOAD_ERROR_MESSAGE),
  );
}

/** Solicita el usuario autenticado con el token como Bearer. */
export async function getCurrentUser(
  token: string,
  options: MeRequestOptions = {},
): Promise<CurrentUserResult> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? ME_REQUEST_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[me] ${detail}`);

    return createFailure("failed", null, USER_LOAD_ERROR_MESSAGE);
  }

  try {
    const response = await fetchImpl(`${baseUrl}${ME_ENDPOINT_PATH}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
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

    return parseCurrentUserResponse(response.status, body);
  } catch {
    return createFailure("failed", null, USER_LOAD_ERROR_MESSAGE);
  }
}
