import {
  REGISTRATION_IDENTIFIER_MAX_LENGTH,
  isRegistrationIdentifierInput,
} from "./list.ts";
import type { RegistrationFilters } from "./types.ts";

/** Clave de la pestaña para los filtros que no van en la dirección. */
export const REGISTRATION_FILTERS_STORAGE_KEY = "registration_filters";

/** Filtros que se conservan solo durante la pestaña. */
export type RegistrationSensitiveFilters = Pick<
  RegistrationFilters,
  "studentDni" | "studentCuil"
>;

/** Almacenamiento mínimo compatible con `sessionStorage`. */
export interface RegistrationFiltersStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function emptySensitiveFilters(): RegistrationSensitiveFilters {
  return { studentDni: "", studentCuil: "" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIdentifier(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return isRegistrationIdentifierInput(trimmed, maxLength) ? trimmed : "";
}

/** Valida y normaliza lo guardado; cualquier dato inválido queda vacío. */
export function parseStoredRegistrationIdentifiers(
  value: string | null | undefined,
): RegistrationSensitiveFilters {
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
      REGISTRATION_IDENTIFIER_MAX_LENGTH.studentDni,
    ),
    studentCuil: readIdentifier(
      parsed.studentCuil,
      REGISTRATION_IDENTIFIER_MAX_LENGTH.studentCuil,
    ),
  };
}

function serializeIdentifiers(filters: RegistrationSensitiveFilters): string {
  const studentDni = readIdentifier(
    filters.studentDni,
    REGISTRATION_IDENTIFIER_MAX_LENGTH.studentDni,
  );
  const studentCuil = readIdentifier(
    filters.studentCuil,
    REGISTRATION_IDENTIFIER_MAX_LENGTH.studentCuil,
  );

  return JSON.stringify({
    ...(studentDni.length > 0 ? { studentDni } : {}),
    ...(studentCuil.length > 0 ? { studentCuil } : {}),
  });
}

function getDefaultStorage(): RegistrationFiltersStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Lee los identificadores de la pestaña; nunca lanza. */
export function readStoredIdentifiers(
  storage: RegistrationFiltersStorage | null = getDefaultStorage(),
): RegistrationSensitiveFilters {
  if (!storage) {
    return emptySensitiveFilters();
  }

  try {
    return parseStoredRegistrationIdentifiers(
      storage.getItem(REGISTRATION_FILTERS_STORAGE_KEY),
    );
  } catch {
    return emptySensitiveFilters();
  }
}

/** Guarda los identificadores; si ambos quedan vacíos, elimina la clave. */
export function writeStoredIdentifiers(
  filters: RegistrationSensitiveFilters,
  storage: RegistrationFiltersStorage | null = getDefaultStorage(),
): void {
  if (!storage) {
    return;
  }

  const serialized = serializeIdentifiers(filters);

  try {
    if (serialized === "{}") {
      storage.removeItem(REGISTRATION_FILTERS_STORAGE_KEY);
      return;
    }

    storage.setItem(REGISTRATION_FILTERS_STORAGE_KEY, serialized);
  } catch {
    // El almacenamiento puede estar bloqueado o sin cuota.
  }
}

/** Elimina los identificadores guardados; nunca lanza. */
export function clearStoredIdentifiers(
  storage: RegistrationFiltersStorage | null = getDefaultStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(REGISTRATION_FILTERS_STORAGE_KEY);
  } catch {
    // El almacenamiento puede estar bloqueado.
  }
}
