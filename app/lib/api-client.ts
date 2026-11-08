import { isRecord } from "./api/auth.ts";
import { ACCESS_DENIED_MESSAGE, SESSION_EXPIRED_MESSAGE } from "./auth/types.ts";

export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "server"
  | "network"
  | "invalid_response";

export class ApiRequestError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.kind = kind;
    this.status = status;
  }
}

const VALIDATION_MESSAGE = "Errores de validación del lado del servidor";
const SERVER_MESSAGE = "Error interno del servidor";
const NETWORK_MESSAGE =
  "Error de red inesperado. Por favor, inténtelo de nuevo.";
const INVALID_RESPONSE_MESSAGE =
  "La respuesta del servicio no tiene el formato esperado.";

/**
 * Cliente HTTP autenticado centralizado: adjunta el Bearer y clasifica
 * `401`, `403`, `422` y `5xx`. Devuelve el campo `data` de la respuesta.
 */
export async function fetchAPI<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiRequestError("network", NETWORK_MESSAGE);
  }

  if (response.status === 401) {
    throw new ApiRequestError("unauthorized", SESSION_EXPIRED_MESSAGE, 401);
  }

  if (response.status === 403) {
    throw new ApiRequestError("forbidden", ACCESS_DENIED_MESSAGE, 403);
  }

  if (response.status === 422) {
    throw new ApiRequestError("validation", VALIDATION_MESSAGE, 422);
  }

  if (response.status >= 500) {
    throw new ApiRequestError("server", SERVER_MESSAGE, response.status);
  }

  if (!response.ok) {
    throw new ApiRequestError(
      "server",
      `Error ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new ApiRequestError("invalid_response", INVALID_RESPONSE_MESSAGE);
  }

  const data = isRecord(body) && "data" in body ? body.data : null;

  return data as T;
}
