import assert from "node:assert/strict";
import { test } from "node:test";

import type { Course } from "../../app/lib/courses/types.ts";
import type { NotificationItem } from "../../app/lib/notifications/types.ts";
import type { UserSummary } from "../../app/lib/users/types.ts";
import {
  applyNotificationRead,
  buildNotificationCourseLabel,
  countUnreadNotifications,
  filterCoursesByQuery,
  filterNotifications,
  filterTutorsByQuery,
  hasNotificationDraft,
  limitSearchResults,
  normalizeSearchText,
  resolveCloseAfterRead,
  resolveNotificationListState,
  selectCurrentYearCourses,
  sortNotificationsNewestFirst,
  sortTutorsByName,
} from "../../app/lib/notifications/rules.ts";

function makeItem(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: "n1",
    title: "Aviso",
    content: "Contenido",
    isRead: false,
    readAt: null,
    hasAttachment: false,
    attachmentUrl: null,
    sentAt: "2026-11-02T14:30:00+00:00",
    ...overrides,
  };
}

function makeTutor(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: "u1",
    role: "TUTOR",
    name: "Ana",
    lastname: "Pérez",
    dni: "12345678",
    cuil: null,
    email: "ana@example.com",
    ...overrides,
  };
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "c1",
    code: "2026-1-1",
    year: 2026,
    studyYear: 1,
    division: "1",
    cycle: "basic",
    speciality: "informatics",
    shift: "morning",
    maxCapacity: 30,
    currentCapacity: 10,
    availablePlaces: 20,
    status: "active",
    ...overrides,
  };
}

test("cuenta no leídas y descarta valores negativos del badge", () => {
  const items = [
    makeItem({ id: "a", isRead: false }),
    makeItem({ id: "b", isRead: true }),
    makeItem({ id: "c", isRead: false }),
  ];

  assert.equal(countUnreadNotifications(items), 2);
});

test("ordena por fecha descendente y desempata por id ascendente", () => {
  const items = [
    makeItem({ id: "b", sentAt: "2026-11-02T14:30:00+00:00" }),
    makeItem({ id: "a", sentAt: "2026-11-02T14:30:00+00:00" }),
    makeItem({ id: "c", sentAt: "2026-11-03T10:00:00+00:00" }),
  ];

  assert.deepEqual(
    sortNotificationsNewestFirst(items).map((item) => item.id),
    ["c", "a", "b"],
  );
});

test("filtra todas y no leídas", () => {
  const items = [
    makeItem({ id: "a", isRead: false }),
    makeItem({ id: "b", isRead: true }),
  ];

  assert.equal(filterNotifications(items, "all").length, 2);
  assert.deepEqual(
    filterNotifications(items, "unread").map((item) => item.id),
    ["a"],
  );
});

test("resuelve vacío de bandeja, vacío de no leídas y lista visible", () => {
  assert.deepEqual(resolveNotificationListState([], "unread"), {
    kind: "empty",
  });

  const readOnly = [makeItem({ isRead: true })];
  assert.deepEqual(resolveNotificationListState(readOnly, "unread"), {
    kind: "no_unread",
  });

  const state = resolveNotificationListState(readOnly, "all");
  assert.equal(state.kind, "ready");
});

test("aplica la notificación leída devuelta por el servicio", () => {
  const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
  const updated = makeItem({
    id: "a",
    isRead: true,
    readAt: "2026-11-02T15:00:00+00:00",
  });

  const result = applyNotificationRead(items, updated);

  assert.equal(result[0]?.isRead, true);
  assert.equal(result[0]?.readAt, "2026-11-02T15:00:00+00:00");
  assert.equal(result[1]?.isRead, false);
});

test("al cerrar con filtro no leídas retira el elemento y calcula el foco", () => {
  const items = [
    makeItem({ id: "a", isRead: true, readAt: "2026-11-02T15:00:00+00:00" }),
    makeItem({ id: "b" }),
    makeItem({ id: "c", isRead: true, readAt: "2026-11-02T15:00:00+00:00" }),
    makeItem({ id: "d" }),
  ];

  const result = resolveCloseAfterRead(items, "unread", "b");

  assert.deepEqual(
    result.items.map((item) => item.id),
    ["a", "c", "d"],
  );
  assert.equal(result.nextFocusId, "d");

  const last = resolveCloseAfterRead(
    [makeItem({ id: "a" }), makeItem({ id: "b" })],
    "unread",
    "b",
  );
  assert.equal(last.nextFocusId, "a");

  const empty = resolveCloseAfterRead([makeItem({ id: "a" })], "unread", "a");
  assert.equal(empty.nextFocusId, null);
});

test("sin eliminar, el foco queda en la misma notificación", () => {
  const items = [makeItem({ id: "a", isRead: true })];
  const result = resolveCloseAfterRead(items, "all", "a");

  assert.equal(result.items, items);
  assert.equal(result.nextFocusId, "a");
});

test("normaliza mayúsculas y acentos para buscar", () => {
  assert.equal(normalizeSearchText("  Pérez  "), "perez");
  assert.equal(normalizeSearchText("ELECTRÓNICA"), "electronica");
  assert.equal(normalizeSearchText(""), "");
});

test("filtra cursos por etiqueta, código, especialidad, turno y estado", () => {
  const courses = [
    makeCourse({ id: "c1", speciality: "informatics", shift: "morning" }),
    makeCourse({
      id: "c2",
      speciality: "electronics",
      shift: "afternoon",
      status: "inactive",
      code: "2026-4-1-SUP-ELE-T",
    }),
  ];

  assert.deepEqual(
    filterCoursesByQuery(courses, "ELECTRONICA").map((course) => course.id),
    ["c2"],
  );
  assert.deepEqual(
    filterCoursesByQuery(courses, "2026-4-1").map((course) => course.id),
    ["c2"],
  );
  assert.deepEqual(
    filterCoursesByQuery(courses, "inactivo").map((course) => course.id),
    ["c2"],
  );
  assert.deepEqual(
    filterCoursesByQuery(courses, "  ").map((course) => course.id),
    ["c1", "c2"],
  );
});

test("filtra tutores por nombre, apellido, DNI, CUIL y correo parcial", () => {
  const users = [
    makeTutor({
      id: "t1",
      name: "Ana",
      lastname: "Pérez",
      dni: "45896864",
      cuil: "75855273263",
      email: "ana@example.com",
    }),
    makeTutor({
      id: "t2",
      name: "Bruno",
      lastname: "Gómez",
      dni: "11111111",
      cuil: "20111111112",
      email: "bruno@example.com",
    }),
  ];

  assert.deepEqual(
    filterTutorsByQuery(users, "perez").map((user) => user.id),
    ["t1"],
  );
  assert.deepEqual(
    filterTutorsByQuery(users, "GOMEZ").map((user) => user.id),
    ["t2"],
  );
  assert.deepEqual(
    filterTutorsByQuery(users, "4589").map((user) => user.id),
    ["t1"],
  );
  assert.deepEqual(
    filterTutorsByQuery(users, "7585").map((user) => user.id),
    ["t1"],
  );
  assert.deepEqual(
    filterTutorsByQuery(users, "bruno@").map((user) => user.id),
    ["t2"],
  );
});

test("ordena tutores por apellido y nombre", () => {
  const users = [
    makeTutor({ id: "b", lastname: "Zárate", name: "Ana" }),
    makeTutor({ id: "a", lastname: "Gómez", name: "Zoe" }),
    makeTutor({ id: "c", lastname: "Álvarez", name: "Luis" }),
  ];

  assert.deepEqual(
    sortTutorsByName(users).map((user) => user.id),
    ["c", "a", "b"],
  );
});

test("recorta a cuatro coincidencias y conserva el total", () => {
  const items = Array.from({ length: 7 }, (_, index) => index);
  const limited = limitSearchResults(items);

  assert.equal(limited.items.length, 4);
  assert.equal(limited.total, 7);
  assert.deepEqual(limited.items, [0, 1, 2, 3]);
});

test("selecciona cursos del año, deduplica y ordena", () => {
  const courses = [
    makeCourse({ id: "c3", studyYear: 2, division: "2", shift: "afternoon" }),
    makeCourse({ id: "c1", studyYear: 1, division: "1", shift: "afternoon" }),
    makeCourse({ id: "c2", studyYear: 1, division: "1", shift: "morning" }),
    makeCourse({ id: "c1", studyYear: 1, division: "1", shift: "afternoon" }),
    makeCourse({ id: "old", year: 2025 }),
    makeCourse({ id: "inactive", status: "inactive" }),
  ];

  assert.deepEqual(
    selectCurrentYearCourses(courses, 2026).map((course) => course.id),
    ["c2", "inactive", "c1", "c3"],
  );
});

test("la etiqueta del curso marca inactivos", () => {
  assert.match(
    buildNotificationCourseLabel(makeCourse()),
    /Curso 1° 1/,
  );
  assert.match(
    buildNotificationCourseLabel(makeCourse({ status: "inactive" })),
    /Inactivo/,
  );
});

test("detecta si hay borrador para confirmar el descarte", () => {
  assert.equal(
    hasNotificationDraft({
      audience: null,
      courseId: null,
      recipient: null,
      title: "",
      content: "",
      attachment: null,
    }),
    false,
  );

  assert.equal(
    hasNotificationDraft({
      audience: "allTutors",
      courseId: null,
      recipient: null,
      title: "",
      content: "",
      attachment: null,
    }),
    true,
  );
});
