import type { CourseReportRow } from "./types.ts";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

/** Total del reporte o «No disponible» si el backend no lo informa. */
export function formatReportTotal(total: number | null): string {
  return total === null
    ? "No disponible"
    : NUMBER_FORMATTER.format(total);
}

/** Número de orden secuencial de la tabla. */
export function formatReportOrder(index: number): number {
  return index + 1;
}

/** Valor de alumno o «No informado» cuando falta. */
export function formatReportValue(value: string | null): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "No informado";
}

/** Alumno como «Apellido, Nombre» con los datos disponibles. */
export function formatStudentName(row: CourseReportRow): string {
  const lastname = row.lastname?.trim() ?? "";
  const name = row.name?.trim() ?? "";

  if (lastname.length > 0 && name.length > 0) {
    return `${lastname}, ${name}`;
  }

  if (lastname.length > 0) {
    return lastname;
  }

  if (name.length > 0) {
    return name;
  }

  return "No informado";
}
