import type { CurrentUser, UserRole } from "../auth/types.ts";

export type EducationLevel =
  | "PRIMARIO"
  | "SECUNDARIO"
  | "TERCIARIO"
  | "UNIVERSITARIO"
  | "POSTGRADO";

export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  "PRIMARIO",
  "SECUNDARIO",
  "TERCIARIO",
  "UNIVERSITARIO",
  "POSTGRADO",
];

/** Resumen de usuario del padrón. */
export interface UserSummary {
  readonly id: string;
  readonly role: string;
  readonly name: string;
  readonly lastname: string;
  readonly dni: string | null;
  readonly cuil: string | null;
  readonly email: string | null;
}

/** Detalle de usuario con datos de contacto, adicionales y auditoría. */
export interface UserDetail extends UserSummary {
  readonly userPhone: string | null;
  readonly occupation: string | null;
  readonly educationLevel: string | null;
  readonly birthdate: string | null;
  readonly emailVerifiedAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface UserFilters {
  readonly dni: string;
  readonly cuil: string;
  readonly name: string;
  readonly lastname: string;
  readonly email: string;
}

export type RoleFilter =
  | "all"
  | "ADMINISTRATIVO"
  | "ADMINISTRADOR";

export interface DirectoryFilters extends UserFilters {
  readonly role: RoleFilter;
}

export interface UserListMeta {
  readonly currentPage: number;
  readonly lastPage: number;
  readonly perPage: number;
  readonly total: number;
}

export interface UserPage {
  readonly items: UserSummary[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly from: number;
  readonly to: number;
}

export type UserOrigin = "users" | "staff";

export type UserField =
  | "dni"
  | "cuil"
  | "name"
  | "lastname"
  | "email"
  | "occupation"
  | "education_level"
  | "requested_role"
  | "newRole"
  | "reason";

export type UserFieldErrors = Partial<Record<UserField, string>>;

export type UserFailureKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "failed";

export interface UserFailure {
  readonly ok: false;
  readonly kind: UserFailureKind;
  readonly status: number | null;
  readonly message: string;
}

export interface UserListSuccess {
  readonly ok: true;
  readonly users: UserSummary[];
  readonly meta: UserListMeta;
  readonly message: string;
}

export type UserListResult = UserListSuccess | UserFailure;

export interface UserDetailSuccess {
  readonly ok: true;
  readonly user: UserDetail;
  readonly message: string;
}

export type UserDetailResult = UserDetailSuccess | UserFailure;

export type UserActionFailureKind =
  | UserFailureKind
  | "conflict"
  | "validation";

export interface UserActionFailure {
  readonly ok: false;
  readonly kind: UserActionFailureKind;
  readonly status: number | null;
  readonly message: string;
  readonly fieldErrors?: UserFieldErrors;
}

export interface UserActionSuccess {
  readonly ok: true;
  readonly message: string;
  readonly user?: UserDetail;
}

export type UserActionResult = UserActionSuccess | UserActionFailure;

export interface RoleChangePayload {
  readonly newRole: UserRole;
}

export interface TutorProfileInput {
  readonly occupation: string;
  readonly educationLevel: string;
}

export interface TutorProfilePayload {
  readonly occupation: string;
  readonly education_level: EducationLevel;
}

export interface RoleRequestInput {
  readonly requestedRole: string;
  readonly reason: string;
}

export interface RoleRequestPayload {
  readonly requested_role: UserRole;
  readonly reason: string;
}

export interface RoleRequestSuccess {
  readonly ok: true;
  readonly message: string;
}

export type RoleRequestResult = RoleRequestSuccess | UserActionFailure;

export interface UserNotice {
  readonly kind: "success" | "error" | "info";
  readonly message: string;
}

/** Estado de una lista paginada de usuarios. */
export type UserListState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly users: UserSummary[];
      readonly page: UserPage;
    }
  | { readonly status: "empty"; readonly page: UserPage }
  | { readonly status: "no_results"; readonly page: UserPage }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado del detalle de un usuario. */
export type UserDetailState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly user: UserDetail }
  | { readonly status: "not_found" }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado de Mi perfil. */
export type ProfileState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly user: CurrentUser }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado de Configuración de cuenta. */
export type AccountState = ProfileState;

/** Estado de una acción de usuario para diálogos y avisos. */
export type UserActionState =
  | { readonly status: "idle" }
  | { readonly status: "pending" }
  | {
      readonly status: "success";
      readonly message: string;
      readonly user?: UserDetail;
    }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: UserFieldErrors;
    }
  | { readonly status: "conflict"; readonly message: string }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "not_found"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado del formulario de perfil de tutor. */
export type TutorProfileActionState =
  | {
      readonly status: "idle";
      readonly message: string;
      readonly values?: TutorProfileInput;
    }
  | {
      readonly status: "success";
      readonly message: string;
      readonly user?: UserDetail;
      readonly values?: TutorProfileInput;
    }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: UserFieldErrors;
      readonly values: TutorProfileInput;
    }
  | {
      readonly status: "forbidden";
      readonly message: string;
      readonly values: TutorProfileInput;
    }
  | {
      readonly status: "error";
      readonly message: string;
      readonly values: TutorProfileInput;
    };

/** Estado del formulario de solicitud de cambio de rol. */
export type RoleRequestActionState =
  | {
      readonly status: "idle";
      readonly message: string;
      readonly values?: RoleRequestInput;
    }
  | {
      readonly status: "success";
      readonly message: string;
      readonly values?: RoleRequestInput;
    }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: UserFieldErrors;
      readonly values: RoleRequestInput;
    }
  | {
      readonly status: "forbidden";
      readonly message: string;
      readonly values: RoleRequestInput;
    }
  | {
      readonly status: "error";
      readonly message: string;
      readonly values?: RoleRequestInput;
    };
