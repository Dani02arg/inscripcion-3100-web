/** Género admitido por el servicio. */
export type Gender = "Masculino" | "Femenino" | "Otro";

/** Alumno tal como lo devuelve el servicio. */
export interface Student {
  readonly id: string;
  readonly studentDni: string;
  readonly studentCuil: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly studentEmail: string | null;
  readonly studentPhone: string | null;
  readonly birthdate: string;
  readonly gender: Gender;
  readonly birthplace: string | null;
  readonly address: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/** Tutor responsable de un alumno. */
export interface StudentTutor {
  readonly name: string;
  readonly lastname: string;
  readonly email: string;
  readonly user_phone: string | null;
}

/** Filtros del padrón; DNI y CUIL se comparan de forma exacta. */
export interface StudentFilters {
  readonly studentDni: string;
  readonly studentCuil: string;
  readonly firstName: string;
  readonly lastName: string;
}

/** Metadatos de paginación informados por el servicio. */
export interface StudentListMeta {
  readonly currentPage: number;
  readonly lastPage: number;
  readonly perPage: number;
  readonly total: number;
}

/** Página visible del listado general. */
export interface StudentPage {
  readonly items: readonly Student[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly from: number;
  readonly to: number;
}

/** Clasificación de un fallo de lectura. */
export type StudentFailureKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "failed";

export interface StudentFailure {
  readonly ok: false;
  readonly kind: StudentFailureKind;
  readonly status: number | null;
  readonly message: string;
}

export interface StudentListSuccess {
  readonly ok: true;
  readonly students: readonly Student[];
  readonly meta: StudentListMeta;
  readonly message: string;
}

export type StudentListResult = StudentListSuccess | StudentFailure;

export interface StudentSuccess {
  readonly ok: true;
  readonly student: Student;
  readonly message: string;
}

export type StudentResult = StudentSuccess | StudentFailure;

export interface StudentTutorSuccess {
  readonly ok: true;
  readonly tutor: StudentTutor;
  readonly message: string;
}

export type StudentTutorResult = StudentTutorSuccess | StudentFailure;

/** Clasificación de un fallo de escritura. */
export type StudentActionFailureKind =
  | StudentFailureKind
  | "validation";

export interface StudentActionFailure {
  readonly ok: false;
  readonly kind: StudentActionFailureKind;
  readonly status: number | null;
  readonly message: string;
  readonly fieldErrors?: Record<string, string>;
}

export interface StudentActionSuccess {
  readonly ok: true;
  readonly message: string;
  readonly student?: Student;
}

export type StudentActionResult =
  | StudentActionSuccess
  | StudentActionFailure;

/** Aviso interno de una operación; no es una notificación a terceros. */
export interface StudentNotice {
  readonly kind: "success" | "error" | "info";
  readonly message: string;
}

/**
 * Estado del listado. El tutor no pagina, por eso `page` puede ser nulo;
 * `no_results` solo aplica al padrón con filtros activos.
 */
export type StudentListState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly students: readonly Student[];
      readonly page: StudentPage | null;
    }
  | { readonly status: "empty"; readonly page: StudentPage | null }
  | { readonly status: "no_results"; readonly page: StudentPage }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado del detalle; el tutor no recibe datos del tutor responsable. */
export type StudentDetailState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly student: Student;
      readonly tutor: StudentTutor | null;
    }
  | { readonly status: "not_found" }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado de una escritura para diálogos y avisos. */
export type StudentActionState =
  | { readonly status: "idle" }
  | {
      readonly status: "success";
      readonly message: string;
      readonly student?: Student;
    }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: Readonly<Record<string, string>>;
    }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "not_found"; readonly message: string }
  | { readonly status: "error"; readonly message: string };
