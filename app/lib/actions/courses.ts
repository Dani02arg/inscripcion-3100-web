"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cloneCourse,
  cloneCoursesByYear,
  createCourse,
  deleteCourse,
  setCourseStatus,
  updateCourse,
} from "../api/courses.ts";
import {
  cloneCourseActionCore,
  cloneYearActionCore,
  createCourseActionCore,
  deleteCourseActionCore,
  setCourseStatusActionCore,
  updateCourseActionCore,
} from "../courses/action-core.ts";
import { toCourseActionState } from "../courses/course-state.ts";
import { getCourseActionAccess } from "../courses/guard.ts";
import type {
  CourseActionState,
  CourseCloneYearResult,
  CourseFormActionState,
} from "../courses/types.ts";

/** Server Action de creación de cursos. */
export async function createCourseAction(
  previousState: CourseFormActionState,
  formData: FormData,
): Promise<CourseFormActionState> {
  return createCourseActionCore(previousState, formData, {
    getAccess: getCourseActionAccess,
    createCourse,
    redirect,
    revalidatePath: (path) => revalidatePath(path),
  });
}

/** Server Action de edición de cursos. */
export async function updateCourseAction(
  previousState: CourseFormActionState,
  formData: FormData,
): Promise<CourseFormActionState> {
  return updateCourseActionCore(previousState, formData, {
    getAccess: getCourseActionAccess,
    updateCourse,
    redirect,
    revalidatePath: (path) => revalidatePath(path),
  });
}

/** Server Action de clonación individual de cursos. */
export async function cloneCourseAction(
  _previousState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const result = await cloneCourseActionCore(
    null,
    formData,
    {
      getAccess: getCourseActionAccess,
      cloneCourse,
      redirect,
      revalidatePath: (path) => revalidatePath(path),
    },
  );

  return toCourseActionState(result);
}

/** Server Action de clonación masiva por año. */
export async function cloneYearAction(
  previousState: CourseCloneYearResult | null,
  formData: FormData,
): Promise<CourseCloneYearResult> {
  return cloneYearActionCore(previousState, formData, {
    getAccess: getCourseActionAccess,
    cloneCoursesByYear: (token, oldYear, attempted) =>
      cloneCoursesByYear(token, oldYear, {}, attempted),
    redirect,
    revalidatePath: (path) => revalidatePath(path),
  });
}

/** Server Action de eliminación lógica de cursos. */
export async function deleteCourseAction(
  _previousState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const result = await deleteCourseActionCore(
    null,
    formData,
    {
      getAccess: getCourseActionAccess,
      deleteCourse,
      redirect,
      revalidatePath: (path) => revalidatePath(path),
    },
  );

  return toCourseActionState(result);
}

/** Server Action de activación y desactivación de cursos. */
export async function setCourseStatusAction(
  _previousState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const result = await setCourseStatusActionCore(
    null,
    formData,
    {
      getAccess: getCourseActionAccess,
      setCourseStatus,
      redirect,
      revalidatePath: (path) => revalidatePath(path),
    },
  );

  return toCourseActionState(result);
}
