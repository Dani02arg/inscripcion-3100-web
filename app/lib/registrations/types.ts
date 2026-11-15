/** Estado del ciclo de vida de una solicitud de inscripción. */
export type RegistrationStatus =
  | "PENDING"
  | "OBSERVED"
  | "PROPOSED_REASSIGNMENT"
  | "APPROVED"
  | "REJECTED";

/** Estados documentados por el servicio, en orden de presentación. */
export const REGISTRATION_STATUSES = Object.freeze([
  "PENDING",
  "OBSERVED",
  "PROPOSED_REASSIGNMENT",
  "APPROVED",
  "REJECTED",
] as const satisfies readonly RegistrationStatus[]);

/** Valor de pestaña: «Todas» o un estado concreto. */
export type RegistrationStatusTab = "ALL" | RegistrationStatus;

/** Alumno de la inscripción tal como lo devuelve el servicio. */
export interface RegistrationStudent {
  readonly id: string;
  readonly studentCuil: string;
  readonly firstName: string;
  readonly lastName: string;
}

/** Curso embebido en la inscripción (sin capacidad). */
export interface RegistrationCourse {
  readonly id: string;
  readonly code: string;
  readonly year: number;
  readonly studyYear: number;
  readonly division: string;
  readonly cycle: string;
  readonly shift: string;
  readonly speciality: string;
}

/** Tutor responsable, obtenido de `GET /api/students/{student}/tutor`. */
export interface RegistrationTutor {
  readonly name: string;
  readonly lastname: string;
  readonly email: string;
  readonly user_phone: string | null;
}

/** Curso activo con cupo, para el selector de reasignación. */
export interface AvailableCourse {
  readonly id: string;
  readonly code: string;
  readonly year: number;
  readonly studyYear: number;
  readonly division: string;
  readonly cycle: string;
  readonly shift: string;
  readonly speciality: string;
  readonly availablePlaces: number;
}

/** Inscripción tal como la devuelve el servicio. */
export interface Registration {
  readonly id: string;
  readonly status: RegistrationStatus;
  readonly studentId: string;
  readonly idCourse: string;
  readonly proposedCourseId: string | null;
  readonly institutionOfOrigin: string | null;
  readonly relationship: string;
  readonly photoAuthorization: boolean;
  readonly healthProblem: boolean;
  readonly inclusionStudent: boolean;
  readonly contactImpediment: boolean;
  readonly legalProceedings: boolean;
  readonly hasHealthProblemCertificate: boolean;
  readonly hasInclusionStudentCertificate: boolean;
  readonly hasContactImpedimentCertificate: boolean;
  readonly hasLegalProceedingsCertificate: boolean;
  readonly reassignmentReason: string | null;
  readonly observations: string | null;
  readonly pendingSubjects: readonly string[] | null;
  readonly missingDocumentation: string | null;
  readonly student: RegistrationStudent;
  readonly course: RegistrationCourse;
  readonly proposedCourse: RegistrationCourse | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Filtros del listado; DNI y CUIL se conservan durante la pestaña. */
export interface RegistrationFilters {
  readonly studentDni: string;
  readonly studentCuil: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly year: string;
  readonly studyYear: string;
  readonly division: string;
  readonly cycle: string;
  readonly shift: string;
  readonly speciality: string;
}

/** Metadatos de paginación informados por el servicio. */
export interface RegistrationListMeta {
  readonly currentPage: number;
  readonly lastPage: number;
  readonly perPage: number;
  readonly total: number;
}

/** Página visible del listado tras paginar en el cliente. */
export interface RegistrationPage {
  readonly items: readonly Registration[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly from: number;
  readonly to: number;
}

/** Clasificación de un fallo de lectura. */
export type RegistrationFailureKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "failed";

export interface RegistrationFailure {
  readonly ok: false;
  readonly kind: RegistrationFailureKind;
  readonly status: number | null;
  readonly message: string;
}

export interface RegistrationListSuccess {
  readonly ok: true;
  readonly registrations: readonly Registration[];
  readonly meta: RegistrationListMeta;
  readonly message: string;
}

export type RegistrationListResult =
  | RegistrationListSuccess
  | RegistrationFailure;

export interface RegistrationDetailSuccess {
  readonly ok: true;
  readonly registration: Registration;
  readonly tutor: RegistrationTutor | null;
  readonly message: string;
}

export type RegistrationDetailResult =
  | RegistrationDetailSuccess
  | RegistrationFailure;

/** Clasificación de un fallo de dictamen. */
export type DictamenActionFailureKind =
  | RegistrationFailureKind
  | "validation"
  | "conflict";

export interface DictamenActionFailure {
  readonly ok: false;
  readonly kind: DictamenActionFailureKind;
  readonly status: number | null;
  readonly message: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
}

export interface DictamenActionSuccess {
  readonly ok: true;
  readonly message: string;
  readonly registration?: Registration;
}

export type DictamenActionResult =
  | DictamenActionSuccess
  | DictamenActionFailure;

/** Campos opcionales compartidos por los formularios de dictamen. */
export interface DictamenOptionalFields {
  readonly observations: string;
  readonly pendingSubjects: string;
  readonly missingDocumentation: string;
}

/** Formulario de aprobar. */
export type ApproveForm = DictamenOptionalFields;

/** Formulario de rechazar. */
export type RejectForm = DictamenOptionalFields;

/** Formulario de devolver con observaciones. */
export interface ObserveForm {
  readonly observations: string;
}

/** Formulario de reasignar. */
export interface ReassignForm extends DictamenOptionalFields {
  readonly newCourseId: string;
  readonly reassignmentReason: string;
}

/** Estado del listado; `no_results` se decide en el cliente con filtros. */
export type RegistrationListState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly registrations: readonly Registration[];
    }
  | { readonly status: "empty" }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado del detalle. */
export type RegistrationDetailState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly registration: Registration;
      readonly tutor: RegistrationTutor | null;
    }
  | { readonly status: "not_found" }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

/** Estado de un dictamen para diálogos y avisos. */
export type DictamenActionState =
  | { readonly status: "idle" }
  | { readonly status: "success"; readonly message: string }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: Readonly<Record<string, string>>;
    }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "not_found"; readonly message: string }
  | { readonly status: "conflict"; readonly message: string }
  | { readonly status: "error"; readonly message: string };
