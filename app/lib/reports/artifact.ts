import type { ReportArtifact } from "./types.ts";

/** Estrategia de reintento ante fallo de descarga. */
export type DownloadRetryStrategy = "reuse-artifact" | "regenerate";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Valida que exista un artefacto con metadatos presentes y contenido no vacío.
 * Se considera inválido si falta información requerida o el tamaño es 0.
 */
export function isValidReportArtifact(
  artifact: ReportArtifact | null | undefined,
): artifact is ReportArtifact {
  if (!artifact) {
    return false;
  }

  return (
    isNonEmptyString(artifact.base64) &&
    isNonEmptyString(artifact.contentType) &&
    isNonEmptyString(artifact.filename) &&
    typeof artifact.byteLength === "number" &&
    Number.isFinite(artifact.byteLength) &&
    artifact.byteLength > 0
  );
}

/**
 * Determina si el artefacto vigente está disponible para descarga.
 * Un artefacto válido es descargable aunque la visualización haya fallado
 * (incluye reporte vacío/sin registros cuando el archivo es válido).
 */
export function canDownloadReportArtifact(
  artifact: ReportArtifact | null | undefined,
  options?: { readonly visualizationFailed?: boolean },
): boolean {
  void options;
  return isValidReportArtifact(artifact);
}

/**
 * Indica la estrategia de reintento de descarga:
 * reutiliza el mismo artefacto vigente cuando existe y es válido; en caso
 * contrario, requiere repetir la generación correspondiente.
 */
export function getDownloadRetryStrategy(
  artifact: ReportArtifact | null | undefined,
): DownloadRetryStrategy {
  return isValidReportArtifact(artifact) ? "reuse-artifact" : "regenerate";
}
