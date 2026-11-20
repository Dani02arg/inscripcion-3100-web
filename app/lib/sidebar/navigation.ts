import { isKnownRole } from "../auth/session.ts";
import type { UserRole } from "../auth/types.ts";
import type {
  SidebarMatchMode,
  SidebarIconKey,
  SidebarNavChild,
  SidebarNavItem,
  SidebarNavItemState,
} from "./types.ts";

export const PROFILE_PATH = "/dashboard/profile";
export const ACCOUNT_PATH = "/dashboard/account";
export const NOTIFICATIONS_PATH = "/dashboard/notifications";

/** Inicio está habilitado para todos los roles. */
const HOME_ITEM: SidebarNavItem = Object.freeze({
  label: "Inicio",
  icon: "home",
  href: "/dashboard",
  enabled: true,
  match: "exact",
});

/** Cursos está habilitado para administrativos y administradores. */
const COURSES_ITEM: SidebarNavItem = Object.freeze({
  label: "Cursos",
  icon: "courses",
  href: "/dashboard/courses",
  enabled: true,
  match: "prefix",
});

/** Notificaciones está habilitado para los tres roles. */
const NOTIFICATIONS_ITEM: SidebarNavItem = Object.freeze({
  label: "Notificaciones",
  icon: "notification",
  href: NOTIFICATIONS_PATH,
  enabled: true,
  match: "prefix",
});

/** Mis hijos está habilitado para el tutor. */
const TUTOR_STUDENTS_ITEM: SidebarNavItem = Object.freeze({
  label: "Mis hijos",
  icon: "students",
  href: "/dashboard/students",
  enabled: true,
  match: "prefix",
});

/** Alumnos está habilitado para administrativos y administradores. */
const ADMIN_STUDENTS_ITEM: SidebarNavItem = Object.freeze({
  label: "Alumnos",
  icon: "students",
  href: "/dashboard/students",
  enabled: true,
  match: "prefix",
});

/** Inscripciones está habilitado para administrativos y administradores. */
const ADMIN_INSCRIPTIONS_ITEM: SidebarNavItem = Object.freeze({
  label: "Inscripciones",
  icon: "inscriptions",
  href: "/dashboard/registrations",
  enabled: true,
  match: "prefix",
});

/** Reportes está habilitado para administrativos y administradores. */
const REPORTS_ITEM: SidebarNavItem = Object.freeze({
  label: "Reportes",
  icon: "reports",
  href: "/dashboard/reports",
  enabled: true,
  match: "prefix",
});

/** Opciones del directorio de personal. */
const USERS_CHILDREN: readonly SidebarNavChild[] = Object.freeze([
  Object.freeze({
    label: "Padrón de usuarios",
    icon: "users",
    href: "/dashboard/users",
    enabled: true,
    match: "prefix",
  }),
  Object.freeze({
    label: "Directorio de staff",
    icon: "staff",
    href: "/dashboard/users/staff",
    enabled: true,
    match: "prefix",
  }),
]);

/** Sección de gestión de usuarios para roles administrativos. */
const USERS_SECTION: SidebarNavItem = Object.freeze({
  label: "Gestión de usuarios",
  icon: "users",
  href: null,
  enabled: true,
  match: "prefix",
  children: USERS_CHILDREN,
});

/** Mi perfil está al final de la lista y disponible para los tres roles. */
const PROFILE_ITEM: SidebarNavItem = Object.freeze({
  label: "Mi perfil",
  icon: "profile",
  href: PROFILE_PATH,
  enabled: true,
  match: "prefix",
});

/** Opción visible cuyo módulo todavía no existe. */
function unavailable(
  label: string,
  icon: SidebarIconKey,
): SidebarNavItem {
  return Object.freeze({
    label,
    icon,
    href: null,
    enabled: false,
    match: "prefix",
  });
}

/**
 * Inventario de opciones por rol, en el orden de presentación de las specs
 * 009, 011 y 012. Los valores de rol son datos del backend.
 */
export const SIDEBAR_NAVIGATION: Readonly<
  Record<UserRole, readonly SidebarNavItem[]>
> = Object.freeze({
  TUTOR: Object.freeze([
    HOME_ITEM,
    NOTIFICATIONS_ITEM,
    TUTOR_STUDENTS_ITEM,
    unavailable("Inscripciones", "inscriptions"),
    PROFILE_ITEM,
  ]),
  ADMINISTRATIVO: Object.freeze([
    HOME_ITEM,
    NOTIFICATIONS_ITEM,
    ADMIN_STUDENTS_ITEM,
    COURSES_ITEM,
    ADMIN_INSCRIPTIONS_ITEM,
    USERS_SECTION,
    REPORTS_ITEM,
    PROFILE_ITEM,
  ]),
  ADMINISTRADOR: Object.freeze([
    HOME_ITEM,
    NOTIFICATIONS_ITEM,
    ADMIN_STUDENTS_ITEM,
    COURSES_ITEM,
    ADMIN_INSCRIPTIONS_ITEM,
    USERS_SECTION,
    REPORTS_ITEM,
    PROFILE_ITEM,
  ]),
});

/** Devuelve la lista del rol; un rol no reconocido no recibe opciones. */
export function getRoleNavigation(role: unknown): readonly SidebarNavItem[] {
  if (!isKnownRole(role)) {
    return [];
  }

  return SIDEBAR_NAVIGATION[role];
}

/**
 * Normaliza una ruta: descarta query y fragmento, asegura la barra inicial
 * y elimina las barras finales salvo en la raíz.
 */
export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? "";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

/** Compara un destino con la ruta actual según el modo de coincidencia. */
export function isHrefActive(
  href: string | null,
  pathname: string,
  match: SidebarMatchMode = "exact",
): boolean {
  if (href === null) {
    return false;
  }

  const normalizedHref = normalizePathname(href);
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === normalizedHref) {
    return true;
  }

  if (match === "prefix") {
    return normalizedPathname.startsWith(`${normalizedHref}/`);
  }

  return false;
}

/** Sección con hijos obligatorios. */
export type SidebarNavSection = SidebarNavItem & {
  readonly children: readonly SidebarNavChild[];
};

/** Indica si la opción es una sección con hijos. */
export function isSectionItem(
  item: SidebarNavItem,
): item is SidebarNavSection {
  return item.children !== undefined && item.children.length > 0;
}

/** Devuelve el hijo activo de una sección, si existe. */
export function getActiveChild(
  item: SidebarNavItem,
  pathname: string,
): SidebarNavChild | null {
  if (!item.children) {
    return null;
  }

  let active: SidebarNavChild | null = null;

  for (const child of item.children) {
    if (!child.enabled) {
      continue;
    }

    if (!isHrefActive(child.href, pathname, child.match)) {
      continue;
    }

    if (active === null || child.href.length > active.href.length) {
      active = child;
    }
  }

  return active;
}

/** Estado de la opción para la ruta actual; no disponible prevalece. */
export function getNavigationItemState(
  item: SidebarNavItem,
  pathname: string,
): SidebarNavItemState {
  if (!item.enabled) {
    return "unavailable";
  }

  if (isSectionItem(item)) {
    return getActiveChild(item, pathname) ? "active" : "inactive";
  }

  return isHrefActive(item.href, pathname, item.match) ? "active" : "inactive";
}
