import type { SidebarMode } from "./types.ts";

/** Nombre oficial de la institución. */
export const INSTITUTION_FULL_NAME =
  "E.E.T. N° 3100 — República de la India";

/** Forma abreviada usada en espacios reducidos. */
export const INSTITUTION_SHORT_NAME = "E.E.T. N° 3100";

/** Logotipo existente de la barra superior; no se agrega uno nuevo. */
export const INSTITUTION_LOGO_PATH = "/logo.png";

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;
const DRAWER_MAX_WIDTH = 320;
const DRAWER_VIEWPORT_RATIO = 0.85;
const FULL_NAME_MIN_WIDTH = 1280;

/** Texto visible de la identidad según el estado y el ancho. */
export function getInstitutionLabel(
  mode: SidebarMode,
  isWide: boolean,
): string {
  if (mode === "collapsed") {
    return "";
  }

  if (mode === "drawer") {
    return INSTITUTION_SHORT_NAME;
  }

  return isWide ? INSTITUTION_FULL_NAME : INSTITUTION_SHORT_NAME;
}

/** Nombre accesible completo, siempre disponible para lectores de pantalla. */
export function getInstitutionAccessibleName(): string {
  return INSTITUTION_FULL_NAME;
}

/** Altura del logotipo: 32 px en escritorio ancho y 24 px en el resto. */
export function getLogoHeight(mode: SidebarMode, isWide: boolean): number {
  return mode === "expanded" && isWide ? 32 : 24;
}

/** Ancho base del menú para el estado indicado. */
export function getNavigationWidth(mode: SidebarMode): number {
  if (mode === "collapsed") {
    return COLLAPSED_WIDTH;
  }

  if (mode === "drawer") {
    return DRAWER_MAX_WIDTH;
  }

  return EXPANDED_WIDTH;
}

/** Ancho del drawer: el menor entre 320 px y el 85 % del viewport. */
export function getDrawerWidth(viewportWidth: number): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return DRAWER_MAX_WIDTH;
  }

  return Math.min(
    DRAWER_MAX_WIDTH,
    Math.floor(viewportWidth * DRAWER_VIEWPORT_RATIO),
  );
}

/** Ancho mínimo a partir del cual se muestra el nombre completo. */
export function isWideViewport(viewportWidth: number): boolean {
  return viewportWidth >= FULL_NAME_MIN_WIDTH;
}
