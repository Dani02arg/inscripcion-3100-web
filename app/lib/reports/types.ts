import type { UserRole } from "../auth/types.ts";

/** Roles con acceso al módulo de reportes. */
export type ReportsAccessRole = Extract<
  UserRole,
  "ADMINISTRATIVO" | "ADMINISTRADOR"
>;

/** Tipo de reporte disponible en el módulo. */
export type ReportType = "enrolled-students" | "staff";

/** Valor centinela de "Todos/Todas": criterio no aplicado (ausencia de restricción). */
export type AllFilterValue = "ALL";

/** Valores admitidos por el servicio para turno del listado de alumnos inscriptos. */
export type EnrolledStudentsShiftApiValue = "morning" | "afternoon" | "night";

/** Valores admitidos por el servicio para especialidad del listado de alumnos inscriptos. */
export type EnrolledStudentsSpecialityApiValue =
  | "basic"
  | "informatics"
  | "electronics";

/** Año de estudio admitido (1 a 6). */
export type StudyYearValue = 1 | 2 | 3 | 4 | 5 | 6;

/** Valor de año de estudio en controles de UI (cadena "1" a "6"). */
export type StudyYearInputValue = "1" | "2" | "3" | "4" | "5" | "6";

/** Entrada de año lectivo (texto en UI); "ALL" representa «Todos». */
export type YearLectiveInput = string | AllFilterValue;

/** Entradas de filtros del listado de alumnos inscriptos (estado de controles). */
export interface EnrolledStudentsFilterInputs {
  readonly year: YearLectiveInput;
  readonly studyYear: StudyYearInputValue | AllFilterValue;
  readonly shift: EnrolledStudentsShiftApiValue | AllFilterValue;
  readonly speciality: EnrolledStudentsSpecialityApiValue | AllFilterValue;
}

/** Filtros aplicados confirmados para generar vista previa/artefacto del listado. */
export interface EnrolledStudentsAppliedFilters {
  readonly year: number | null;
  readonly studyYear: StudyYearValue | null;
  readonly shift: EnrolledStudentsShiftApiValue | null;
  readonly speciality: EnrolledStudentsSpecialityApiValue | null;
}

/** Estado de un criterio de filtro (R1). */
export type FilterCriterionState =
  | { readonly status: "valid" }
  | {
      readonly status: "informative-no-options";
      readonly message: string;
    }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "indeterminate"; readonly message: string };

/** Estado de validez de los filtros del listado. */
export interface EnrolledStudentsFiltersState {
  readonly year: FilterCriterionState;
  readonly studyYear: FilterCriterionState;
  readonly shift: FilterCriterionState;
  readonly speciality: FilterCriterionState;
}

/** Claves de filtro del listado de alumnos inscriptos. */
export type EnrolledStudentsFilterKey = keyof EnrolledStudentsFiltersState;

/** Errores de validación de filtros (asociados a criterio o generales). */
export interface EnrolledStudentsFilterErrors {
  readonly fieldErrors: Readonly<
    Partial<Record<EnrolledStudentsFilterKey, string>>
  >;
  readonly generalMessage: string | null;
}

/** Opción seleccionable de un filtro. */
export interface FilterOption<T extends string | number> {
  readonly value: T | AllFilterValue;
  readonly label: string;
}

/** Disponibilidad de opciones específicas por criterio (año lectivo dinámico). */
export interface EnrolledStudentsFilterOptions {
  readonly years: readonly FilterOption<number>[];
  readonly studyYears: readonly FilterOption<StudyYearInputValue>[];
  readonly shifts: readonly FilterOption<EnrolledStudentsShiftApiValue>[];
  readonly specialities: readonly FilterOption<EnrolledStudentsSpecialityApiValue>[];
}

/** Columnas del listado de alumnos inscriptos, en el orden del servicio. */
export type EnrolledStudentsColumn =
  | "Nombre"
  | "Apellido"
  | "DNI"
  | "CUIL"
  | "Fecha de nacimiento"
  | "Domicilio"
  | "Año lectivo"
  | "Año de estudio"
  | "División"
  | "Turno"
  | "Carrera"
  | "Nombre del tutor"
  | "Apellido del tutor"
  | "DNI del tutor"
  | "CUIL del tutor"
  | "Email del tutor"
  | "Teléfono del tutor";

/** Fila de la vista previa tabular del listado (celdas en orden de columnas). */
export type EnrolledStudentsPreviewRow = readonly string[];

/** Vista previa tabular del listado de alumnos inscriptos. */
export interface EnrolledStudentsPreviewData {
  readonly columns: readonly EnrolledStudentsColumn[];
  readonly rows: readonly EnrolledStudentsPreviewRow[];
  readonly totalRows: number;
  readonly visibleRows: number;
  readonly hasMoreThanVisible: boolean;
  readonly isEmpty: boolean;
}

/** Columnas del padrón de personal, en el orden del servicio. */
export type StaffColumn =
  | "Apellido"
  | "Nombre"
  | "Email"
  | "DNI"
  | "Rol"
  | "Fecha de alta"
  | "Última modificación";

/** Metadatos del artefacto generado para preview/descarga. */
export interface ReportArtifact {
  readonly base64: string;
  readonly contentType: string;
  readonly filename: string;
  readonly byteLength: number;
}

/** Clasificación de fallo en generación/obtención/descarga. */
export type ReportFailureKind =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "timeout"
  | "network"
  | "invalid-artifact"
  | "failed";

/** Error de reporte con mensaje y clasificación. */
export interface ReportFailure {
  readonly ok: false;
  readonly kind: ReportFailureKind;
  readonly status: number | null;
  readonly message: string;
  readonly fieldErrors?: Readonly<
    Partial<Record<EnrolledStudentsFilterKey, string>>
  >;
}

/** Resultado exitoso de generación del listado de alumnos inscriptos. */
export interface EnrolledStudentsGenerateSuccess {
  readonly ok: true;
  readonly artifact: ReportArtifact;
  readonly preview: EnrolledStudentsPreviewData;
  readonly appliedFilters: EnrolledStudentsAppliedFilters;
}

/** Resultado de generación del listado de alumnos inscriptos. */
export type EnrolledStudentsGenerateResult =
  | EnrolledStudentsGenerateSuccess
  | ReportFailure;

/** Resultado exitoso de generación del padrón de personal. */
export interface StaffGenerateSuccess {
  readonly ok: true;
  readonly artifact: ReportArtifact;
}

/** Resultado de generación del padrón de personal. */
export type StaffGenerateResult = StaffGenerateSuccess | ReportFailure;

/** Estado de la vista previa del listado de alumnos inscriptos. */
export type EnrolledStudentsPreviewStatus =
  | { readonly status: "initial" }
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly artifact: ReportArtifact;
      readonly preview: EnrolledStudentsPreviewData;
      readonly appliedFilters: EnrolledStudentsAppliedFilters;
    }
  | {
      readonly status: "empty";
      readonly artifact: ReportArtifact;
      readonly preview: EnrolledStudentsPreviewData;
      readonly appliedFilters: EnrolledStudentsAppliedFilters;
    }
  | {
      readonly status: "error";
      readonly message: string;
      readonly kind: ReportFailureKind;
      readonly fieldErrors?: Readonly<
        Partial<Record<EnrolledStudentsFilterKey, string>>
      >;
    };

/** Estado de la vista previa del padrón de personal. */
export type StaffPreviewStatus =
  | { readonly status: "initial" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly artifact: ReportArtifact }
  | {
      readonly status: "visualization-error";
      readonly artifact: ReportArtifact;
      readonly message: string;
    }
  | {
      readonly status: "error";
      readonly message: string;
      readonly kind: ReportFailureKind;
    };

/** Estado de una acción de descarga. */
export type DownloadStatus =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success" }
  | { readonly status: "error"; readonly message: string };
