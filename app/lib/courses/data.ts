import { cache } from "react";

import {
  getCourse,
  getCourseReport,
  listAllCourses,
} from "../api/courses.ts";
import type {
  CourseListResult,
  CourseReportResult,
  CourseResult,
} from "./types.ts";

/** Carga memoizada por render para el listado completo de cursos. */
export const getCourseListData = cache(
  async (token: string): Promise<CourseListResult> => listAllCourses(token),
);

/** Carga memoizada por render para el detalle de un curso. */
export const getCourseData = cache(
  async (token: string, courseId: string): Promise<CourseResult> =>
    getCourse(token, courseId),
);

/** Carga memoizada por render para el reporte de un curso. */
export const getCourseReportData = cache(
  async (token: string, courseId: string): Promise<CourseReportResult> =>
    getCourseReport(token, courseId),
);
