import { getApiBaseUrl } from "./config.ts";

export const LOGOUT_ENDPOINT_PATH = "/api/auth/logout";
export const LOGOUT_REQUEST_TIMEOUT_MS = 5_000;

export interface LogoutRequestOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface LogoutResult {
  ok: boolean;
}

/** Notifica el cierre al backend como mejor esfuerzo; nunca lanza. */
export async function notifyLogout(
  token: string,
  options: LogoutRequestOptions = {},
): Promise<LogoutResult> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? LOGOUT_REQUEST_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;

  let baseUrl: string;

  try {
    baseUrl = getApiBaseUrl(options.baseUrl);
  } catch {
    return { ok: false };
  }

  try {
    await fetchImpl(`${baseUrl}${LOGOUT_ENDPOINT_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
