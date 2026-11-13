import type {
  StudentActionResult,
  StudentActionState,
  StudentDetailState,
  StudentListResult,
  StudentListState,
  StudentPage,
  StudentResult,
  StudentTutorResult,
  Student,
} from "./types.ts";

/** Vista ya filtrada y paginada que acompaña al resultado del listado. */
export interface StudentListView {
  readonly students: readonly Student[];
  readonly page: StudentPage | null;
  readonly hasFilters: boolean;
}

/**
 * Traduce el resultado del listado y la vista visible a un estado excluyente.
 * Un error no se muestra junto con el estado vacío.
 */
export function toStudentListState(
  result: StudentListResult,
  view: StudentListView,
): StudentListState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    return { status: "error", message: result.message };
  }

  if (view.students.length === 0) {
    if (view.hasFilters && view.page !== null) {
      return { status: "no_results", page: view.page };
    }

    return { status: "empty", page: view.page };
  }

  return {
    status: "ready",
    students: view.students,
    page: view.page,
  };
}

/**
 * Traduce el detalle y, cuando existe, la consulta del tutor responsable.
 * Un fallo del tutor no invalida el detalle: se muestra «No informado».
 */
export function toStudentDetailState(
  result: StudentResult,
  tutorResult: StudentTutorResult | null = null,
): StudentDetailState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    if (result.kind === "not_found") {
      return { status: "not_found" };
    }

    return { status: "error", message: result.message };
  }

  return {
    status: "ready",
    student: result.student,
    tutor: tutorResult?.ok ? tutorResult.tutor : null,
  };
}

/** Traduce el resultado de una escritura a un estado de acción. */
export function toStudentActionState(
  result: StudentActionResult,
): StudentActionState {
  if (result.ok) {
    return {
      status: "success",
      message: result.message,
      ...(result.student ? { student: result.student } : {}),
    };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
    };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message };
  }

  return { status: "error", message: result.message };
}
