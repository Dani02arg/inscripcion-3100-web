import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_ACTION_IDLE_STATE,
  COURSE_ACTION_PENDING_STATE,
  COURSE_DETAIL_LOADING_STATE,
  COURSE_LIST_LOADING_STATE,
  COURSE_REPORT_LOADING_STATE,
  formatCloneYearMessage,
  toCourseActionState,
  toCourseDetailState,
  toCourseListState,
  toCourseReportState,
} from "../../app/lib/courses/course-state.ts";
import type {
  Course,
  CourseActionFailure,
  CourseActionResult,
  CourseListResult,
  CoursePage,
  CourseReport,
  CourseReportResult,
  CourseResult,
  CourseSummary,
} from "../../app/lib/courses/types.ts";

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    code: "2026-1-1-BAS-INF-M",
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: 30,
    currentCapacity: 12,
    availablePlaces: 18,
    status: "active",
    ...overrides,
  };
}

const summary: CourseSummary = {
  total: 1,
  active: 1,
  maxCapacityTotal: 30,
};

const page: CoursePage = {
  items: [makeCourse()],
  page: 1,
  pageSize: 15,
  total: 1,
  totalPages: 1,
  from: 1,
  to: 1,
};

const listSuccess: CourseListResult = {
  ok: true,
  courses: [makeCourse()],
  meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 1 },
  message: "ok",
};

const detailSuccess: CourseResult = {
  ok: true,
  course: makeCourse(),
  message: "ok",
};

const report: CourseReport = {
  totalInscriptions: 1,
  rows: [
    {
      lastname: "Pérez",
      name: "Ana",
      dni: "12345678",
      phone: null,
      email: null,
    },
  ],
};

const reportSuccess: CourseReportResult = {
  ok: true,
  report,
  message: "ok",
};

function failure(
  kind: CourseActionFailure["kind"],
  message: string,
): CourseActionFailure {
  return { ok: false, kind, status: 400, message };
}

test("mapea el listado listo y vacío", () => {
  assert.deepEqual(
    toCourseListState(listSuccess, {
      courses: [makeCourse()],
      summary,
      page,
    }),
    {
      status: "ready",
      courses: [makeCourse()],
      summary,
      page,
    },
  );

  assert.deepEqual(
    toCourseListState(listSuccess, { courses: [], summary, page }),
    { status: "empty", summary },
  );
});

test("mapea denegado y error del listado sin inventar datos", () => {
  assert.deepEqual(
    toCourseListState(
      { ok: false, kind: "forbidden", status: 403, message: "Denegado" },
      { courses: [], summary, page },
    ),
    { status: "forbidden", message: "Denegado" },
  );

  for (const kind of ["unauthorized", "not_found", "failed"] as const) {
    const state = toCourseListState(
      { ok: false, kind, status: 500, message: "Error" },
      { courses: [], summary, page },
    );
    assert.deepEqual(state, { status: "error", message: "Error" });
  }
});

test("mapea el detalle listo, con reporte y sus errores", () => {
  assert.deepEqual(toCourseDetailState(detailSuccess), {
    status: "ready",
    course: makeCourse(),
    report: null,
    reportStatus: "loading",
  });

  assert.deepEqual(
    toCourseDetailState(detailSuccess, {
      report,
      reportStatus: "ready",
    }),
    {
      status: "ready",
      course: makeCourse(),
      report,
      reportStatus: "ready",
    },
  );

  assert.deepEqual(
    toCourseDetailState(
      { ok: false, kind: "forbidden", status: 403, message: "Denegado" },
    ),
    { status: "forbidden", message: "Denegado" },
  );
  assert.deepEqual(
    toCourseDetailState(
      { ok: false, kind: "not_found", status: 404, message: "No existe" },
    ),
    { status: "not_found" },
  );
  assert.deepEqual(
    toCourseDetailState(
      { ok: false, kind: "failed", status: 500, message: "Error" },
    ),
    { status: "error", message: "Error" },
  );
});

test("mapea el reporte listo y sus errores", () => {
  assert.deepEqual(toCourseReportState(reportSuccess), {
    status: "ready",
    report,
  });

  assert.deepEqual(
    toCourseReportState({
      ok: false,
      kind: "forbidden",
      status: 403,
      message: "Denegado",
    }),
    { status: "forbidden", message: "Denegado" },
  );
  assert.deepEqual(
    toCourseReportState({
      ok: false,
      kind: "not_found",
      status: 404,
      message: "No existe",
    }),
    { status: "not_found", message: "No existe" },
  );
  assert.deepEqual(
    toCourseReportState({
      ok: false,
      kind: "failed",
      status: 500,
      message: "Error",
    }),
    { status: "error", message: "Error" },
  );
});

test("mapea éxito, validación y conflicto de acciones", () => {
  assert.deepEqual(
    toCourseActionState({
      ok: true,
      message: "Curso creado.",
      course: makeCourse(),
      code: "2026-1-1-BAS-INF-M",
    }),
    {
      status: "success",
      message: "Curso creado.",
      course: makeCourse(),
      code: "2026-1-1-BAS-INF-M",
    },
  );

  assert.deepEqual(
    toCourseActionState(
      failure("validation", "Revisá los datos."),
    ),
    {
      status: "validation",
      message: "Revisá los datos.",
      fieldErrors: {},
    },
  );

  assert.deepEqual(
    toCourseActionState({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los datos.",
      fieldErrors: { year: "Año inválido." },
    }),
    {
      status: "validation",
      message: "Revisá los datos.",
      fieldErrors: { year: "Año inválido." },
    },
  );

  assert.deepEqual(
    toCourseActionState(failure("conflict", "Ya existe.")),
    { status: "conflict", message: "Ya existe." },
  );
});

test("mapea los errores restantes de acciones a sus estados", () => {
  assert.deepEqual(
    toCourseActionState(failure("forbidden", "Denegado")),
    { status: "forbidden", message: "Denegado" },
  );
  assert.deepEqual(
    toCourseActionState(failure("not_found", "No existe")),
    { status: "not_found", message: "No existe" },
  );

  for (const kind of ["unauthorized", "failed"] as const) {
    assert.deepEqual(
      toCourseActionState(failure(kind, "Error")),
      { status: "error", message: "Error" },
    );
  }
});

test("expone los estados iniciales sin datos inventados", () => {
  assert.deepEqual(COURSE_LIST_LOADING_STATE, { status: "loading" });
  assert.deepEqual(COURSE_DETAIL_LOADING_STATE, { status: "loading" });
  assert.deepEqual(COURSE_REPORT_LOADING_STATE, { status: "loading" });
  assert.deepEqual(COURSE_ACTION_IDLE_STATE, { status: "idle" });
  assert.deepEqual(COURSE_ACTION_PENDING_STATE, { status: "pending" });
});

test("formatea el resultado de clonación masiva con creados e intentados", () => {
  assert.equal(
    formatCloneYearMessage(2, 5, "No se creó ningún curso nuevo."),
    "Se crearon 2 de 5 cursos.",
  );
  assert.equal(
    formatCloneYearMessage(0, 5, "No se creó ningún curso nuevo."),
    "No se creó ningún curso nuevo.",
  );
});

test("no muta el resultado de entrada", () => {
  const action: CourseActionResult = {
    ok: true,
    message: "Curso actualizado.",
    course: makeCourse(),
  };
  const snapshot = { ...action };

  toCourseActionState(action);

  assert.deepEqual(action, snapshot);
});
