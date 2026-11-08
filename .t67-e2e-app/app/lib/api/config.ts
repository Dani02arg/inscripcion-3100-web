export const API_URL_ENV_VAR = "LARAVEL_API_URL";

/**
 * Error de configuración del API: la URL base falta o no es válida.
 * No debe llegar al navegador; el módulo que lo consume lo traduce a un aviso general.
 */
export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new ApiConfigurationError(
      `La variable de entorno ${API_URL_ENV_VAR} debe ser una URL absoluta (http:// o https://).`,
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiConfigurationError(
      `La variable de entorno ${API_URL_ENV_VAR} debe usar el esquema http o https.`,
    );
  }

  return trimmed.replace(/\/+$/, "");
}

/**
 * Devuelve la URL base del API sin barra final.
 * Prioridad: valor explícito (tests) > variable de entorno LARAVEL_API_URL.
 * Se evalúa en cada llamada para que un cambio de entorno no requiera recompilar.
 */
export function getApiBaseUrl(override?: string): string {
  const rawValue = override ?? process.env[API_URL_ENV_VAR];

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    throw new ApiConfigurationError(
      `Falta la variable de entorno ${API_URL_ENV_VAR}.`,
    );
  }

  return normalizeApiBaseUrl(rawValue);
}
