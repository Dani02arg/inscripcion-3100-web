import {
  isStudentStorePayload,
  isStudentUpdatePayload,
  readStudentFormData,
  validateStudentInput,
  type StudentFieldErrors,
  type StudentFormInput,
  type StudentStorePayload,
  type StudentUpdatePayload,
} from "../validation/students.ts";
import { STUDENT_SESSION_EXPIRED_PATH } from "./guard-decision.ts";
import { sanitizeStudentReturnPath } from "./students-url.ts";
import type { StudentActionResult } from "./types.ts";

export interface StudentActionAccessOk {
  readonly status: "ok";
  readonly token: string;
}

export interface StudentActionAccessForbidden {
  readonly status: "forbidden";
  readonly message: string;
}

export type StudentActionAccess =
  | StudentActionAccessOk
  | StudentActionAccessForbidden;

export interface StudentFormActionState {
  readonly status:
    | "idle"
    | "validation"
    | "forbidden"
    | "not_found"
    | "error";
  readonly message: string;
  readonly fieldErrors?: StudentFieldErrors;
  readonly values: StudentFormInput;
}

export interface CreateStudentActionDependencies {
  readonly getAccess: () => Promise<StudentActionAccess>;
  readonly registerStudent: (
    token: string,
    payload: StudentStorePayload,
  ) => Promise<StudentActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
  readonly currentDate?: Date;
}

export interface UpdateStudentActionDependencies {
  readonly getAccess: () => Promise<StudentActionAccess>;
  readonly updateStudent: (
    token: string,
    studentId: string,
    payload: StudentUpdatePayload,
  ) => Promise<StudentActionResult>;
  readonly redirect: (path: string) => never;
  readonly revalidatePath: (path: string) => void;
  readonly currentDate?: Date;
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function failureState(
  result: Exclude<StudentActionResult, { ok: true }>,
  values: StudentFormInput,
): StudentFormActionState {
  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
      values,
    };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message, values };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message, values };
  }

  return { status: "error", message: result.message, values };
}

/** Núcleo testeable del alta de un alumno a cargo del tutor. */
export async function createStudentActionCore(
  _previousState: StudentFormActionState,
  formData: FormData,
  dependencies: CreateStudentActionDependencies,
): Promise<StudentFormActionState> {
  const values = readStudentFormData(formData);
  const validation = validateStudentInput(
    values,
    false,
    dependencies.currentDate ?? new Date(),
  );

  if (
    !validation.valid ||
    !validation.payload ||
    !isStudentStorePayload(validation.payload)
  ) {
    return {
      status: "validation",
      message: "",
      fieldErrors: validation.errors,
      values,
    };
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return { status: "forbidden", message: access.message, values };
  }

  const result = await dependencies.registerStudent(
    access.token,
    validation.payload,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/students");
    dependencies.redirect("/dashboard/students?created=1");
    return { status: "idle", message: "", values };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(STUDENT_SESSION_EXPIRED_PATH);
    return { status: "error", message: result.message, values };
  }

  return failureState(result, values);
}

/** Núcleo testeable de la edición de un alumno propio. */
export async function updateStudentActionCore(
  _previousState: StudentFormActionState,
  formData: FormData,
  dependencies: UpdateStudentActionDependencies,
): Promise<StudentFormActionState> {
  const values = readStudentFormData(formData);
  const studentId = readText(formData, "studentId").trim();
  const from = readText(formData, "from");
  const returnTo = readText(formData, "returnTo");

  if (studentId.length === 0) {
    return {
      status: "error",
      message: "No pudimos identificar al alumno. Intentá nuevamente.",
      values,
    };
  }

  const validation = validateStudentInput(
    values,
    true,
    dependencies.currentDate ?? new Date(),
  );

  if (
    !validation.valid ||
    !validation.payload ||
    !isStudentUpdatePayload(validation.payload)
  ) {
    return {
      status: "validation",
      message: "",
      fieldErrors: validation.errors,
      values,
    };
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return { status: "forbidden", message: access.message, values };
  }

  const result = await dependencies.updateStudent(
    access.token,
    studentId,
    validation.payload,
  );

  if (result.ok) {
    const encodedId = encodeURIComponent(studentId);
    const listPath = sanitizeStudentReturnPath(
      returnTo.length > 0 ? returnTo : from,
    );
    const baseTarget =
      from === "list" || listPath !== "/dashboard/students"
        ? listPath
        : `/dashboard/students/${encodedId}`;
    const separator = baseTarget.includes("?") ? "&" : "?";

    dependencies.revalidatePath("/dashboard/students");
    dependencies.revalidatePath(`/dashboard/students/${encodedId}`);
    dependencies.redirect(`${baseTarget}${separator}updated=1`);
    return { status: "idle", message: "", values };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(STUDENT_SESSION_EXPIRED_PATH);
    return { status: "error", message: result.message, values };
  }

  return failureState(result, values);
}
