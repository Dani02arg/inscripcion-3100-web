"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { registerStudent, updateStudent } from "../api/students.ts";
import {
  createStudentActionCore,
  updateStudentActionCore,
  type StudentFormActionState,
} from "../students/action-core.ts";
import { getStudentActionAccess } from "../students/guard.ts";

export type { StudentFormActionState };

/**
 * Server Action para registrar un nuevo alumno a cargo del tutor.
 */
export async function registerStudentAction(
  previousState: StudentFormActionState,
  formData: FormData,
): Promise<StudentFormActionState> {
  return createStudentActionCore(previousState, formData, {
    getAccess: getStudentActionAccess,
    registerStudent,
    redirect,
    revalidatePath: (path) => revalidatePath(path),
  });
}

/**
 * Server Action para actualizar los datos de un alumno propio.
 */
export async function updateStudentAction(
  previousState: StudentFormActionState,
  formData: FormData,
): Promise<StudentFormActionState> {
  return updateStudentActionCore(previousState, formData, {
    getAccess: getStudentActionAccess,
    updateStudent,
    redirect,
    revalidatePath: (path) => revalidatePath(path),
  });
}