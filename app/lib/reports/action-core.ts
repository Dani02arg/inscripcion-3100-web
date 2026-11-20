import {
  fetchEnrolledStudentsReport,
  fetchStaffReport,
  type ReportArtifactApiResult,
} from "../api/reports.ts";
import {
  REPORT_ACCESS_DENIED_MESSAGE,
  REPORT_GENERIC_ERROR_MESSAGE,
  REPORT_INVALID_ARTIFACT_MESSAGE,
  REPORT_SESSION_EXPIRED_MESSAGE,
} from "./constants.ts";
import { buildEnrolledStudentsPreview } from "./enrolled-students.ts";
import {
  buildEnrolledStudentsAppliedFilters,
  type FiltersAvailability,
} from "./filters.ts";
import {
  parseEnrolledStudentsXlsxPreview,
  type ParseEnrolledStudentsXlsxResult,
} from "./xlsx-preview.ts";
import { canAccessEnrolledStudentsReport, canAccessStaffReport } from "./access.ts";
import type {
  EnrolledStudentsFilterInputs,
  EnrolledStudentsGenerateResult,
  EnrolledStudentsPreviewData,
  ReportFailure,
  StaffGenerateResult,
} from "./types.ts";

export interface ReportsActionAccessOk {
  readonly ok: true;
  readonly token: string;
  readonly role: unknown;
}

export interface ReportsActionAccessDenied {
  readonly ok: false;
  readonly failure: ReportFailure;
}

export type ReportsActionAccess =
  | ReportsActionAccessOk
  | ReportsActionAccessDenied;

export interface GenerateEnrolledStudentsReportDependencies {
  readonly getAccess: () => Promise<ReportsActionAccess>;
  readonly fetchReport: (
    token: string,
    filters: Parameters<typeof fetchEnrolledStudentsReport>[1],
  ) => Promise<ReportArtifactApiResult>;
  readonly parseXlsx: (
    artifact: { readonly base64: string },
  ) => ParseEnrolledStudentsXlsxResult;
  readonly buildPreview: (
    rows: readonly (readonly unknown[])[],
  ) => EnrolledStudentsPreviewData;
}

export interface GenerateStaffReportDependencies {
  readonly getAccess: () => Promise<ReportsActionAccess>;
  readonly fetchReport: (token: string) => Promise<ReportArtifactApiResult>;
}

function unauthorizedFailure(): ReportFailure {
  return {
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: REPORT_SESSION_EXPIRED_MESSAGE,
  };
}

function forbiddenFailure(): ReportFailure {
  return {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: REPORT_ACCESS_DENIED_MESSAGE,
  };
}

function validationFailure(
  message: string | null,
  fieldErrors?: ReportFailure["fieldErrors"],
): ReportFailure {
  return {
    ok: false,
    kind: "validation",
    status: null,
    message: message ?? REPORT_GENERIC_ERROR_MESSAGE,
    ...(fieldErrors && Object.keys(fieldErrors).length > 0
      ? { fieldErrors }
      : {}),
  };
}

function invalidArtifactFailure(message?: string): ReportFailure {
  return {
    ok: false,
    kind: "invalid-artifact",
    status: null,
    message: message ?? REPORT_INVALID_ARTIFACT_MESSAGE,
  };
}

const defaultEnrolledDependencies = {
  fetchReport: fetchEnrolledStudentsReport,
  parseXlsx: parseEnrolledStudentsXlsxPreview,
  buildPreview: buildEnrolledStudentsPreview,
} satisfies Omit<GenerateEnrolledStudentsReportDependencies, "getAccess">;

const defaultStaffDependencies = {
  fetchReport: fetchStaffReport,
} satisfies Omit<GenerateStaffReportDependencies, "getAccess">;

export async function generateEnrolledStudentsReportCore(
  inputs: EnrolledStudentsFilterInputs,
  availability: FiltersAvailability,
  dependencies: GenerateEnrolledStudentsReportDependencies,
): Promise<EnrolledStudentsGenerateResult> {
  const access = await dependencies.getAccess();
  if (!access.ok) {
    return access.failure;
  }

  if (!canAccessEnrolledStudentsReport(access.role)) {
    return forbiddenFailure();
  }

  const built = buildEnrolledStudentsAppliedFilters(inputs, availability);
  if (!built.ok) {
    return validationFailure(built.errors.generalMessage, built.errors.fieldErrors);
  }

  const result = await dependencies.fetchReport(access.token, built.applied);
  if (!result.ok) {
    return result;
  }

  const parsed = dependencies.parseXlsx(result.artifact);
  if (!parsed.ok) {
    return invalidArtifactFailure(parsed.message);
  }

  const preview = dependencies.buildPreview(parsed.preview.rows);

  return {
    ok: true,
    artifact: result.artifact,
    preview,
    appliedFilters: built.applied,
  };
}

export async function generateStaffReportCore(
  dependencies: GenerateStaffReportDependencies,
): Promise<StaffGenerateResult> {
  const access = await dependencies.getAccess();
  if (!access.ok) {
    return access.failure;
  }

  if (!canAccessStaffReport(access.role)) {
    return forbiddenFailure();
  }

  const result = await dependencies.fetchReport(access.token);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    artifact: result.artifact,
  };
}

export { defaultEnrolledDependencies, defaultStaffDependencies, unauthorizedFailure };
