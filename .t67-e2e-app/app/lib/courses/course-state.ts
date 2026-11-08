import type {
  Course,
  CourseActionState,
  CourseActionResult,
  CourseDetailState,
  CourseListResult,
  CourseListState,
  CoursePage,
  CourseReport,
  CourseReportResult,
  CourseReportState,
  CourseResult,
  CourseSummary,
} from "./types.ts";

export const COURSE_LIST_LOADING_STATE: CourseListState = {
  status: "loading",
};

export const COURSE_DETAIL_LOADING_STATE: CourseDetailState = {
  status: "loading",
};

export const COURSE_REPORT_LOADING_STATE: CourseReportState = {
  status: "loading",
};

export const COURSE_ACTION_IDLE_STATE: CourseActionState = {
  status: "idle",
};

export const COURSE_ACTION_PENDING_STATE: CourseActionState = {
  status: "pending",
};

export interface CourseListView {
  readonly courses: Course[];
  readonly summary: CourseSummary;
  readonly page: CoursePage;
}

export interface CourseDetailView {
  readonly report?: CourseReport | null;
  readonly reportStatus?: "loading" | "ready" | "error";
  readonly reportMessage?: string;
}

/** Traduce el resultado del listado y la vista filtrada a un estado de página. */
export function toCourseListState(
  result: CourseListResult,
  view: CourseListView,
): CourseListState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    return { status: "error", message: result.message };
  }

  if (view.courses.length === 0) {
    return { status: "empty", summary: view.summary };
  }

  return {
    status: "ready",
    courses: view.courses,
    summary: view.summary,
    page: view.page,
  };
}

/** Traduce el resultado del detalle y el estado del reporte a un estado de página. */
export function toCourseDetailState(
  result: CourseResult,
  view: CourseDetailView = {},
): CourseDetailState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    if (result.kind === "not_found") {
      return { status: "not_found" };
    }

    return { status: "error", message: result.message };
  }

  const report = view.report ?? null;
  const reportStatus = view.reportStatus ?? (report ? "ready" : "loading");

  return {
    status: "ready",
    course: result.course,
    report,
    reportStatus,
    ...(view.reportMessage ? { reportMessage: view.reportMessage } : {}),
  };
}

/** Traduce el resultado del reporte a un estado de sección. */
export function toCourseReportState(
  result: CourseReportResult,
): CourseReportState {
  if (result.ok) {
    return { status: "ready", report: result.report };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message };
  }

  return { status: "error", message: result.message };
}

/** Traduce el resultado de una escritura a un estado de acción. */
export function toCourseActionState(
  result: CourseActionResult,
): CourseActionState {
  if (result.ok) {
    return {
      status: "success",
      message: result.message,
      ...(result.course ? { course: result.course } : {}),
      ...(result.code !== undefined ? { code: result.code } : {}),
    };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
    };
  }

  if (result.kind === "conflict") {
    return { status: "conflict", message: result.message };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message };
  }

  return { status: "error", message: result.message };
}

/** Mensaje de resultado de la clonación masiva con creados e intentados. */
export function formatCloneYearMessage(
  cloned: number,
  attempted: number,
  emptyMessage: string,
): string {
  return cloned === 0
    ? emptyMessage
    : `Se crearon ${cloned} de ${attempted} cursos.`;
}
