import { getApiBaseUrl } from "./config.ts";
import { getApiMessage, isRecord, toStringArray } from "./auth.ts";
import { decodeSessionToken, isSessionExpired } from "../auth/session.ts";
import type { LoginSessionData } from "../auth/types.ts";
import type { LoginFieldErrors, LoginPayload } from "../validation/login.ts";

export const LOGIN_REQUEST_TIMEOUT_MS = 10_000;
export const LOGIN_ENDPOINT_PATH = "/api/auth/login";

const FALLBACK_SUCCESS_MESSAGE = "";
const FALLBACK_ERROR_MESSAGE = "No se pudo iniciar sesión.";
const INVALID_RESPONSE_MESSAGE =
  "La respuesta del servicio no tiene el formato esperado.";
const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";
const TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";
const API_NOT_CONFIGURED_MESSAGE =
  "El servicio de inicio de sesión no está disponible en este momento. Intentá nuevamente.";
const EMAIL_NOT_REGISTERED_MESSAGE = "El email no está registrado";
const INVALID_PASSWORD_MESSAGE = "La contraseña es incorrecta";

const EMAIL_NOT_REGISTERED_PATTERN =
  /no (est[áa] )?registrad|no existe|no encontrad|unregistered|not found|usuario no encontrado/i;
const INVALID_PASSWORD_PATTERN =
  /contrase[ñn]a.*(incorrect|inv[áa]lid)|invalid password|wrong password|credenciales incorrectas/i;

export interface LoginRequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface LoginSuccess {
  ok: true;
  status: number;
  message: string;
  data: LoginSessionData;
}

export type LoginFailureKind =
  | "email_not_registered"
  | "invalid_password"
  | "failed";

export interface LoginFailure {
  ok: false;
  kind: LoginFailureKind;
  status: number | null;
  message: string;
  errors: string[];
  fieldErrors: LoginFieldErrors;
}

export type LoginResult = LoginSuccess | LoginFailure;

interface ExtractedLoginErrors {
  fieldErrors: LoginFieldErrors;
  general: string[];
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
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

/** Separa los errores del servicio en los campos email y password y el resto. */
function extractLoginErrors(value: unknown): ExtractedLoginErrors {
  const fieldErrors: LoginFieldErrors = {};
  const general: string[] = [];

  if (!isRecord(value)) {
    general.push(...toStringArray(value));
    return { fieldErrors, general };
  }

  for (const [key, rawMessages] of Object.entries(value)) {
    const messages = toStringArray(rawMessages);

    if ((key === "email" || key === "password") && messages.length > 0) {
      fieldErrors[key] = messages[0];
    } else {
      general.push(...messages);
    }
  }

  return { fieldErrors, general };
}

function createFailure(
  kind: LoginFailureKind,
  status: number | null,
  message: string,
  errors: string[] = [],
  fieldErrors: LoginFieldErrors = {},
): LoginFailure {
  return { ok: false, kind, status, message, errors, fieldErrors };
}

function pickMessage(
  body: unknown,
  fallback: string,
  general: string[],
): string {
  const message = getApiMessage(body, "");

  if (message) {
    return message;
  }

  return general[0] ?? fallback;
}

/** Distingue email no registrado, contraseña incorrecta y fallo general. */
function classifyFailure(
  body: unknown,
  fieldErrors: LoginFieldErrors,
): LoginFailureKind {
  if (fieldErrors.email) {
    return "email_not_registered";
  }

  if (fieldErrors.password) {
    return "invalid_password";
  }

  const message = getApiMessage(body, "");

  if (EMAIL_NOT_REGISTERED_PATTERN.test(message)) {
    return "email_not_registered";
  }

  if (INVALID_PASSWORD_PATTERN.test(message)) {
    return "invalid_password";
  }

  return "failed";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUserId(value: unknown): value is string | number {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return typeof value === "number" && Number.isFinite(value);
}

/** Valida el `data` de la respuesta de login: token utilizable y usuario mínimo. */
export function parseLoginSessionData(
  value: unknown,
  now: number = Date.now(),
): LoginSessionData | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.token !== "string" || value.token.trim().length === 0) {
    return null;
  }

  const claims = decodeSessionToken(value.token);

  if (!claims || isSessionExpired(claims, now)) {
    return null;
  }

  if (!isRecord(value.user)) {
    return null;
  }

  if (!isValidUserId(value.user.id)) {
    return null;
  }

  if (!isNonEmptyString(value.user.email)) {
    return null;
  }

  return {
    token: value.token,
    user: {
      id: value.user.id,
      email: value.user.email,
    },
  };
}

/** Interpreta la respuesta del login sin exponer la contraseña. */
export function parseLoginResponse(
  status: number,
  body: unknown,
): LoginResult {
  if (!isRecord(body)) {
    return createFailure("failed", status, INVALID_RESPONSE_MESSAGE);
  }

  const { fieldErrors, general } = extractLoginErrors(body.errors);
  const isCleanResponse =
    general.length === 0 && Object.keys(fieldErrors).length === 0;

  if (isSuccessStatus(status) && isCleanResponse) {
    const data = "data" in body ? parseLoginSessionData(body.data) : null;

    if (data === null) {
      return createFailure("failed", status, INVALID_RESPONSE_MESSAGE);
    }

    return {
      ok: true,
      status,
      message: getApiMessage(body, FALLBACK_SUCCESS_MESSAGE),
      data,
    };
  }

  const kind = classifyFailure(body, fieldErrors);

  if (kind === "email_not_registered") {
    return createFailure(kind, status, EMAIL_NOT_REGISTERED_MESSAGE, general, {
      email: EMAIL_NOT_REGISTERED_MESSAGE,
    });
  }

  if (kind === "invalid_password") {
    return createFailure(kind, status, INVALID_PASSWORD_MESSAGE, general, {
      password: INVALID_PASSWORD_MESSAGE,
    });
  }

  return createFailure(
    kind,
    status,
    pickMessage(body, FALLBACK_ERROR_MESSAGE, general),
    general,
  );
}

/** Envía las credenciales al servicio de autenticación. */
export async function loginUser(
  payload: LoginPayload,
  options: LoginRequestOptions = {},
): Promise<LoginResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? LOGIN_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[login] ${detail}`);

    return createFailure("failed", null, API_NOT_CONFIGURED_MESSAGE);
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}${LOGIN_ENDPOINT_PATH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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
      return createFailure(
        "failed",
        response.status,
        INVALID_RESPONSE_MESSAGE,
      );
    }

    return parseLoginResponse(response.status, body);
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return createFailure(
      "failed",
      null,
      isTimeout ? TIMEOUT_ERROR_MESSAGE : CONNECTION_ERROR_MESSAGE,
    );
  }
}
