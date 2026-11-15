import { cache } from "react";

import {
  getPendingRegistrationsTotal,
  getRegistration,
  listAllRegistrations,
  listAvailableCourses,
} from "../api/registrations.ts";
import { getStudentTutor } from "../api/students.ts";
import type {
  AvailableCourse,
  RegistrationDetailResult,
  RegistrationListResult,
  RegistrationTutor,
} from "./types.ts";

/** Carga memoizada por render del padrón completo de inscripciones. */
export const getRegistrationListData = cache(
  async (token: string): Promise<RegistrationListResult> =>
    listAllRegistrations(token),
);

/** Carga memoizada por render del detalle de una inscripción. */
export const getRegistrationDetailData = cache(
  async (
    token: string,
    registrationId: string,
  ): Promise<RegistrationDetailResult> =>
    getRegistration(token, registrationId),
);

/** Carga memoizada del tutor responsable; un fallo devuelve `null`. */
export const getRegistrationTutorData = cache(
  async (token: string, studentId: string): Promise<RegistrationTutor | null> => {
    const result = await getStudentTutor(token, studentId);
    return result.ok ? result.tutor : null;
  },
);

/** Carga memoizada de los cursos activos con cupo del año indicado. */
export const getAvailableCoursesData = cache(
  async (token: string, year: number): Promise<AvailableCourse[] | null> =>
    listAvailableCourses(token, year),
);

/** Carga memoizada del total de solicitudes pendientes. */
export const getPendingRegistrationsTotalData = cache(
  async (token: string): Promise<number | null> =>
    getPendingRegistrationsTotal(token),
);
