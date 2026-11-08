export type CourseStatus = "active" | "inactive";

export type CourseCycle = "basic" | "superior";

export type CourseSpeciality = "basic" | "informatics" | "electronics";

export type CourseShift = "morning" | "afternoon" | "night";

export const COURSE_STATUSES: readonly CourseStatus[] = ["active", "inactive"];

export const COURSE_CYCLES: readonly CourseCycle[] = ["basic", "superior"];

export const COURSE_SPECIALITIES: readonly CourseSpeciality[] = [
  "basic",
  "informatics",
  "electronics",
];

export const COURSE_SHIFTS: readonly CourseShift[] = [
  "morning",
  "afternoon",
  "night",
];

export const COURSE_DELETE_DISABLED_REASON =
  "No disponible: el curso tiene inscriptos.";

export const COURSE_EDIT_PAST_YEAR_REASON =
  "Solo se pueden editar cursos del año actual o futuros.";

export interface Course {
  readonly id: string;
  readonly code: string | null;
  readonly year: number;
  readonly studyYear: number;
  readonly division: string;
  readonly cycle: string;
  readonly speciality: string;
  readonly shift: string;
  readonly maxCapacity: number;
  readonly currentCapacity: number;
  readonly availablePlaces: number | null;
  readonly status: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export type CourseYearFilter = number | "all";

export interface CourseFilters {
  readonly query: string;
  readonly year: CourseYearFilter;
  readonly cycle: CourseCycle | "all";
  readonly speciality: CourseSpeciality | "all";
  readonly shift: CourseShift | "all";
}

export interface CourseFilterOptions {
  readonly years: readonly number[];
  readonly cycles: readonly CourseCycle[];
  readonly specialities: readonly CourseSpeciality[];
  readonly shifts: readonly CourseShift[];
}

export interface CoursePage {
  readonly items: Course[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly from: number;
  readonly to: number;
}

export interface CourseSummary {
  readonly total: number;
  readonly active: number;
  readonly maxCapacityTotal: number | null;
}

export interface CourseReportRow {
  readonly lastname: string | null;
  readonly name: string | null;
  readonly dni: string | null;
  readonly phone: string | null;
  readonly email: string | null;
}

export interface CourseReport {
  readonly totalInscriptions: number | null;
  readonly rows: CourseReportRow[];
}

export interface CourseListMeta {
  readonly currentPage: number;
  readonly lastPage: number;
  readonly perPage: number;
  readonly total: number;
}

export type CourseFailureKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "failed";

export interface CourseFailure {
  readonly ok: false;
  readonly kind: CourseFailureKind;
  readonly status: number | null;
  readonly message: string;
}

export interface CourseListSuccess {
  readonly ok: true;
  readonly courses: Course[];
  readonly meta: CourseListMeta;
  readonly message: string;
}

export type CourseListResult = CourseListSuccess | CourseFailure;

export interface CourseSuccess {
  readonly ok: true;
  readonly course: Course;
  readonly message: string;
}

export type CourseResult = CourseSuccess | CourseFailure;

export interface CourseReportSuccess {
  readonly ok: true;
  readonly report: CourseReport;
  readonly message: string;
}

export type CourseReportResult = CourseReportSuccess | CourseFailure;

export type CourseActionFailureKind =
  | CourseFailureKind
  | "validation"
  | "conflict";

export interface CourseActionFailure {
  readonly ok: false;
  readonly kind: CourseActionFailureKind;
  readonly status: number | null;
  readonly message: string;
  readonly fieldErrors?: CourseFieldErrors;
}

export interface CourseActionSuccess {
  readonly ok: true;
  readonly message: string;
  readonly course?: Course;
  readonly code?: string | null;
}

export type CourseActionResult = CourseActionSuccess | CourseActionFailure;

export interface CourseCloneYearSuccess {
  readonly ok: true;
  readonly message: string;
  readonly cloned: number;
  readonly attempted: number;
  readonly courses: Course[];
}

export type CourseCloneYearResult =
  | CourseCloneYearSuccess
  | CourseActionFailure;

export type CourseField =
  | "year"
  | "studyYear"
  | "division"
  | "cycle"
  | "speciality"
  | "shift"
  | "maxCapacity";

export type CourseFieldErrors = Partial<Record<CourseField, string>>;

export interface CourseFormInput {
  readonly year: string;
  readonly studyYear: string;
  readonly division: string;
  readonly cycle: string;
  readonly speciality: string;
  readonly shift: string;
  readonly maxCapacity: string;
}

export interface CoursePayload {
  readonly year: number;
  readonly studyYear: number;
  readonly division: string;
  readonly cycle: CourseCycle;
  readonly speciality: CourseSpeciality;
  readonly shift: CourseShift;
  readonly maxCapacity: number;
}

export interface CourseValidationOptions {
  readonly originalYear?: number;
}

export interface CourseValidationResult {
  readonly valid: boolean;
  readonly errors: CourseFieldErrors;
  readonly payload: CoursePayload | null;
}

export type CourseFormMode = "create" | "edit";

export type CourseActionStatus =
  | "idle"
  | "pending"
  | "success"
  | "validation"
  | "conflict"
  | "error"
  | "forbidden"
  | "not_found";

export interface CourseDeleteEligibility {
  readonly allowed: boolean;
  readonly reason: string | null;
}

export interface CourseEditEligibility {
  readonly allowed: boolean;
  readonly reason: string | null;
}

export interface CourseNotice {
  readonly kind: "success" | "error" | "info";
  readonly message: string;
}

export interface CourseFormActionState {
  readonly status:
    | "idle"
    | "success"
    | "validation"
    | "conflict"
    | "error"
    | "forbidden"
    | "not_found";
  readonly message: string;
  readonly fieldErrors?: CourseFieldErrors;
  readonly values?: CourseFormInput;
  readonly code?: string | null;
}

export type CourseActionState =
  | { readonly status: "idle" }
  | { readonly status: "pending" }
  | {
      readonly status: "success";
      readonly message: string;
      readonly course?: Course;
      readonly code?: string | null;
    }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: CourseFieldErrors;
    }
  | { readonly status: "conflict"; readonly message: string }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "not_found"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

export type CourseReportState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly report: CourseReport }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "not_found"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

export type CourseListState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly courses: Course[];
      readonly summary: CourseSummary;
      readonly page: CoursePage;
    }
  | { readonly status: "empty"; readonly summary: CourseSummary }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

export type CourseDetailState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly course: Course;
      readonly report: CourseReport | null;
      readonly reportStatus: "loading" | "ready" | "error";
      readonly reportMessage?: string;
    }
  | { readonly status: "not_found" }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "error"; readonly message: string };
