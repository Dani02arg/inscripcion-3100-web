import { getApiBaseUrl } from "./config.ts";
import { getApiMessage, isRecord, toStringArray } from "./auth.ts";
import {
  mapResetFieldErrors,
  type ResetPasswordFieldErrors,
  type ResetPasswordPayload,
} from "../validation/password-recovery.ts";

export const REQUEST_RECOVERY_ENDPOINT_PATH = "/api/auth/forgot-password";
export const RESET_PASSWORD_ENDPOINT_PATH = "/api/auth/reset-password";
export const PASSWORD_RECOVERY_REQUEST_TIMEOUT_MS = 10_000;
export const RECOVERY_TIMEOUT_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";

const FALLBACK_SUCCESS_MESSAGE =
  "Se ha enviado un código de recuperación a tu correo.";
const FALLBACK_RESET_SUCCESS_MESSAGE = "Contraseña restablecida correctamente.";
const FALLBACK_ERROR_MESSAGE =
  "No se pudo completar la operación. Intentá nuevamente.";
const INVALID_RESPONSE_MESSAGE =
  "La respuesta del servicio no tiene el formato esperado.";
const EMAIL_NOT_REGISTERED_MESSAGE =
  "El correo electrónico no está registrado.";
const INVALID_CODE_MESSAGE = "Código de recuperación inválido.";
const RECOVERY_NOT_CONFIGURED_MESSAGE =
  "El servicio de recuperación no está disponible en este momento. Intentá nuevamente.";
const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";

const EMAIL_NOT_REGISTERED_PATTERN =
  /no (est[áa] )?registrad|no existe|no encontrad|not registered|unregistered/i;
const INVALID_CODE_PATTERN =
  /c[óo]digo.*(inv[áa]lid|vencid|usad|expirad)|invalid code|expired code/i;
const RESET_ERROR_FIELDS = [
  "email",
  "code",
  "password",
  "password_confirmation",
] as const;

export interface RequestRecoveryFieldErrors {
  email?: string;
}

export interface RecoveryRequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface JsonOutcome {
  ok: true;
  status: number;
  body: unknown;
}

interface JsonFailure {
  ok: false;
  status: null;
  message: string;
}

export interface RequestRecoverySuccess {
  ok: true;
  status: number;
  message: string;
}

export type RequestRecoveryFailureKind =
  | "email_not_registered"
  | "failed";

export interface RequestRecoveryFailure {
  ok: false;
  kind: RequestRecoveryFailureKind;
  status: number | null;
  message: string;
  errors: string[];
  fieldErrors: RequestRecoveryFieldErrors;
}

export type RequestRecoveryResult =
  | RequestRecoverySuccess
  | RequestRecoveryFailure;

export interface ResetPasswordSuccess {
  ok: true;
  status: number;
  message: string;
}

export type ResetPasswordFailureKind =
  | "invalid_code"
  | "validation"
  | "email_not_registered"
  | "failed";

export interface ResetPasswordFailure {
  ok: false;
  kind: ResetPasswordFailureKind;
  status: number | null;
  message: string;
  errors: string[];
  fieldErrors: ResetPasswordFieldErrors;
}

export type ResetPasswordResult =
  | ResetPasswordSuccess
  | ResetPasswordFailure;

interface ExtractedRequestErrors {
  fieldErrors: RequestRecoveryFieldErrors;
  general: string[];
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/** Separa el error de correo del resto de mensajes del servicio. */
function extractRequestErrors(value: unknown): ExtractedRequestErrors {
  const fieldErrors: RequestRecoveryFieldErrors = {};
  const general: string[] = [];

  if (!isRecord(value)) {
    general.push(...toStringArray(value));
    return { fieldErrors, general };
  }

  for (const [key, rawMessages] of Object.entries(value)) {
    const messages = toStringArray(rawMessages);

    general.push(...messages);

    if (key === "email" && messages.length > 0) {
      fieldErrors.email = messages[0];
    }
  }

  return { fieldErrors, general };
}

function isEmailNotRegistered(message: string | undefined): boolean {
  return typeof message === "string" && EMAIL_NOT_REGISTERED_PATTERN.test(message);
}

function createFailure(
  kind: RequestRecoveryFailureKind,
  status: number | null,
  message: string,
  errors: string[] = [],
  fieldErrors: RequestRecoveryFieldErrors = {},
): RequestRecoveryFailure {
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

/** Interpreta la respuesta de la solicitud de código de recuperación. */
export function parseRequestRecoveryResponse(
  status: number,
  body: unknown,
): RequestRecoveryResult {
  if (!isRecord(body)) {
    return createFailure("failed", status, INVALID_RESPONSE_MESSAGE);
  }

  const { fieldErrors, general } = extractRequestErrors(body.errors);
  const successful =
    isSuccessStatus(status) &&
    general.length === 0 &&
    Object.keys(fieldErrors).length === 0;

  if (successful) {
    return {
      ok: true,
      status,
      message: getApiMessage(body, FALLBACK_SUCCESS_MESSAGE),
    };
  }

  if (
    status === 404 ||
    (status === 422 && isEmailNotRegistered(fieldErrors.email))
  ) {
    return createFailure("email_not_registered", status, EMAIL_NOT_REGISTERED_MESSAGE, [], {
      email: EMAIL_NOT_REGISTERED_MESSAGE,
    });
  }

  return createFailure(
    "failed",
    status,
    pickMessage(body, FALLBACK_ERROR_MESSAGE, general),
    general,
  );
}

interface ExtractedResetErrors {
  fieldErrors: ResetPasswordFieldErrors;
  general: string[];
  all: string[];
}

function isResetErrorField(value: string): boolean {
  return RESET_ERROR_FIELDS.some((field) => field === value);
}

/** Separa los errores por campo de los desconocidos y conserva todos los mensajes. */
function extractResetErrors(value: unknown): ExtractedResetErrors {
  const fieldErrors = mapResetFieldErrors(value);
  const general: string[] = [];
  const all: string[] = [];

  if (!isRecord(value)) {
    const messages = toStringArray(value);
    general.push(...messages);
    all.push(...messages);
    return { fieldErrors, general, all };
  }

  for (const [key, rawMessages] of Object.entries(value)) {
    const messages = toStringArray(rawMessages);

    all.push(...messages);

    if (!isResetErrorField(key)) {
      general.push(...messages);
    }
  }

  return { fieldErrors, general, all };
}

function createResetFailure(
  kind: ResetPasswordFailureKind,
  status: number | null,
  message: string,
  errors: string[] = [],
  fieldErrors: ResetPasswordFieldErrors = {},
): ResetPasswordFailure {
  return { ok: false, kind, status, message, errors, fieldErrors };
}

/** Interpreta la respuesta del cambio de contraseña. */
export function parseResetPasswordResponse(
  status: number,
  body: unknown,
): ResetPasswordResult {
  if (!isRecord(body)) {
    return createResetFailure("failed", status, INVALID_RESPONSE_MESSAGE);
  }

  const { fieldErrors, general, all } = extractResetErrors(body.errors);
  const successful = isSuccessStatus(status) && all.length === 0;

  if (successful) {
    return {
      ok: true,
      status,
      message: getApiMessage(body, FALLBACK_RESET_SUCCESS_MESSAGE),
    };
  }

  if (
    status === 404 ||
    (status === 422 && isEmailNotRegistered(fieldErrors.email))
  ) {
    return createResetFailure(
      "email_not_registered",
      status,
      EMAIL_NOT_REGISTERED_MESSAGE,
      [],
      { email: EMAIL_NOT_REGISTERED_MESSAGE },
    );
  }

  if (status === 422) {
    const message = getApiMessage(body, "");
    const codeMessage = fieldErrors.code;

    if (
      INVALID_CODE_PATTERN.test(message) ||
      (typeof codeMessage === "string" &&
        INVALID_CODE_PATTERN.test(codeMessage))
    ) {
      return createResetFailure(
        "invalid_code",
        status,
        INVALID_CODE_MESSAGE,
      );
    }

    if (Object.keys(fieldErrors).length > 0) {
      return createResetFailure(
        "validation",
        status,
        pickMessage(body, FALLBACK_ERROR_MESSAGE, general),
        general,
        fieldErrors,
      );
    }
  }

  return createResetFailure(
    "failed",
    status,
    pickMessage(body, FALLBACK_ERROR_MESSAGE, general.length > 0 ? general : all),
    all,
  );
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

/** Envía un POST JSON y normaliza la respuesta sin lanzar por errores de red. */
async function sendJson(
  path: string,
  payload: unknown,
  options: RecoveryRequestOptions,
  logTag: string,
): Promise<JsonOutcome | JsonFailure> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? PASSWORD_RECOVERY_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] ${detail}`);

    return {
      ok: false,
      status: null,
      message: RECOVERY_NOT_CONFIGURED_MESSAGE,
    };
  }

  try {
    const response = await fetchImpl(`${baseUrl}${path}`, {
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
    });

    const text = await response.text();

    if (!text.trim()) {
      return {
        ok: true,
        status: response.status,
        body: isSuccessStatus(response.status) ? {} : null,
      };
    }

    try {
      return {
        ok: true,
        status: response.status,
        body: JSON.parse(text) as unknown,
      };
    } catch {
      return { ok: true, status: response.status, body: text };
    }
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return {
      ok: false,
      status: null,
      message: isTimeout ? RECOVERY_TIMEOUT_MESSAGE : CONNECTION_ERROR_MESSAGE,
    };
  }
}

/** Solicita un código de recuperación al correo indicado. */
export async function requestRecoveryCode(
  email: string,
  options: RecoveryRequestOptions = {},
): Promise<RequestRecoveryResult> {
  const outcome = await sendJson(
    REQUEST_RECOVERY_ENDPOINT_PATH,
    { email },
    options,
    "password-recovery",
  );

  if (!outcome.ok) {
    return createFailure("failed", null, outcome.message);
  }

  return parseRequestRecoveryResponse(outcome.status, outcome.body);
}

/** Cambia la contraseña con el código de recuperación. */
export async function resetPassword(
  payload: ResetPasswordPayload,
  options: RecoveryRequestOptions = {},
): Promise<ResetPasswordResult> {
  const outcome = await sendJson(
    RESET_PASSWORD_ENDPOINT_PATH,
    payload,
    options,
    "password-recovery",
  );

  if (!outcome.ok) {
    return createResetFailure("failed", null, outcome.message);
  }

  return parseResetPasswordResponse(outcome.status, outcome.body);
}
