import { getApiBaseUrl } from "./config.ts";
import {
  REGISTER_FORM_FIELDS,
  type FieldErrors,
  type RegisterApiFailure,
  type RegisterApiResult,
  type RegisterApiSuccess,
  type RegisterField,
  type RegisterPayload,
} from "../validation/register.ts";

export const REGISTER_REQUEST_TIMEOUT_MS = 10_000;
export const REGISTER_ENDPOINT_PATH = "/api/auth/register";

export interface RegisterRequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const FALLBACK_SUCCESS_MESSAGE = "";
const FALLBACK_ERROR_MESSAGE = "No se pudo completar el registro.";
const INVALID_RESPONSE_MESSAGE =
  "La respuesta del servicio no tiene el formato esperado.";
const CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";
const TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";
const API_NOT_CONFIGURED_MESSAGE =
  "El servicio de registro no está disponible en este momento. Intentá nuevamente.";

export function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

export function getApiMessage(
  body: unknown,
  fallback: string = FALLBACK_ERROR_MESSAGE,
): string {
  if (
    isRecord(body) &&
    typeof body.message === "string" &&
    body.message.trim()
  ) {
    return body.message;
  }

  return fallback;
}

function isRegisterField(value: string): value is RegisterField {
  return REGISTER_FORM_FIELDS.some((field) => field === value);
}

interface ExtractedErrors {
  fieldErrors: FieldErrors;
  generalErrors: string[];
}

function extractErrors(
  value: unknown,
  mapKnownFields: boolean,
): ExtractedErrors {
  const fieldErrors: FieldErrors = {};
  const generalErrors: string[] = [];

  if (isRecord(value)) {
    for (const [key, rawMessages] of Object.entries(value)) {
      const messages = toStringArray(rawMessages);

      if (mapKnownFields && isRegisterField(key) && messages.length > 0) {
        fieldErrors[key] = messages[0];
      } else {
        generalErrors.push(...messages);
      }
    }

    return { fieldErrors, generalErrors };
  }

  generalErrors.push(...toStringArray(value));
  return { fieldErrors, generalErrors };
}

export function mapApiErrorsToFieldErrors(
  value: unknown,
): FieldErrors {
  return extractErrors(value, true).fieldErrors;
}

function createFailure(
  status: number | null,
  message: string,
  errors: string[],
  fieldErrors: FieldErrors,
): RegisterApiFailure {
  return {
    ok: false,
    status,
    message,
    errors,
    fieldErrors,
  };
}

export function parseRegisterResponse(
  status: number,
  body: unknown,
): RegisterApiResult {
  if (!isRecord(body)) {
    return createFailure(
      status,
      INVALID_RESPONSE_MESSAGE,
      [],
      {},
    );
  }

  const message = getApiMessage(body, FALLBACK_ERROR_MESSAGE);
  const errors = extractErrors(body.errors, status === 422 || (status >= 200 && status < 300));
  const isSuccessfulStatus = status >= 200 && status < 300;

  if (isSuccessfulStatus && errors.generalErrors.length === 0 && Object.keys(errors.fieldErrors).length === 0) {
    const success: RegisterApiSuccess = {
      ok: true,
      data: "data" in body ? body.data : null,
      message: getApiMessage(body, FALLBACK_SUCCESS_MESSAGE),
      errors: [],
    };

    return success;
  }

  return createFailure(
    status,
    message,
    errors.generalErrors,
    errors.fieldErrors,
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

export async function registerUser(
  payload: RegisterPayload,
  options: RegisterRequestOptions = {},
): Promise<RegisterApiResult> {
  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? REGISTER_REQUEST_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[register] ${detail}`);

    return createFailure(null, API_NOT_CONFIGURED_MESSAGE, [], {});
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}${REGISTER_ENDPOINT_PATH}`,
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
        response.status,
        INVALID_RESPONSE_MESSAGE,
        [],
        {},
      );
    }

    return parseRegisterResponse(response.status, body);
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return createFailure(
      null,
      isTimeout ? TIMEOUT_ERROR_MESSAGE : CONNECTION_ERROR_MESSAGE,
      [],
      {},
    );
  }
}
