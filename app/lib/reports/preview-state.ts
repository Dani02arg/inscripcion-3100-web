import { getDownloadRetryStrategy } from "./artifact.ts";
import type { DownloadRetryStrategy } from "./artifact.ts";
import type {
  EnrolledStudentsAppliedFilters,
  EnrolledStudentsFilterKey,
  EnrolledStudentsGenerateSuccess,
  EnrolledStudentsPreviewStatus,
  ReportArtifact,
  ReportFailureKind,
  StaffGenerateSuccess,
  StaffPreviewStatus,
} from "./types.ts";

/** Intención de reintento de generación del listado: mismos filtros aplicados vigentes. */
export interface EnrolledStudentsGenerationRetryIntent {
  readonly type: "generate-enrolled-students";
  readonly appliedFilters: EnrolledStudentsAppliedFilters;
}

/** Intención de reintento de generación del padrón: sin filtros. */
export interface StaffGenerationRetryIntent {
  readonly type: "generate-staff";
}

/** Resultado de reintento de descarga: reutiliza artefacto vigente o requiere regenerar. */
export type DownloadRetryIntent =
  | { readonly type: "reuse-artifact"; readonly artifact: ReportArtifact }
  | { readonly type: "regenerate" };

/** Estado inicial del listado de alumnos inscriptos. */
export function getInitialEnrolledStudentsPreviewStatus(): EnrolledStudentsPreviewStatus {
  return { status: "initial" };
}

/** Estado inicial del padrón de personal. */
export function getInitialStaffPreviewStatus(): StaffPreviewStatus {
  return { status: "initial" };
}

/** Al cambiar de reporte se descarta estado/artefacto anterior (listado). */
export function resetEnrolledStudentsPreviewOnReportChange(): EnrolledStudentsPreviewStatus {
  return getInitialEnrolledStudentsPreviewStatus();
}

/** Al cambiar de reporte se descarta estado/artefacto anterior (padrón). */
export function resetStaffPreviewOnReportChange(): StaffPreviewStatus {
  return getInitialStaffPreviewStatus();
}

/** Inicia generación del listado: estado de carga (evita interpretar datos previos como nuevos). */
export function startEnrolledStudentsGeneration(
  _current: EnrolledStudentsPreviewStatus,
): EnrolledStudentsPreviewStatus {
  return { status: "loading" };
}

/** Inicia generación del padrón: estado de carga. */
export function startStaffGeneration(
  _current: StaffPreviewStatus,
): StaffPreviewStatus {
  return { status: "loading" };
}

/**
 * Éxito de generación del listado: estado listo o vacío-válido con artefacto vigente.
 * No reutiliza artefactos obsoletos; usa exclusivamente el resultado actual.
 */
export function succeedEnrolledStudentsGeneration(
  result: EnrolledStudentsGenerateSuccess,
): EnrolledStudentsPreviewStatus {
  const isEmpty =
    result.preview.isEmpty || result.preview.totalRows === 0;

  if (isEmpty) {
    return {
      status: "empty",
      artifact: result.artifact,
      preview: result.preview,
      appliedFilters: result.appliedFilters,
    };
  }

  return {
    status: "ready",
    artifact: result.artifact,
    preview: result.preview,
    appliedFilters: result.appliedFilters,
  };
}

/** Éxito de generación del padrón: estado listo con artefacto vigente. */
export function succeedStaffGeneration(
  result: StaffGenerateSuccess,
): StaffPreviewStatus {
  return {
    status: "ready",
    artifact: result.artifact,
  };
}

/** Error de generación/obtención del listado (incl. timeout/comunicación/inesperado). */
export function failEnrolledStudentsGeneration(params: {
  readonly message: string;
  readonly kind: ReportFailureKind;
  readonly fieldErrors?: Readonly<
    Partial<Record<EnrolledStudentsFilterKey, string>>
  >;
}): EnrolledStudentsPreviewStatus {
  return {
    status: "error",
    message: params.message,
    kind: params.kind,
    ...(params.fieldErrors ? { fieldErrors: params.fieldErrors } : {}),
  };
}

/**
 * Error/timeout de auto-generación del padrón (G1): pasa a error con posibilidad
 * de reintento manual que repite la misma generación sin filtros (sin bucle automático).
 */
export function failStaffAutoGeneration(params: {
  readonly message: string;
  readonly kind: ReportFailureKind;
}): StaffPreviewStatus {
  return {
    status: "error",
    message: params.message,
    kind: params.kind,
  };
}

/** Error de generación/obtención del padrón sin artefacto válido. */
export function failStaffGeneration(params: {
  readonly message: string;
  readonly kind: ReportFailureKind;
}): StaffPreviewStatus {
  return {
    status: "error",
    message: params.message,
    kind: params.kind,
  };
}

/**
 * Fallo de visualización del padrón con artefacto válido (> 0 kB):
 * informa el problema y conserva el artefacto para descarga.
 */
export function failStaffVisualization(params: {
  readonly artifact: ReportArtifact;
  readonly message: string;
}): StaffPreviewStatus {
  return {
    status: "visualization-error",
    artifact: params.artifact,
    message: params.message,
  };
}

/** Conserva la vista previa/artefacto vigente ante error de aplicación de filtros (RF-15). */
export function keepEnrolledStudentsPreviewOnApplyError(
  current: EnrolledStudentsPreviewStatus,
): EnrolledStudentsPreviewStatus {
  return current;
}

/** Conserva la vista previa/artefacto vigente al limpiar entradas de filtros (RF-17). */
export function keepEnrolledStudentsPreviewOnClearFilters(
  current: EnrolledStudentsPreviewStatus,
): EnrolledStudentsPreviewStatus {
  return current;
}

/** Conserva el estado del padrón al finalizar una descarga (éxito o error) (RF-43). */
export function keepStaffPreviewAfterDownload(
  current: StaffPreviewStatus,
): StaffPreviewStatus {
  return current;
}

/** Conserva el estado del listado al finalizar una descarga (éxito o error) (RF-43). */
export function keepEnrolledStudentsPreviewAfterDownload(
  current: EnrolledStudentsPreviewStatus,
): EnrolledStudentsPreviewStatus {
  return current;
}

/** Indica si el estado del listado tiene una vista previa/artefacto vigente. */
export function hasEnrolledStudentsCurrentArtifact(
  status: EnrolledStudentsPreviewStatus,
): status is Extract<
  EnrolledStudentsPreviewStatus,
  { status: "ready" | "empty" }
> {
  return status.status === "ready" || status.status === "empty";
}

/** Indica si el estado del padrón tiene un artefacto vigente descargable. */
export function hasStaffCurrentArtifact(
  status: StaffPreviewStatus,
): status is Extract<
  StaffPreviewStatus,
  { status: "ready" | "visualization-error" }
> {
  return status.status === "ready" || status.status === "visualization-error";
}

/** Reintento de generación del listado: misma generación con los mismos filtros aplicados vigentes. */
export function getEnrolledStudentsGenerationRetryIntent(
  appliedFilters: EnrolledStudentsAppliedFilters,
): EnrolledStudentsGenerationRetryIntent {
  return {
    type: "generate-enrolled-students",
    appliedFilters,
  };
}

/** Reintento de generación del padrón: misma generación sin filtros. */
export function getStaffGenerationRetryIntent(): StaffGenerationRetryIntent {
  return { type: "generate-staff" };
}

/**
 * Reintento de descarga: entrega el mismo artefacto vigente cuando existe y es válido;
 * si no aplica, requiere regeneración.
 */
export function getDownloadRetryIntent(
  artifact: ReportArtifact | null | undefined,
): DownloadRetryIntent {
  const strategy: DownloadRetryStrategy = getDownloadRetryStrategy(artifact);
  if (strategy === "reuse-artifact" && artifact) {
    return { type: "reuse-artifact", artifact };
  }

  return { type: "regenerate" };
}
