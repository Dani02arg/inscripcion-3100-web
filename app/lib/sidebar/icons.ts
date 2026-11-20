import type { SidebarIconKey } from "./types.ts";

/** Archivo de icono institucional para cada opción del menú. */
export const SIDEBAR_ICON_PATHS: Readonly<Record<SidebarIconKey, string>> =
  Object.freeze({
    home: "/icons/ico-home.svg",
    students: "/icons/ico-read-book.svg",
    courses: "/icons/ico-course.svg",
    inscriptions: "/icons/ico-register.svg",
    notification: "/icons/ico-bell.svg",
    users: "/icons/ico-users.svg",
    staff: "/icons/ico-staff.svg",
    reports: "/icons/ico-report.svg",
    profile: "/icons/ico-profile.svg",
    settings: "/icons/ico-settings.svg",
  });

/** Iconos nuevos que se agregan en la tarea de assets. */
export const NEW_SIDEBAR_ICON_FILES: readonly string[] = Object.freeze([
  "ico-home.svg",
  "ico-users.svg",
  "ico-staff.svg",
  "ico-report.svg",
  "ico-profile.svg",
  "ico-settings.svg",
]);

/** Devuelve la ruta pública del icono. */
export function getSidebarIconPath(icon: SidebarIconKey): string {
  return SIDEBAR_ICON_PATHS[icon];
}
