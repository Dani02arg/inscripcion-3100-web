import { formatDisplayDate } from "../validation/register.ts";
import type { Gender, Student } from "./types.ts";

/** Texto para un dato opcional sin informar. */
export const STUDENT_NO_INFO_LABEL = "No informado";

/** Texto para un valor que el servicio devuelve fuera de lo documentado. */
export const STUDENT_UNKNOWN_LABEL = "No disponible";

/** Opciones de género del formulario. */
export const GENDER_OPTIONS = Object.freeze([
  Object.freeze({ value: "Masculino", label: "Masculino" }),
  Object.freeze({ value: "Femenino", label: "Femenino" }),
  Object.freeze({ value: "Otro", label: "Otro" }),
] as const satisfies readonly { readonly value: Gender; readonly label: string }[]);

/** Avisos de resultado del módulo. */
export const STUDENT_NOTICES = Object.freeze({
  created: "Alumno registrado correctamente",
  updated: "Alumno actualizado correctamente",
} as const);

/** Textos del diálogo de baja no disponible. */
export const STUDENT_DELETE_UNAVAILABLE = Object.freeze({
  title: "Baja no disponible",
  message:
    "La baja de alumnos todavía no está disponible en el servicio. El alumno no fue eliminado.",
  action: "Entendido",
} as const);

/** Indica si el valor es uno de los géneros documentados. */
export function isGender(value: unknown): value is Gender {
  return (
    typeof value === "string" &&
    GENDER_OPTIONS.some((option) => option.value === value)
  );
}

/** Devuelve «Nombre Apellido», o «No informado» si no hay nombre utilizable. */
export function formatStudentFullName(
  student: Pick<Student, "firstName" | "lastName">,
): string {
  const parts = [student.firstName, student.lastName]
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return parts.length > 0 ? parts.join(" ") : STUDENT_NO_INFO_LABEL;
}

/** Devuelve «Apellido, Nombre», o «No informado» si no hay nombre utilizable. */
export function formatStudentSortName(
  student: Pick<Student, "firstName" | "lastName">,
): string {
  const lastname = student.lastName.trim();
  const firstName = student.firstName.trim();

  if (lastname.length > 0 && firstName.length > 0) {
    return `${lastname}, ${firstName}`;
  }

  if (lastname.length > 0) {
    return lastname;
  }

  if (firstName.length > 0) {
    return firstName;
  }

  return STUDENT_NO_INFO_LABEL;
}

/** Nombre accesible del menú de acciones de una fila. */
export function getStudentRowActionsLabel(
  student: Pick<Student, "firstName" | "lastName">,
): string {
  return `Acciones de ${formatStudentSortName(student)}`;
}

/** Normaliza un dato de texto opcional y aplica «No informado». */
export function formatStudentText(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") {
    return STUDENT_NO_INFO_LABEL;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : STUDENT_NO_INFO_LABEL;
}

/** Presenta una fecha ISO como DD/MM/AAAA sin desplazarla por zona horaria. */
export function formatStudentDate(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") {
    return STUDENT_NO_INFO_LABEL;
  }

  return formatDisplayDate(value) || STUDENT_NO_INFO_LABEL;
}

/** Presenta el género documentado o «No disponible» si no se reconoce. */
export function formatStudentGender(
  value: string | null | undefined,
): string {
  return isGender(value) ? value : STUDENT_UNKNOWN_LABEL;
}
