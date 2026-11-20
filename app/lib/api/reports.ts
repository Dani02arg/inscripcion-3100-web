import { isRecord, toStringArray } from "./auth.ts";
import { getApiBaseUrl } from "./config.ts";
import { serializeEnrolledStudentsAppliedFilters } from "../reports/filters.ts";
import {
  REPORT_ACCESS_DENIED_MESSAGE,
  REPORT_GENERIC_ERROR_MESSAGE,
  REPORT_INVALID_ARTIFACT_MESSAGE,
  REPORT_NETWORK_ERROR_MESSAGE,
  REPORT_SESSION_EXPIRED_MESSAGE,
  REPORT_TIMEOUT_ERROR_MESSAGE,
} from "../reports/constants.ts";
import type {
  EnrolledStudentsAppliedFilters,
  EnrolledStudentsFilterKey,
  ReportArtifact,
  ReportFailure,
  ReportFailureKind,
} from "../reports/types.ts";

export const ENROLLED_STUDENTS_REPORT_ENDPOINT_PATH =
  "/api/reports/enrolled-students";
export const STAFF_REPORT_ENDPOINT_PATH = "/api/reports/staff";
export const REPORT_REQUEST_TIMEOUT_MS = 10_000;

export interface ReportRequestOptions {
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

export type ReportArtifactApiResult =
  | { readonly ok: true; readonly artifact: ReportArtifact }
  | ReportFailure;

export const REPORT_API_NOT_CONFIGURED_MESSAGE =
  "El servicio de reportes no está disponible en este momento. Intentá nuevamente.";

const KNOWN_FILTER_KEYS = new Set<EnrolledStudentsFilterKey>([
  "year",
  "studyYear",
  "shift",
  "speciality",
]);

function failure(
  kind: ReportFailureKind,
  status: number | null,
  message: string,
  fieldErrors?: Readonly<Partial<Record<EnrolledStudentsFilterKey, string>>>,
): ReportFailure {
  return {
    ok: false,
    kind,
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
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

function parseContentDispositionFilename(
  headerValue: string | null,
): string | null {
  if (!headerValue) {
    return null;
  }

  const utf8Match = headerValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"(.*)"$/, "$1"));
    } catch {
      return utf8Match[1].trim().replace(/^"(.*)"$/, "$1");
    }
  }

  const quotedMatch = headerValue.match(/filename\s*=\s*"([^"]*)"/i);
  if (quotedMatch?.[1]?.trim()) {
    return quotedMatch[1].trim();
  }

  const plainMatch = headerValue.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]?.trim()) {
    return plainMatch[1].trim().replace(/^"(.*)"$/, "$1");
  }

  return null;
}

function toBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function mapFieldErrors(
  value: unknown,
): Readonly<Partial<Record<EnrolledStudentsFilterKey, string>>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fieldErrors: Partial<Record<EnrolledStudentsFilterKey, string>> = {};

  for (const [key, rawMessages] of Object.entries(value)) {
    if (!KNOWN_FILTER_KEYS.has(key as EnrolledStudentsFilterKey)) {
      continue;
    }

    const messages = toStringArray(rawMessages);
    if (messages.length > 0) {
      fieldErrors[key as EnrolledStudentsFilterKey] = messages[0];
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function parseFailureResponse(
  response: Response,
): Promise<ReportFailure> {
  const status = response.status;
  const body = await readJsonBody(response);
  const serviceMessage =
    isRecord(body) && typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : null;

  if (status === 401) {
    return failure(
      "unauthorized",
      status,
      serviceMessage ?? REPORT_SESSION_EXPIRED_MESSAGE,
    );
  }

  if (status === 403) {
    return failure(
      "forbidden",
      status,
      serviceMessage ?? REPORT_ACCESS_DENIED_MESSAGE,
    );
  }

  if (status === 422) {
    const errors = isRecord(body) ? body.errors : undefined;
    const fieldErrors = mapFieldErrors(errors);
    return failure(
      "validation",
      status,
      serviceMessage ?? REPORT_GENERIC_ERROR_MESSAGE,
      fieldErrors,
    );
  }

  if (status >= 300 && status < 400) {
    return failure(
      "failed",
      status,
      serviceMessage ?? REPORT_GENERIC_ERROR_MESSAGE,
    );
  }

  return failure(
    "failed",
    status,
    serviceMessage ?? REPORT_GENERIC_ERROR_MESSAGE,
  );
}

async function parseArtifactResponse(
  response: Response,
  defaultFilename: string,
): Promise<ReportArtifactApiResult> {
  if (!response.ok) {
    return parseFailureResponse(response);
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "";
  const filename =
    parseContentDispositionFilename(response.headers.get("content-disposition")) ??
    defaultFilename;

  try {
    const buffer = await response.arrayBuffer();
    const byteLength = buffer.byteLength;

    if (byteLength <= 0) {
      return failure("invalid-artifact", response.status, REPORT_INVALID_ARTIFACT_MESSAGE);
    }

    const artifact: ReportArtifact = {
      base64: toBase64(buffer),
      contentType,
      filename,
      byteLength,
    };

    return { ok: true, artifact };
  } catch {
    return failure("failed", response.status, REPORT_GENERIC_ERROR_MESSAGE);
  }
}

async function requestReport(
  path: string,
  token: string,
  defaultFilename: string,
  options: ReportRequestOptions = {},
  query?: Readonly<Record<string, string>>,
): Promise<ReportArtifactApiResult> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? REPORT_REQUEST_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;
  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch {
    return failure("failed", null, REPORT_API_NOT_CONFIGURED_MESSAGE);
  }

  try {
    const url = new URL(`${baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json, application/octet-stream, */*",
      },
      credentials: "omit",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    return parseArtifactResponse(response, defaultFilename);
  } catch (error) {
    const errorName = getErrorName(error);
    const isTimeout =
      errorName === "AbortError" || errorName === "TimeoutError";

    return failure(
      isTimeout ? "timeout" : "network",
      null,
      isTimeout ? REPORT_TIMEOUT_ERROR_MESSAGE : REPORT_NETWORK_ERROR_MESSAGE,
    );
  }
}

export async function fetchEnrolledStudentsReport(
  token: string,
  filters: EnrolledStudentsAppliedFilters,
  options: ReportRequestOptions = {},
): Promise<ReportArtifactApiResult> {
  const query = serializeEnrolledStudentsAppliedFilters(filters);
  return requestReport(
    ENROLLED_STUDENTS_REPORT_ENDPOINT_PATH,
    token,
    "listado-alumnos-inscriptos.xlsx",
    options,
    query,
  );
}

export async function fetchStaffReport(
  token: string,
  options: ReportRequestOptions = {},
): Promise<ReportArtifactApiResult> {
  return requestReport(
    STAFF_REPORT_ENDPOINT_PATH,
    token,
    "padron-personal.pdf",
    options,
  );
}
