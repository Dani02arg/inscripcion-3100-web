import {
  COURSE_VALIDATION_MESSAGES,
  getCreateCourseDefaults,
  readCourseFormData,
  validateCourseInput,
} from "../validation/course.ts";
import {
  COURSE_DELETE_BLOCKED_MESSAGE,
  COURSE_OPERATION_ERROR_MESSAGE,
} from "../api/courses.ts";
import { COURSE_SESSION_EXPIRED_PATH } from "./guard-decision.ts";
import type {
  CourseActionAccess,
} from "./guard.ts";
import { sanitizeReturnPath } from "./filters-url.ts";
import { isCourseStatus } from "./labels.ts";
import { COURSE_EDIT_PAST_YEAR_REASON } from "./types.ts";
import type {
  CourseActionFailure,
  CourseActionResult,
  CourseCloneYearResult,
  CourseFormActionState,
  CourseFormInput,
  CoursePayload,
  CourseStatus,
} from "./types.ts";

export interface CreateCourseActionDependencies {
  readonly getAccess: () => Promise<CourseActionAccess>;
  readonly createCourse: (
    token: string,
    payload: CoursePayload,
  ) => Promise<CourseActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
  readonly currentYear?: number;
}

function applyCreateDefaults(
  input: CourseFormInput,
  currentYear: number,
): CourseFormInput {
  const defaults = getCreateCourseDefaults(currentYear);

  return {
    year: input.year.trim() || defaults.year,
    studyYear: input.studyYear.trim() || defaults.studyYear,
    division: input.division,
    cycle: input.cycle.trim() || defaults.cycle,
    speciality: input.speciality.trim() || defaults.speciality,
    shift: input.shift.trim() || defaults.shift,
    maxCapacity: input.maxCapacity,
  };
}

function failureState(
  result: CourseActionFailure,
  values: CourseFormInput,
): CourseFormActionState {
  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
      values,
    };
  }

  if (result.kind === "conflict") {
    return { status: "conflict", message: result.message, values };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message, values };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message, values };
  }

  return { status: "error", message: result.message, values };
}

/** Núcleo testeable de la acción de creación de cursos. */
export async function createCourseActionCore(
  _previousState: CourseFormActionState,
  formData: FormData,
  dependencies: CreateCourseActionDependencies,
): Promise<CourseFormActionState> {
  const currentYear =
    dependencies.currentYear ?? new Date().getFullYear();
  const values = applyCreateDefaults(
    readCourseFormData(formData),
    currentYear,
  );
  const validation = validateCourseInput(values, 0, currentYear);

  if (!validation.valid || !validation.payload) {
    return {
      status: "validation",
      message: "",
      fieldErrors: validation.errors,
      values,
    };
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return {
      status: "forbidden",
      message: access.message,
      values,
    };
  }

  const result = await dependencies.createCourse(access.token, validation.payload);

  if (result.ok) {
    const code = result.course?.code ?? result.code ?? null;
    const message = `Curso creado correctamente: ${code ?? "Sin código"}.`;

    dependencies.revalidatePath("/dashboard/courses");
    dependencies.redirect(
      `/dashboard/courses?created=${encodeURIComponent(code ?? "Sin código")}`,
    );

    return {
      status: "success",
      message,
      code,
      values,
    };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(COURSE_SESSION_EXPIRED_PATH);
    return { status: "error", message: result.message, values };
  }

  return failureState(result, values);
}

function readFormText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function readFormInteger(
  formData: FormData,
  field: string,
): number | null {
  const value = readFormText(formData, field).trim();

  if (value.length === 0) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function appendNotice(
  path: string,
  key: string,
  value: string,
): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

export interface UpdateCourseActionDependencies {
  readonly getAccess: () => Promise<CourseActionAccess>;
  readonly updateCourse: (
    token: string,
    courseId: string,
    payload: CoursePayload,
  ) => Promise<CourseActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
  readonly currentYear?: number;
}

/** Núcleo testeable de la acción de edición de cursos. */
export async function updateCourseActionCore(
  _previousState: CourseFormActionState,
  formData: FormData,
  dependencies: UpdateCourseActionDependencies,
): Promise<CourseFormActionState> {
  const currentYear =
    dependencies.currentYear ?? new Date().getFullYear();
  const values = readCourseFormData(formData);
  const courseId = readFormText(formData, "courseId").trim();
  const currentCapacity = readFormInteger(formData, "currentCapacity");
  const originalYear = readFormInteger(formData, "originalYear");

  if (
    courseId.length === 0 ||
    currentCapacity === null ||
    currentCapacity < 0 ||
    originalYear === null
  ) {
    return {
      status: "error",
      message: "No pudimos identificar el curso. Intentá nuevamente.",
      values,
    };
  }

  if (originalYear < currentYear) {
    return {
      status: "validation",
      message: "",
      fieldErrors: { year: COURSE_EDIT_PAST_YEAR_REASON },
      values,
    };
  }

  const validation = validateCourseInput(
    values,
    currentCapacity,
    currentYear,
    { originalYear },
  );

  if (!validation.valid || !validation.payload) {
    return {
      status: "validation",
      message: "",
      fieldErrors: validation.errors,
      values,
    };
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return {
      status: "forbidden",
      message: access.message,
      values,
    };
  }

  const result = await dependencies.updateCourse(
    access.token,
    courseId,
    validation.payload,
  );

  if (result.ok) {
    const code = result.course?.code ?? result.code ?? null;
    const updatedCourseId = result.course?.id ?? courseId;
    const from = readFormText(formData, "from");
    const returnTo = readFormText(formData, "returnTo");
    const listPath = sanitizeReturnPath(
      returnTo.length > 0 ? returnTo : from,
    );
    const target =
      from === "list" || listPath !== "/dashboard/courses"
        ? appendNotice(listPath, "updated", code ?? "Sin código")
        : appendNotice(
            `/dashboard/courses/${encodeURIComponent(updatedCourseId)}`,
            "updated",
            code ?? "Sin código",
          );

    dependencies.revalidatePath("/dashboard/courses");
    dependencies.revalidatePath(
      `/dashboard/courses/${encodeURIComponent(updatedCourseId)}`,
    );
    dependencies.redirect(target);

    return {
      status: "success",
      message: `Curso actualizado correctamente: ${code ?? "Sin código"}.`,
      code,
      values,
    };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(COURSE_SESSION_EXPIRED_PATH);
    return { status: "error", message: result.message, values };
  }

  return failureState(result, values);
}

function localFailure(
  kind: CourseActionFailure["kind"],
  message: string,
  status: number | null = null,
): CourseActionFailure {
  return { ok: false, kind, status, message };
}

export interface DeleteCourseActionDependencies {
  readonly getAccess: () => Promise<CourseActionAccess>;
  readonly deleteCourse: (
    token: string,
    courseId: string,
  ) => Promise<CourseActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
}

/** Núcleo testeable de la acción de eliminación lógica. */
export async function deleteCourseActionCore(
  _previousState: CourseActionResult | null,
  formData: FormData,
  dependencies: DeleteCourseActionDependencies,
): Promise<CourseActionResult> {
  const courseId = readFormText(formData, "courseId").trim();
  const currentCapacity = readFormInteger(formData, "currentCapacity");

  if (courseId.length === 0) {
    return localFailure("failed", COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (currentCapacity === null || currentCapacity !== 0) {
    return localFailure("conflict", COURSE_DELETE_BLOCKED_MESSAGE);
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const result = await dependencies.deleteCourse(access.token, courseId);

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/courses");
    dependencies.revalidatePath(
      `/dashboard/courses/${encodeURIComponent(courseId)}`,
    );
  }

  if (!result.ok && result.kind === "unauthorized") {
    dependencies.redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  return result;
}

export interface CloneCourseActionDependencies {
  readonly getAccess: () => Promise<CourseActionAccess>;
  readonly cloneCourse: (
    token: string,
    courseId: string,
    year: number,
  ) => Promise<CourseActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
  readonly currentYear?: number;
}

/** Núcleo testeable de la clonación individual. */
export async function cloneCourseActionCore(
  _previousState: CourseActionResult | null,
  formData: FormData,
  dependencies: CloneCourseActionDependencies,
): Promise<CourseActionResult> {
  const courseId = readFormText(formData, "courseId").trim();
  const year = readFormInteger(formData, "year");
  const currentYear =
    dependencies.currentYear ?? new Date().getFullYear();

  if (courseId.length === 0) {
    return localFailure("failed", COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (year === null || year < currentYear) {
    return {
      ok: false,
      kind: "validation",
      status: null,
      message: "",
      fieldErrors: { year: COURSE_VALIDATION_MESSAGES.yearPast },
    };
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const result = await dependencies.cloneCourse(
    access.token,
    courseId,
    year,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/courses");

    if (result.course) {
      dependencies.revalidatePath(
        `/dashboard/courses/${encodeURIComponent(result.course.id)}`,
      );
    }

    const code = result.course?.code ?? null;

    return {
      ...result,
      code,
      message: `Curso clonado correctamente: ${code ?? "Sin código"}.`,
    };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  return result;
}

export const COURSE_ORIGIN_YEAR_MESSAGE =
  "Seleccioná un año de origen válido.";
export const COURSE_NO_CLONES_MESSAGE =
  "No se creó ningún curso nuevo.";

export interface CloneYearActionDependencies {
  readonly getAccess: () => Promise<CourseActionAccess>;
  readonly cloneCoursesByYear: (
    token: string,
    oldYear: number,
    attempted: number,
  ) => Promise<CourseCloneYearResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
  readonly currentYear?: number;
}

/** Núcleo testeable de la clonación masiva por año. */
export async function cloneYearActionCore(
  _previousState: CourseCloneYearResult | null,
  formData: FormData,
  dependencies: CloneYearActionDependencies,
): Promise<CourseCloneYearResult> {
  const oldYear = readFormInteger(formData, "oldYear");
  const attempted = readFormInteger(formData, "attempted") ?? 0;
  const currentYear =
    dependencies.currentYear ?? new Date().getFullYear();

  if (oldYear === null || oldYear >= currentYear) {
    return {
      ok: false,
      kind: "validation",
      status: null,
      message: COURSE_ORIGIN_YEAR_MESSAGE,
    };
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const result = await dependencies.cloneCoursesByYear(
    access.token,
    oldYear,
    attempted,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/courses");

    for (const course of result.courses) {
      dependencies.revalidatePath(
        `/dashboard/courses/${encodeURIComponent(course.id)}`,
      );
    }

    return {
      ...result,
      message:
        result.cloned === 0
          ? COURSE_NO_CLONES_MESSAGE
          : result.message,
    };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(COURSE_SESSION_EXPIRED_PATH);
  } else {
    dependencies.revalidatePath("/dashboard/courses");
  }

  return result;
}

export interface SetCourseStatusActionDependencies {
  readonly getAccess: () => Promise<CourseActionAccess>;
  readonly setCourseStatus: (
    token: string,
    courseId: string,
    status: CourseStatus,
  ) => Promise<CourseActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
}

/** Núcleo testeable de activación y desactivación de cursos. */
export async function setCourseStatusActionCore(
  _previousState: CourseActionResult | null,
  formData: FormData,
  dependencies: SetCourseStatusActionDependencies,
): Promise<CourseActionResult> {
  const courseId = readFormText(formData, "courseId").trim();
  const rawStatus = readFormText(formData, "status").trim();
  const currentCapacity = readFormInteger(formData, "currentCapacity");

  if (courseId.length === 0 || !isCourseStatus(rawStatus)) {
    return localFailure("failed", COURSE_OPERATION_ERROR_MESSAGE);
  }

  if (
    rawStatus === "inactive" &&
    (currentCapacity === null || currentCapacity !== 0)
  ) {
    return localFailure("conflict", COURSE_OPERATION_ERROR_MESSAGE);
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const result = await dependencies.setCourseStatus(
    access.token,
    courseId,
    rawStatus,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/courses");
    dependencies.revalidatePath(
      `/dashboard/courses/${encodeURIComponent(result.course?.id ?? courseId)}`,
    );

    return {
      ...result,
      message:
        rawStatus === "active"
          ? "Curso activado correctamente."
          : "Curso desactivado correctamente.",
    };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  return result;
}
