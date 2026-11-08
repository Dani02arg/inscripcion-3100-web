export type UserRole = "ADMINISTRADOR" | "ADMINISTRATIVO" | "TUTOR";

export const KNOWN_ROLES: readonly UserRole[] = [
  "ADMINISTRADOR",
  "ADMINISTRATIVO",
  "TUTOR",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRADOR: "Administrador",
  ADMINISTRATIVO: "Administrativo",
  TUTOR: "Tutor",
};

export const ROLE_SUBTITLES: Record<UserRole, string> = {
  ADMINISTRADOR:
    "Administrá la institución, los usuarios y las inscripciones desde un solo lugar.",
  ADMINISTRATIVO:
    "Gestioná las inscripciones de la institución desde un solo lugar.",
  TUTOR: "Gestioná las inscripciones de tus hijos desde un solo lugar.",
};

export const WAVE_EMOJI = "👋";

export const DASHBOARD_TITLE = "Panel principal";
export const INVALID_RESPONSE_MESSAGE =
  "La respuesta del servicio no tiene el formato esperado.";
export const SESSION_EXPIRED_MESSAGE =
  "Tu sesión expiró. Iniciá sesión nuevamente.";
export const ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a esta sección.";
export const USER_LOAD_ERROR_MESSAGE =
  "No se pudo cargar tu información. Intentá nuevamente.";
export const LOGOUT_LABEL = "Cerrar sesión";

export interface SessionClaims {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
}

export interface LoginUser {
  id: string | number;
  email: string;
}

export interface LoginSessionData {
  token: string;
  user: LoginUser;
}

export interface CurrentUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: UserRole;
  readonly userPhone?: string | null;
  readonly birthdate?: string | null;
  readonly occupation?: string | null;
  readonly educationLevel?: string | null;
  readonly emailVerifiedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}
