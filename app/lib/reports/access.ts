import type { ReportType, ReportsAccessRole } from "./types.ts";

/** Roles con acceso al módulo de reportes. */
export const REPORTS_ACCESS_ROLES = Object.freeze([
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly ReportsAccessRole[]);

/** Tipos de reporte permitidos por rol con acceso. */
const REPORT_TYPES_BY_ROLE: Readonly<
  Record<ReportsAccessRole, readonly ReportType[]>
> = Object.freeze({
  ADMINISTRATIVO: Object.freeze(["enrolled-students" as const]),
  ADMINISTRADOR: Object.freeze([
    "enrolled-students" as const,
    "staff" as const,
  ]),
});

/** Indica si el valor es un rol con acceso al módulo de reportes. */
export function isReportsAccessRole(
  role: unknown,
): role is ReportsAccessRole {
  return (
    typeof role === "string" &&
    (REPORTS_ACCESS_ROLES as readonly string[]).includes(role)
  );
}

/** Indica si el rol puede acceder al módulo de reportes. */
export function canAccessReports(role: unknown): boolean {
  return isReportsAccessRole(role);
}

/** Devuelve los reportes permitidos para el rol vigente. */
export function getAllowedReportTypes(role: unknown): readonly ReportType[] {
  if (!isReportsAccessRole(role)) {
    return Object.freeze([]);
  }

  return REPORT_TYPES_BY_ROLE[role];
}

/** Indica si el rol puede acceder/generar el listado de alumnos inscriptos. */
export function canAccessEnrolledStudentsReport(role: unknown): boolean {
  return getAllowedReportTypes(role).includes("enrolled-students");
}

/** Indica si el rol puede acceder/generar el padrón de personal. */
export function canAccessStaffReport(role: unknown): boolean {
  return getAllowedReportTypes(role).includes("staff");
}
