/** Nombre de la cookie que recuerda la preferencia de colapso. */
export const SIDEBAR_COLLAPSE_COOKIE_NAME = "sidebar_collapsed";

/** Vigencia de un año, en segundos. */
export const COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Valor colapsado. */
const COLLAPSED_VALUE = "1";

/** Valor expandido. */
const EXPANDED_VALUE = "0";

/**
 * Interpreta la preferencia: solo «1» significa colapsado.
 * Ausente, vacío o inválido significa expandido.
 */
export function parseCollapsePreference(
  value: string | null | undefined,
): boolean {
  return value === COLLAPSED_VALUE;
}

/** Serializa la preferencia con los únicos valores admitidos. */
export function serializeCollapsePreference(collapsed: boolean): string {
  return collapsed ? COLLAPSED_VALUE : EXPANDED_VALUE;
}
