import { cache } from "react";

import { listAllCourses } from "../api/courses.ts";
import { listNotifications } from "../api/notifications.ts";
import { listAllTutors } from "../api/users.ts";
import {
  countUnreadNotifications,
  selectCurrentYearCourses,
} from "./rules.ts";
import type {
  CourseOptionsResult,
  NotificationFailure,
  NotificationListResult,
  TutorDirectoryResult,
} from "./types.ts";

const TUTOR_DIRECTORY_ERROR_MESSAGE =
  "No pudimos cargar los tutores. Intentá nuevamente.";
const COURSES_ERROR_MESSAGE =
  "No pudimos cargar los cursos. Intentá nuevamente.";
const EMPTY_USER_FILTERS = Object.freeze({
  dni: "",
  cuil: "",
  name: "",
  lastname: "",
  email: "",
});

/** Carga memoizada por render de la bandeja propia. */
export const getNotificationsData = cache(
  async (token: string): Promise<NotificationListResult> =>
    listNotifications(token),
);

/** Conteo de no leídas a partir de la lista; `null` si no puede obtenerse. */
export const getNotificationBadgeCount = cache(
  async (token: string): Promise<number | null> => {
    const result = await listNotifications(token);

    return result.ok ? countUnreadNotifications(result.notifications) : null;
  },
);

function mapFailure(
  source: { readonly status: number | null; readonly message: string; readonly kind: string },
  fallback: string,
): NotificationFailure {
  if (source.kind === "unauthorized") {
    return {
      ok: false,
      kind: "unauthorized",
      status: source.status,
      message: source.message,
    };
  }

  if (source.kind === "forbidden") {
    return {
      ok: false,
      kind: "forbidden",
      status: source.status,
      message: source.message,
    };
  }

  return { ok: false, kind: "server", status: source.status, message: fallback };
}

/** Cursos del año vigente para el selector. */
export const getNotificationCoursesData = cache(
  async (token: string, year: number): Promise<CourseOptionsResult> => {
    const result = await listAllCourses(token);

    if (!result.ok) {
      return mapFailure(result, COURSES_ERROR_MESSAGE);
    }

    return {
      ok: true,
      courses: selectCurrentYearCourses(result.courses, year),
      message: result.message,
    };
  },
);

/** Directorio completo de tutores para el selector. */
export const getNotificationTutorsData = cache(
  async (token: string): Promise<TutorDirectoryResult> => {
    const result = await listAllTutors(token, EMPTY_USER_FILTERS);

    if (!result.ok) {
      if (result.kind === "unauthorized" || result.kind === "forbidden") {
        return {
          ok: false,
          kind: result.kind,
          status: result.status,
          message: result.message,
        };
      }

      return {
        ok: false,
        kind: "failed",
        status: result.status,
        message: TUTOR_DIRECTORY_ERROR_MESSAGE,
      };
    }

    return {
      ok: true,
      users: result.users,
      message: result.message,
    };
  },
);
