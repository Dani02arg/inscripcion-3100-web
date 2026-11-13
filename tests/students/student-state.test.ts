import assert from "node:assert/strict";
import { test } from "node:test";

import {
  toStudentActionState,
  toStudentDetailState,
  toStudentListState,
} from "../../app/lib/students/student-state.ts";
import type {
  Student,
  StudentActionFailureKind,
  StudentActionResult,
  StudentFailureKind,
  StudentListResult,
  StudentPage,
  StudentResult,
  StudentTutorResult,
} from "../../app/lib/students/types.ts";

function makeStudent(id = "s-1"): Student {
  return {
    id,
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: null,
    studentPhone: null,
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: null,
    address: null,
  };
}

function makePage(items: readonly Student[]): StudentPage {
  return {
    items,
    page: 1,
    pageSize: 15,
    total: items.length,
    totalPages: 1,
    from: items.length > 0 ? 1 : 0,
    to: items.length,
  };
}

function listFailure(
  kind: StudentFailureKind,
  message: string,
): StudentListResult {
  return { ok: false, kind, status: null, message };
}

function listSuccess(
  students: readonly Student[],
): StudentListResult {
  return {
    ok: true,
    students,
    meta: {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: students.length,
    },
    message: "",
  };
}

function detailFailure(
  kind: StudentFailureKind,
  message: string,
): StudentResult {
  return { ok: false, kind, status: null, message };
}

function detailSuccess(student: Student): StudentResult {
  return { ok: true, student, message: "" };
}

function tutorFailure(
  kind: StudentFailureKind,
  message: string,
): StudentTutorResult {
  return { ok: false, kind, status: null, message };
}

function actionFailure(
  kind: StudentActionFailureKind,
  message: string,
): StudentActionResult {
  return { ok: false, kind, status: null, message };
}

test("un listado denegado se informa como acceso denegado", () => {
  const state = toStudentListState(
    listFailure("forbidden", "Sin permisos."),
    { students: [], page: null, hasFilters: false },
  );

  assert.deepEqual(state, {
    status: "forbidden",
    message: "Sin permisos.",
  });
});

test("los fallos de listado distintos de la denegación son error", () => {
  for (const kind of ["unauthorized", "not_found", "failed"] as const) {
    const state = toStudentListState(
      listFailure(kind, "No se pudo cargar."),
      { students: [], page: null, hasFilters: false },
    );

    assert.deepEqual(state, {
      status: "error",
      message: "No se pudo cargar.",
    });
  }
});

test("un listado con alumnos pasa a listo con la página visible", () => {
  const students = [makeStudent("s-1"), makeStudent("s-2")];
  const page = makePage(students);
  const state = toStudentListState(listSuccess(students), {
    students,
    page,
    hasFilters: false,
  });

  assert.equal(state.status, "ready");

  if (state.status === "ready") {
    assert.deepEqual(state.students, students);
    assert.deepEqual(state.page, page);
  }
});

test("sin alumnos y sin filtros se muestra vacío, con o sin página", () => {
  const withoutPage = toStudentListState(listSuccess([]), {
    students: [],
    page: null,
    hasFilters: false,
  });
  const withPage = toStudentListState(listSuccess([]), {
    students: [],
    page: makePage([]),
    hasFilters: false,
  });

  assert.deepEqual(withoutPage, { status: "empty", page: null });
  assert.equal(withPage.status, "empty");

  if (withPage.status === "empty") {
    assert.equal(withPage.page?.total, 0);
  }
});

test("sin coincidencias con filtros activos se distingue del vacío", () => {
  const state = toStudentListState(listSuccess([]), {
    students: [],
    page: makePage([]),
    hasFilters: true,
  });

  assert.equal(state.status, "no_results");
});

test("los filtros sin página visible no producen sin coincidencias", () => {
  const state = toStudentListState(listSuccess([]), {
    students: [],
    page: null,
    hasFilters: true,
  });

  assert.deepEqual(state, { status: "empty", page: null });
});

test("un error de listado nunca se muestra como vacío", () => {
  const state = toStudentListState(
    listFailure("failed", "Fallo."),
    { students: [], page: null, hasFilters: true },
  );

  assert.notEqual(state.status, "empty");
  assert.equal(state.status, "error");
});

test("el detalle traduce denegación, no encontrado y error", () => {
  assert.deepEqual(
    toStudentDetailState(detailFailure("forbidden", "Sin permisos.")),
    { status: "forbidden", message: "Sin permisos." },
  );
  assert.deepEqual(
    toStudentDetailState(detailFailure("not_found", "No existe.")),
    { status: "not_found" },
  );
  assert.deepEqual(
    toStudentDetailState(detailFailure("failed", "Fallo.")),
    { status: "error", message: "Fallo." },
  );
});

test("el detalle listo incorpora los datos del tutor cuando existen", () => {
  const student = makeStudent();
  const tutor = {
    name: "Andrés",
    lastname: "Pérez",
    email: "andres@example.com",
    user_phone: "3875123159",
  };
  const state = toStudentDetailState(detailSuccess(student), {
    ok: true,
    tutor,
    message: "",
  });

  assert.deepEqual(state, { status: "ready", student, tutor });
});

test("un fallo del tutor no invalida el detalle", () => {
  const student = makeStudent();
  const state = toStudentDetailState(
    detailSuccess(student),
    tutorFailure("not_found", "Sin tutor."),
  );

  assert.deepEqual(state, {
    status: "ready",
    student,
    tutor: null,
  });
});

test("el detalle sin consulta de tutor queda sin tutor", () => {
  const student = makeStudent();
  const state = toStudentDetailState(detailSuccess(student));

  assert.deepEqual(state, {
    status: "ready",
    student,
    tutor: null,
  });
});

test("una escritura exitosa conserva el alumno cuando lo devuelve", () => {
  const student = makeStudent();
  const withStudent = toStudentActionState({
    ok: true,
    message: "Alumno registrado correctamente",
    student,
  });
  const withoutStudent = toStudentActionState({
    ok: true,
    message: "Alumno actualizado correctamente",
  });

  assert.deepEqual(withStudent, {
    status: "success",
    message: "Alumno registrado correctamente",
    student,
  });
  assert.deepEqual(withoutStudent, {
    status: "success",
    message: "Alumno actualizado correctamente",
  });
});

test("una validación conserva los errores por campo", () => {
  const withErrors = toStudentActionState({
    ok: false,
    kind: "validation",
    status: 422,
    message: "Revisá los datos.",
    fieldErrors: { studentDni: "El DNI ya existe." },
  });
  const withoutErrors = toStudentActionState(
    actionFailure("validation", "Revisá los datos."),
  );

  assert.deepEqual(withErrors, {
    status: "validation",
    message: "Revisá los datos.",
    fieldErrors: { studentDni: "El DNI ya existe." },
  });
  assert.deepEqual(withoutErrors, {
    status: "validation",
    message: "Revisá los datos.",
    fieldErrors: {},
  });
});

test("los fallos de escritura se clasifican de forma excluyente", () => {
  assert.deepEqual(
    toStudentActionState(actionFailure("forbidden", "No permitido.")),
    { status: "forbidden", message: "No permitido." },
  );
  assert.deepEqual(
    toStudentActionState(actionFailure("not_found", "No existe.")),
    { status: "not_found", message: "No existe." },
  );

  for (const kind of ["unauthorized", "failed"] as const) {
    assert.deepEqual(
      toStudentActionState(actionFailure(kind, "Fallo.")),
      { status: "error", message: "Fallo." },
    );
  }
});
