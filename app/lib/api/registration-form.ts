import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/types.ts";
import { isRecord } from "./auth.ts";
import { getApiBaseUrl } from "./config.ts";
import { REGISTRATIONS_ENDPOINT_PATH } from "./registrations.ts";

export const REGISTRATION_FORM_TIMEOUT_MS = 10_000;

export const REGISTRATION_FORM_NOT_FOUND_MESSAGE =
  "No se pudo generar el formulario.";
export const REGISTRATION_FORM_CONNECTION_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente.";
export const REGISTRATION_FORM_TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente.";
export const REGISTRATION_FORM_NOT_CONFIGURED_MESSAGE =
  "El servicio de inscripciones no está disponible en este momento. Intentá nuevamente.";

export interface RegistrationFormRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export interface RegistrationFormSuccess {
  readonly ok: true;
  readonly blob: Blob;
  readonly filename: string;
  readonly contentType: string;
}

export interface RegistrationFormFailure {
  readonly ok: false;
  readonly status: number | null;
  readonly message: string;
}

export type RegistrationFormResult =
  | RegistrationFormSuccess
  | RegistrationFormFailure;

function parseFilename(value: string | null): string {
  if (!value) {
    return "";
  }

  const match = /filename="?([^";]+)"?/i.exec(value);
  return match ? (match[1] ?? "") : "";
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

/** Descarga el formulario oficial en PDF; nombre desde `Content-Disposition`. */
export async function downloadRegistrationForm(
  token: string,
  registrationId: string,
  options: RegistrationFormRequestOptions = {},
): Promise<RegistrationFormResult> {
  const id = registrationId.trim();

  if (id.length === 0) {
    return {
      ok: false,
      status: null,
      message: REGISTRATION_FORM_NOT_FOUND_MESSAGE,
    };
  }

  const timeoutMs = Math.max(
    1,
    options.timeoutMs ?? REGISTRATION_FORM_TIMEOUT_MS,
  );
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[registration-form] ${detail}`);
    return {
      ok: false,
      status: null,
      message: REGISTRATION_FORM_NOT_CONFIGURED_MESSAGE,
    };
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}${REGISTRATIONS_ENDPOINT_PATH}/${encodeURIComponent(id)}/form`,
      {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    if (response.status === 401) {
      return { ok: false, status: 401, message: SESSION_EXPIRED_MESSAGE };
    }

    if (response.status === 403) {
      return { ok: false, status: 403, message: ACCESS_DENIED_MESSAGE };
    }

    if (response.status === 404) {
      return {
        ok: false,
        status: 404,
        message: REGISTRATION_FORM_NOT_FOUND_MESSAGE,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: REGISTRATION_FORM_NOT_FOUND_MESSAGE,
      };
    }

    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type") ?? "application/pdf";
    const filename = parseFilename(
      response.headers.get("Content-Disposition"),
    );

    return { ok: true, blob, filename, contentType };
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return {
      ok: false,
      status: null,
      message: isTimeout
        ? REGISTRATION_FORM_TIMEOUT_ERROR_MESSAGE
        : REGISTRATION_FORM_CONNECTION_ERROR_MESSAGE,
    };
  }
}
