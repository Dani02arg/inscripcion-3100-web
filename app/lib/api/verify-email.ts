import { getApiBaseUrl } from "./config.ts";
import { getApiMessage, isRecord, toStringArray } from "./auth.ts";
import type { VerifyFieldErrors } from "../verification/types.ts";

export const VERIFICATION_REQUEST_TIMEOUT_MS = 10_000;
export const VERIFY_EMAIL_ENDPOINT_PATH = "/api/auth/verify-email";
export const RESEND_CODE_ENDPOINT_PATH = "/api/auth/resend-code";
export const RESEND_CODE_TYPE = "REGISTER";

const INVALID_RESPONSE_MESSAGE =
  "La respuesta del servicio no tiene el formato esperado.";
const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";
const TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";
const VERIFY_NOT_CONFIGURED_MESSAGE =
  "El servicio de verificación no está disponible en este momento. Intentá nuevamente.";
const RESEND_NOT_CONFIGURED_MESSAGE =
  "El servicio de reenvío no está disponible en este momento. Intentá nuevamente.";
const VERIFY_ERROR_MESSAGE = "No se pudo verificar el código.";
const RESEND_ERROR_MESSAGE = "No se pudo reenviar el código.";
const EXPIRED_CODE_MESSAGE = "El código venció. Pedí uno nuevo.";

const EXPIRED_CODE_PATTERN = /expirad|expir|venci|expired/i;

export interface VerifyEmailPayload {
  userId: string;
  code: string;
}

export interface VerificationRequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface VerifySuccess {
  ok: true;
  status: number;
  message: string;
}

export type VerifyFailureKind = "rejected" | "expired" | "failed";

export interface VerifyFailure {
  ok: false;
  kind: VerifyFailureKind;
  status: number | null;
  message: string;
  errors: string[];
  fieldErrors: VerifyFieldErrors;
}

export type VerifyResult = VerifySuccess | VerifyFailure;

export interface ResendSuccess {
  ok: true;
  status: number;
  message: string;
}

export type ResendFailureKind = "rejected" | "failed";

export interface ResendFailure {
  ok: false;
  kind: ResendFailureKind;
  status: number | null;
  message: string;
  errors: string[];
}

export type ResendResult = ResendSuccess | ResendFailure;

interface JsonExchange {
  status: number;
  body: unknown;
  hasBody: boolean;
  invalidBody: boolean;
}

type JsonOutcome =
  | { ok: true; exchange: JsonExchange }
  | { ok: false; status: null; message: string };

interface ExtractedVerifyErrors {
  fieldErrors: VerifyFieldErrors;
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

/** Separa los errores del servicio en el campo `code` y el resto. */
function extractVerifyErrors(value: unknown): ExtractedVerifyErrors {
  const fieldErrors: VerifyFieldErrors = {};
  const general: string[] = [];

  if (!isRecord(value)) {
    general.push(...toStringArray(value));
    return { fieldErrors, general };
  }

  for (const [key, rawMessages] of Object.entries(value)) {
    const messages = toStringArray(rawMessages);

    if (key === "code" && messages.length > 0) {
      fieldErrors.code = messages[0];
    } else {
      general.push(...messages);
    }
  }

  return { fieldErrors, general };
}

/** Aplana los errores del reenvío, sin campos propios. */
function extractResendErrors(value: unknown): string[] {
  if (!isRecord(value)) {
    return toStringArray(value);
  }

  return Object.values(value).flatMap((item) => toStringArray(item));
}

/** Indica si el servicio informó que el código venció. */
function isExpiredCode(
  body: unknown,
  fieldErrors: VerifyFieldErrors,
  general: string[],
): boolean {
  const message = getApiMessage(body, "");
  const texts = [message, fieldErrors.code ?? "", ...general];

  return texts.some((text) => EXPIRED_CODE_PATTERN.test(text));
}

/** Elige el mensaje del servicio o el primero de los errores generales. */
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

function createVerifyFailure(
  kind: VerifyFailureKind,
  status: number | null,
  message: string,
  errors: string[] = [],
  fieldErrors: VerifyFieldErrors = {},
): VerifyFailure {
  return { ok: false, kind, status, message, errors, fieldErrors };
}

function createResendFailure(
  kind: ResendFailureKind,
  status: number | null,
  message: string,
  errors: string[] = [],
): ResendFailure {
  return { ok: false, kind, status, message, errors };
}

/** Envía un POST JSON y normaliza la respuesta sin lanzar por errores de red. */
async function sendJson(
  path: string,
  payload: unknown,
  options: VerificationRequestOptions,
  logTag: string,
  notConfiguredMessage: string,
): Promise<JsonOutcome> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? VERIFICATION_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] ${detail}`);

    return { ok: false, status: null, message: notConfiguredMessage };
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
        exchange: {
          status: response.status,
          body: null,
          hasBody: false,
          invalidBody: false,
        },
      };
    }

    try {
      return {
        ok: true,
        exchange: {
          status: response.status,
          body: JSON.parse(text) as unknown,
          hasBody: true,
          invalidBody: false,
        },
      };
    } catch {
      return {
        ok: true,
        exchange: {
          status: response.status,
          body: null,
          hasBody: true,
          invalidBody: true,
        },
      };
    }
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return {
      ok: false,
      status: null,
      message: isTimeout ? TIMEOUT_ERROR_MESSAGE : CONNECTION_ERROR_MESSAGE,
    };
  }
}

/** Interpreta la respuesta de la verificación según el plan §4.2. */
function parseVerifyExchange({ status, body, hasBody, invalidBody }: JsonExchange): VerifyResult {
  if (isSuccessStatus(status)) {
    if (invalidBody) {
      return createVerifyFailure("failed", status, INVALID_RESPONSE_MESSAGE);
    }

    if (!hasBody) {
      return { ok: true, status, message: "" };
    }

    if (!isRecord(body)) {
      return createVerifyFailure("failed", status, INVALID_RESPONSE_MESSAGE);
    }

    const { fieldErrors, general } = extractVerifyErrors(body.errors);

    if (general.length === 0 && fieldErrors.code === undefined) {
      return { ok: true, status, message: getApiMessage(body, "") };
    }

    const kind = isExpiredCode(body, fieldErrors, general)
      ? "expired"
      : "rejected";

    return createVerifyFailure(
      kind,
      status,
      kind === "expired"
        ? pickMessage(body, EXPIRED_CODE_MESSAGE, general)
        : pickMessage(body, VERIFY_ERROR_MESSAGE, general),
      general,
      fieldErrors,
    );
  }

  if (status === 422) {
    if (invalidBody || !hasBody || !isRecord(body)) {
      return createVerifyFailure(
        "rejected",
        status,
        VERIFY_ERROR_MESSAGE,
      );
    }

    const { fieldErrors, general } = extractVerifyErrors(body.errors);
    const kind = isExpiredCode(body, fieldErrors, general)
      ? "expired"
      : "rejected";

    return createVerifyFailure(
      kind,
      status,
      kind === "expired"
        ? pickMessage(body, EXPIRED_CODE_MESSAGE, general)
        : pickMessage(body, VERIFY_ERROR_MESSAGE, general),
      general,
      fieldErrors,
    );
  }

  const message =
    !invalidBody && hasBody && isRecord(body)
      ? pickMessage(body, VERIFY_ERROR_MESSAGE, [])
      : VERIFY_ERROR_MESSAGE;

  return createVerifyFailure("failed", status, message);
}

/** Interpreta la respuesta del reenvío según el plan §4.3. */
function parseResendExchange({ status, body, hasBody, invalidBody }: JsonExchange): ResendResult {
  if (isSuccessStatus(status)) {
    if (invalidBody) {
      return createResendFailure("failed", status, INVALID_RESPONSE_MESSAGE);
    }

    if (!hasBody) {
      return { ok: true, status, message: "" };
    }

    if (!isRecord(body)) {
      return createResendFailure("failed", status, INVALID_RESPONSE_MESSAGE);
    }

    const errors = extractResendErrors(body.errors);

    if (errors.length > 0) {
      return createResendFailure(
        "rejected",
        status,
        pickMessage(body, RESEND_ERROR_MESSAGE, errors),
        errors,
      );
    }

    return { ok: true, status, message: getApiMessage(body, "") };
  }

  if (status === 422) {
    if (invalidBody || !hasBody || !isRecord(body)) {
      return createResendFailure("rejected", status, RESEND_ERROR_MESSAGE);
    }

    const errors = extractResendErrors(body.errors);

    return createResendFailure(
      "rejected",
      status,
      pickMessage(body, RESEND_ERROR_MESSAGE, errors),
      errors,
    );
  }

  const message =
    !invalidBody && hasBody && isRecord(body)
      ? pickMessage(body, RESEND_ERROR_MESSAGE, [])
      : RESEND_ERROR_MESSAGE;

  return createResendFailure("failed", status, message);
}

/** Verifica el código de cinco dígitos del registro pendiente. */
export async function verifyEmail(
  payload: VerifyEmailPayload,
  options: VerificationRequestOptions = {},
): Promise<VerifyResult> {
  const outcome = await sendJson(
    VERIFY_EMAIL_ENDPOINT_PATH,
    { user_id: payload.userId, code: payload.code },
    options,
    "verify-email",
    VERIFY_NOT_CONFIGURED_MESSAGE,
  );

  if (!outcome.ok) {
    return createVerifyFailure("failed", null, outcome.message);
  }

  return parseVerifyExchange(outcome.exchange);
}

/** Reenvía el código de verificación al correo del registro pendiente. */
export async function resendVerificationCode(
  email: string,
  options: VerificationRequestOptions = {},
): Promise<ResendResult> {
  const outcome = await sendJson(
    RESEND_CODE_ENDPOINT_PATH,
    { email, type: RESEND_CODE_TYPE },
    options,
    "resend-code",
    RESEND_NOT_CONFIGURED_MESSAGE,
  );

  if (!outcome.ok) {
    return createResendFailure("failed", null, outcome.message);
  }

  return parseResendExchange(outcome.exchange);
}
