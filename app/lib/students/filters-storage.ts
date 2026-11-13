import {
  STUDENT_IDENTIFIER_MAX_LENGTH,
  isStudentIdentifierInput,
} from "./list.ts";
import type { StudentFilters } from "./types.ts";

/** Clave de la pestaña para los filtros que no van en la dirección. */
export const STUDENT_FILTERS_STORAGE_KEY = "student_filters";

/** Filtros que se conservan solo durante la pestaña. */
export type StudentSensitiveFilters = Pick<
  StudentFilters,
  "studentDni" | "studentCuil"
>;

/** Almacenamiento mínimo compatible con `sessionStorage`. */
export interface StudentFiltersStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function emptySensitiveFilters(): StudentSensitiveFilters {
  return { studentDni: "", studentCuil: "" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIdentifier(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return isStudentIdentifierInput(trimmed, maxLength) ? trimmed : "";
}

/** Valida y normaliza lo guardado; cualquier dato inválido queda vacío. */
export function parseStoredStudentFilters(
  value: string | null | undefined,
): StudentSensitiveFilters {
  if (!value) {
    return emptySensitiveFilters();
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return emptySensitiveFilters();
  }

  if (!isRecord(parsed)) {
    return emptySensitiveFilters();
  }

  return {
    studentDni: readIdentifier(
      parsed.studentDni,
      STUDENT_IDENTIFIER_MAX_LENGTH.studentDni,
    ),
    studentCuil: readIdentifier(
      parsed.studentCuil,
      STUDENT_IDENTIFIER_MAX_LENGTH.studentCuil,
    ),
  };
}

/** Serializa solo los identificadores válidos y no vacíos. */
export function serializeStudentFiltersForStorage(
  filters: StudentSensitiveFilters,
): string {
  const studentDni = readIdentifier(
    filters.studentDni,
    STUDENT_IDENTIFIER_MAX_LENGTH.studentDni,
  );
  const studentCuil = readIdentifier(
    filters.studentCuil,
    STUDENT_IDENTIFIER_MAX_LENGTH.studentCuil,
  );

  return JSON.stringify({
    ...(studentDni.length > 0 ? { studentDni } : {}),
    ...(studentCuil.length > 0 ? { studentCuil } : {}),
  });
}

function getDefaultStorage(): StudentFiltersStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Lee los filtros de la pestaña; nunca lanza. */
export function readStudentFilters(
  storage: StudentFiltersStorage | null = getDefaultStorage(),
): StudentSensitiveFilters {
  if (!storage) {
    return emptySensitiveFilters();
  }

  try {
    return parseStoredStudentFilters(
      storage.getItem(STUDENT_FILTERS_STORAGE_KEY),
    );
  } catch {
    return emptySensitiveFilters();
  }
}

/**
 * Guarda los filtros en la pestaña. Si ambos quedan vacíos, elimina la clave.
 * Un fallo de cuota o de almacenamiento no se propaga.
 */
export function writeStudentFilters(
  filters: StudentSensitiveFilters,
  storage: StudentFiltersStorage | null = getDefaultStorage(),
): void {
  if (!storage) {
    return;
  }

  const serialized = serializeStudentFiltersForStorage(filters);

  try {
    if (serialized === "{}") {
      storage.removeItem(STUDENT_FILTERS_STORAGE_KEY);
      return;
    }

    storage.setItem(STUDENT_FILTERS_STORAGE_KEY, serialized);
  } catch {
    // El almacenamiento puede estar bloqueado o sin cuota.
  }
}

/** Elimina los filtros guardados; nunca lanza. */
export function clearStudentFiltersStorage(
  storage: StudentFiltersStorage | null = getDefaultStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(STUDENT_FILTERS_STORAGE_KEY);
  } catch {
    // El almacenamiento puede estar bloqueado.
  }
}
