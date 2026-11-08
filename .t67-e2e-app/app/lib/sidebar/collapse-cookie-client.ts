import {
  COLLAPSE_COOKIE_MAX_AGE_SECONDS,
  SIDEBAR_COLLAPSE_COOKIE_NAME,
  serializeCollapsePreference,
} from "./collapse-preference.ts";

/**
 * Guarda la preferencia en una cookie no sensible.
 * No lanza si el navegador bloquea la escritura.
 */
export function writeCollapsePreference(collapsed: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  const value = serializeCollapsePreference(collapsed);
  const cookie = `${SIDEBAR_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

  try {
    document.cookie = cookie;
  } catch {
    // La preferencia es opcional: si falla, el menú queda expandido.
  }
}
