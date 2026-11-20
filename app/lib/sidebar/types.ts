/** Claves de icono disponibles para las opciones del menú lateral. */
export type SidebarIconKey =
  | "home"
  | "students"
  | "courses"
  | "inscriptions"
  | "notification"
  | "users"
  | "staff"
  | "reports"
  | "profile"
  | "settings";

/** Modo de comparación entre la opción y la ruta actual. */
export type SidebarMatchMode = "exact" | "prefix";

/** Opción hija de una sección del menú lateral. */
export interface SidebarNavChild {
  /** Texto visible en español. */
  readonly label: string;
  /** Clave del icono institucional. */
  readonly icon: SidebarIconKey;
  /** Destino real de la opción. */
  readonly href: string;
  /** Indica si la opción se puede activar. */
  readonly enabled: boolean;
  /** «Inicio» exige coincidencia exacta; los módulos aceptan subpantallas. */
  readonly match: SidebarMatchMode;
}

/** Opción de navegación del menú lateral. */
export interface SidebarNavItem {
  /** Texto visible en español. */
  readonly label: string;
  /** Clave del icono institucional. */
  readonly icon: SidebarIconKey;
  /** Destino; `null` cuando la opción es una sección o el módulo no existe. */
  readonly href: string | null;
  /** Indica si la opción se puede activar en esta versión. */
  readonly enabled: boolean;
  /** «Inicio» exige coincidencia exacta; los módulos aceptan subpantallas. */
  readonly match: SidebarMatchMode;
  /** Opciones de una sección desplegable. */
  readonly children?: readonly SidebarNavChild[];
  /** Cantidad de no leídas para el badge; ausente cuando no corresponde. */
  readonly badge?: number;
}

/** Estado de una opción para una ruta determinada. */
export type SidebarNavItemState = "active" | "inactive" | "unavailable";

/** Datos listos para el pie de cuenta del menú. */
export interface SidebarAccountData {
  readonly name: string;
  readonly lastname: string;
  readonly email: string;
  /** Iniciales de dos letras; `null` cuando no hay nombre. */
  readonly initials: string | null;
  /** Nombre completo visible; puede ser vacío si solo hay correo. */
  readonly displayName: string;
  /** Rol visible en español. */
  readonly roleLabel: string;
}

/** Estado del pie de cuenta. */
export type SidebarAccountState =
  | { readonly status: "ready"; readonly data: SidebarAccountData }
  | { readonly status: "unavailable" };

/** Estado de presentación del menú lateral. */
export type SidebarMode = "expanded" | "collapsed" | "drawer";
