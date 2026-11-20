import type {
  AllFilterValue,
  EnrolledStudentsColumn,
  EnrolledStudentsFilterInputs,
  EnrolledStudentsShiftApiValue,
  EnrolledStudentsSpecialityApiValue,
  FilterOption,
  StaffColumn,
  StudyYearInputValue,
} from "./types.ts";

/** Límite de filas visibles en la vista previa reducida del listado. */
export const PREVIEW_ROW_LIMIT = 20 as const;

/** Mensaje de estado vacío del listado de alumnos inscriptos (verificable). */
export const EMPTY_ENROLLED_STUDENTS_MESSAGE =
  "No se encontraron alumnos inscriptos para los filtros aplicados." as const;

/** Mensaje informativo cuando un criterio no tiene opciones específicas (R1). */
export const NO_SPECIFIC_OPTIONS_MESSAGE =
  "No hay opciones disponibles para este criterio." as const;

/** Valor centinela para «Todos/Todas» (ausencia de restricción). */
export const ALL_FILTER_VALUE: AllFilterValue = "ALL";

/** Etiqueta de la opción «Todos». */
export const ALL_OPTION_LABEL = "Todos" as const;

/** Etiqueta de la opción «Todas». */
export const ALL_OPTION_LABEL_FEMININE = "Todas" as const;

/** Columnas del listado de alumnos inscriptos en el orden del servicio (17). */
export const ENROLLED_STUDENTS_COLUMNS = Object.freeze([
  "Nombre",
  "Apellido",
  "DNI",
  "CUIL",
  "Fecha de nacimiento",
  "Domicilio",
  "Año lectivo",
  "Año de estudio",
  "División",
  "Turno",
  "Carrera",
  "Nombre del tutor",
  "Apellido del tutor",
  "DNI del tutor",
  "CUIL del tutor",
  "Email del tutor",
  "Teléfono del tutor",
] as const satisfies readonly EnrolledStudentsColumn[]);

/** Columnas del padrón de personal en el orden del servicio (7). */
export const STAFF_COLUMNS = Object.freeze([
  "Apellido",
  "Nombre",
  "Email",
  "DNI",
  "Rol",
  "Fecha de alta",
  "Última modificación",
] as const satisfies readonly StaffColumn[]);

/** Opciones fijas de año de estudio (1 a 6) con «Todos». */
export const STUDY_YEAR_OPTIONS = Object.freeze([
  { value: ALL_FILTER_VALUE, label: ALL_OPTION_LABEL },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
] as const satisfies readonly FilterOption<StudyYearInputValue>[]);

/** Opciones fijas de turno con etiquetas en español y «Todos». */
export const SHIFT_OPTIONS = Object.freeze([
  { value: ALL_FILTER_VALUE, label: ALL_OPTION_LABEL },
  { value: "morning", label: "Mañana" },
  { value: "afternoon", label: "Tarde" },
  { value: "night", label: "Noche" },
] as const satisfies readonly FilterOption<EnrolledStudentsShiftApiValue>[]);

/** Opciones fijas de especialidad con etiquetas en español y «Todas». */
export const SPECIALITY_OPTIONS = Object.freeze([
  { value: ALL_FILTER_VALUE, label: ALL_OPTION_LABEL_FEMININE },
  { value: "basic", label: "Básica" },
  { value: "informatics", label: "Informática" },
  { value: "electronics", label: "Electrónica" },
] as const satisfies readonly FilterOption<EnrolledStudentsSpecialityApiValue>[]);

/** Etiquetas de tipos de reporte. */
export const REPORT_TYPE_LABELS = Object.freeze({
  "enrolled-students": "Listado de alumnos inscriptos",
  staff: "Padrón de personal",
} as const);

/** Texto de reintento. */
export const RETRY_LABEL = "Reintentar" as const;

/** Texto del botón de búsqueda/generación de vista previa. */
export const GENERATE_PREVIEW_LABEL = "Generar vista previa" as const;

/** Texto de acción limpiar filtros. */
export const CLEAR_FILTERS_LABEL = "Limpiar filtros" as const;

/** Texto de acción descargar. */
export const DOWNLOAD_LABEL = "Descargar" as const;

/** Texto informativo cuando hay más resultados que los visibles. */
export const MORE_DETAILS_MESSAGE =
  "Para ver más detalles, descargue el documento." as const;

/** Mensajes de error/estado base. */
export const REPORT_SESSION_EXPIRED_MESSAGE =
  "Su sesión ha expirado, vuelva a iniciar sesión." as const;

export const REPORT_ACCESS_DENIED_MESSAGE =
  "No tiene permisos para realizar esta acción." as const;

export const REPORT_GENERIC_ERROR_MESSAGE =
  "Ocurrió un error al procesar el reporte. Intentá nuevamente." as const;

export const REPORT_TIMEOUT_ERROR_MESSAGE =
  "La solicitud tardó demasiado. Intentá nuevamente." as const;

export const REPORT_NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servicio. Intentá nuevamente." as const;

export const REPORT_VISUALIZATION_ERROR_MESSAGE =
  "No se pudo mostrar la vista previa del documento." as const;

export const REPORT_INVALID_ARTIFACT_MESSAGE =
  "No se recibió un archivo válido del reporte." as const;

/** Entradas iniciales de filtros (todos en «Todos/Todas»). */
export const INITIAL_ENROLLED_STUDENTS_FILTER_INPUTS: EnrolledStudentsFilterInputs =
  Object.freeze({
    year: ALL_FILTER_VALUE,
    studyYear: ALL_FILTER_VALUE,
    shift: ALL_FILTER_VALUE,
    speciality: ALL_FILTER_VALUE,
  });
