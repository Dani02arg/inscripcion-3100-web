import type { Course } from "../courses/types.ts";
import {
  getCycleLabel,
  getShiftLabel,
  getSpecialityLabel,
  getShiftOrder,
  getStatusLabel,
} from "../courses/labels.ts";
import type { UserSummary } from "../users/types.ts";
import type { SidebarNavItem } from "../sidebar/types.ts";
import { NOTIFICATIONS_PATH } from "../sidebar/navigation.ts";
import type {
  NotificationDraft,
  NotificationFilter,
  NotificationItem,
} from "./types.ts";

/** Cantidad de notificaciones no leídas. */
export function countUnreadNotifications(
  items: readonly NotificationItem[],
): number {
  return items.filter((item) => !item.isRead).length;
}

/** Asigna el badge solo a la opción de notificaciones. */
export function withNotificationBadge(
  items: readonly SidebarNavItem[],
  count: number | null,
): readonly SidebarNavItem[] {
  const badge =
    count !== null && Number.isSafeInteger(count) && count >= 0 ? count : null;

  return items.map((item) =>
    item.href === NOTIFICATIONS_PATH
      ? { ...item, ...(badge === null ? {} : { badge }) }
      : item,
  );
}

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

/** Orden descendente por envío y ascendente por id ante empate. */
export function sortNotificationsNewestFirst(
  items: readonly NotificationItem[],
): readonly NotificationItem[] {
  return [...items].sort((left, right) => {
    const difference = parseTimestamp(right.sentAt) - parseTimestamp(left.sentAt);

    if (difference !== 0) {
      return difference;
    }

    return left.id.localeCompare(right.id);
  });
}

/** Filtra por «Todas» o «No leídas». */
export function filterNotifications(
  items: readonly NotificationItem[],
  filter: NotificationFilter,
): readonly NotificationItem[] {
  return filter === "unread"
    ? items.filter((item) => !item.isRead)
    : items;
}

export type NotificationListState =
  | { readonly kind: "empty" }
  | { readonly kind: "no_unread" }
  | {
      readonly kind: "ready";
      readonly items: readonly NotificationItem[];
    };

/** Resuelve el vacío correcto según la lista total y el filtro. */
export function resolveNotificationListState(
  items: readonly NotificationItem[],
  filter: NotificationFilter,
): NotificationListState {
  if (items.length === 0) {
    return { kind: "empty" };
  }

  const visible = filterNotifications(items, filter);

  if (filter === "unread" && visible.length === 0) {
    return { kind: "no_unread" };
  }

  return { kind: "ready", items: visible };
}

/** Reemplaza una notificación por la versión devuelta por el servicio. */
export function applyNotificationRead(
  items: readonly NotificationItem[],
  updated: NotificationItem,
): readonly NotificationItem[] {
  return items.map((item) => (item.id === updated.id ? updated : item));
}

export interface CloseAfterReadResult {
  readonly items: readonly NotificationItem[];
  readonly nextFocusId: string | null;
}

/**
 * Al cerrar el detalle, retira la notificación leída si el filtro es
 * «No leídas» y calcula el siguiente foco disponible.
 */
export function resolveCloseAfterRead(
  items: readonly NotificationItem[],
  filter: NotificationFilter,
  notificationId: string,
): CloseAfterReadResult {
  if (filter !== "unread") {
    return { items, nextFocusId: notificationId };
  }

  const visible = filterNotifications(items, filter);
  const index = visible.findIndex((item) => item.id === notificationId);

  if (index < 0) {
    return { items, nextFocusId: notificationId };
  }

  const remaining = items.filter((item) => item.id !== notificationId);
  const visibleAfter = filterNotifications(remaining, filter);
  const next =
    visibleAfter[index] ??
    visibleAfter[index - 1] ??
    null;

  return {
    items: remaining,
    nextFocusId: next?.id ?? null,
  };
}

export const NOTIFICATION_SEARCH_RESULT_LIMIT = 4;

/** Normaliza texto para comparar sin mayúsculas ni acentos. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function buildCourseSearchText(course: Course): string {
  return normalizeSearchText(
    [
      buildNotificationCourseLabel(course),
      course.code ?? "",
      course.year,
      course.studyYear,
      course.division,
      course.cycle,
      getCycleLabel(course.cycle),
      course.speciality,
      getSpecialityLabel(course.speciality),
      course.shift,
      getShiftLabel(course.shift),
      course.status,
      getStatusLabel(course.status),
    ].join(" "),
  );
}

/** Filtra cursos por etiqueta, código, año, división, ciclo, especialidad, turno o estado. */
export function filterCoursesByQuery(
  courses: readonly Course[],
  query: string,
): readonly Course[] {
  const normalized = normalizeSearchText(query);

  if (normalized.length === 0) {
    return courses;
  }

  return courses.filter((course) =>
    buildCourseSearchText(course).includes(normalized),
  );
}

/** Ordena tutores por apellido y nombre. */
export function sortTutorsByName(
  users: readonly UserSummary[],
): readonly UserSummary[] {
  return [...users].sort((left, right) => {
    const lastname = normalizeSearchText(left.lastname).localeCompare(
      normalizeSearchText(right.lastname),
      "es",
    );

    if (lastname !== 0) {
      return lastname;
    }

    return normalizeSearchText(left.name).localeCompare(
      normalizeSearchText(right.name),
      "es",
    );
  });
}

/** Filtra tutores por nombre, apellido, DNI, CUIL o correo en coincidencia parcial. */
export function filterTutorsByQuery(
  users: readonly UserSummary[],
  query: string,
): readonly UserSummary[] {
  const normalized = normalizeSearchText(query);
  const digits = onlyDigits(query);

  if (normalized.length === 0) {
    return sortTutorsByName(users);
  }

  return sortTutorsByName(
    users.filter((user) => {
      const haystack = normalizeSearchText(
        [
          user.name,
          user.lastname,
          user.email ?? "",
          user.dni ?? "",
          user.cuil ?? "",
        ].join(" "),
      );

      if (haystack.includes(normalized)) {
        return true;
      }

      if (digits.length === 0) {
        return false;
      }

      return (
        onlyDigits(user.dni ?? "").includes(digits) ||
        onlyDigits(user.cuil ?? "").includes(digits)
      );
    }),
  );
}

export interface LimitedSearchResults<T> {
  readonly items: readonly T[];
  readonly total: number;
}

/** Recorta a cuatro coincidencias y conserva el total. */
export function limitSearchResults<T>(
  items: readonly T[],
  max = NOTIFICATION_SEARCH_RESULT_LIMIT,
): LimitedSearchResults<T> {
  const safeMax = Number.isSafeInteger(max) && max > 0 ? max : 4;

  return {
    items: items.slice(0, safeMax),
    total: items.length,
  };
}

/** Filtra cursos del año lectivo vigente, deduplicados por id. */
export function selectCurrentYearCourses(
  courses: readonly Course[],
  year: number,
): readonly Course[] {
  const seen = new Set<string>();
  const selected: Course[] = [];

  for (const course of courses) {
    if (course.year !== year || seen.has(course.id)) {
      continue;
    }

    seen.add(course.id);
    selected.push(course);
  }

  return selected.sort((left, right) => {
    if (left.studyYear !== right.studyYear) {
      return left.studyYear - right.studyYear;
    }

    const division = left.division.localeCompare(right.division, "es");

    if (division !== 0) {
      return division;
    }

    const shift = getShiftOrder(left.shift) - getShiftOrder(right.shift);

    if (shift !== 0) {
      return shift;
    }

    return (left.code ?? "").localeCompare(right.code ?? "", "es");
  });
}

/** Etiqueta del curso para el selector. */
export function buildNotificationCourseLabel(course: Course): string {
  const parts = [
    `Curso ${course.studyYear}° ${course.division}`,
    getSpecialityLabel(course.speciality),
    getShiftLabel(course.shift),
  ];

  if (course.status !== "active") {
    parts.push("Inactivo");
  }

  return `${parts.join(" · ")}${course.code ? ` (${course.code})` : ""}`;
}

/** Indica si el borrador tiene datos que merezcan confirmación de descarte. */
export function hasNotificationDraft(draft: NotificationDraft): boolean {
  return (
    draft.audience !== null ||
    draft.courseId !== null ||
    draft.recipient !== null ||
    draft.title.trim().length > 0 ||
    draft.content.trim().length > 0 ||
    draft.attachment !== null
  );
}
