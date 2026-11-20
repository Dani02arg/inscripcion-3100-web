"use server";

import { fetchEnrolledStudentsReport, fetchStaffReport } from "../api/reports.ts";
import { getSessionClaims, getSessionToken } from "../auth/session-cookie.ts";
import { isSessionExpired } from "../auth/session.ts";
import { REPORT_SESSION_EXPIRED_MESSAGE } from "../reports/constants.ts";
import { buildEnrolledStudentsPreview } from "../reports/enrolled-students.ts";
import type { FiltersAvailability } from "../reports/filters.ts";
import {
  generateEnrolledStudentsReportCore,
  generateStaffReportCore,
  type ReportsActionAccess,
} from "../reports/action-core.ts";
import { parseEnrolledStudentsXlsxPreview } from "../reports/xlsx-preview.ts";
import type {
  EnrolledStudentsFilterInputs,
  EnrolledStudentsGenerateResult,
  StaffGenerateResult,
} from "../reports/types.ts";

async function getReportsActionAccess(): Promise<ReportsActionAccess> {
  const [claims, token] = await Promise.all([
    getSessionClaims(),
    getSessionToken(),
  ]);

  if (!claims || !token || isSessionExpired(claims, Date.now())) {
    return {
      ok: false,
      failure: {
        ok: false,
        kind: "unauthorized",
        status: 401,
        message: REPORT_SESSION_EXPIRED_MESSAGE,
      },
    };
  }

  return { ok: true, token, role: claims.role };
}

/**
 * Genera el artefacto vigente y la vista previa del listado de alumnos inscriptos.
 * Valida sesión/rol y filtros (R1) antes de invocar el servicio.
 */
export async function generateEnrolledStudentsReportAction(
  inputs: EnrolledStudentsFilterInputs,
  availability: FiltersAvailability,
): Promise<EnrolledStudentsGenerateResult> {
  return generateEnrolledStudentsReportCore(inputs, availability, {
    getAccess: getReportsActionAccess,
    fetchReport: fetchEnrolledStudentsReport,
    parseXlsx: parseEnrolledStudentsXlsxPreview,
    buildPreview: buildEnrolledStudentsPreview,
  });
}

/**
 * Genera el artefacto vigente del padrón de personal (solo ADMINISTRADOR).
 */
export async function generateStaffReportAction(): Promise<StaffGenerateResult> {
  return generateStaffReportCore({
    getAccess: getReportsActionAccess,
    fetchReport: fetchStaffReport,
  });
}
