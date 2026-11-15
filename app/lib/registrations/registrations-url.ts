import { DEFAULT_STATUS_TAB, paramToStatus, statusToParam } from "./status.ts";
import type {
  RegistrationFilters,
  RegistrationStatusTab,
} from "./types.ts";

export const REGISTRATIONS_PATH = "/dashboard/registrations";

/** Parámetros no sensibles que se reflejan en la dirección. */
export const REGISTRATION_FILTER_PARAM_KEYS = [
  "firstName",
  "lastName",
  "year",
  "studyYear",
  "division",
  "cycle",
  "shift",
  "speciality",
] as const;

/** Parámetros de identificadores que se eliminan de la dirección si aparecen. */
export const REGISTRATION_SENSITIVE_PARAM_KEYS = [
  "studentDni",
  "studentCuil",
  "dni",
  "cuil",
] as const;

export interface RegistrationUrlState {
  readonly filters: RegistrationFilters;
  readonly tab: RegistrationStatusTab;
  readonly page: number;
}

function toSearchParams(input: URLSearchParams | string): URLSearchParams {
  return input instanceof URLSearchParams
    ? input
    : new URLSearchParams(input);
}

function parsePage(value: string | null): number {
  if (value === null) {
    return 1;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

const CYCLE_VALUES = new Set(["basic", "superior"]);
const SHIFT_VALUES = new Set(["morning", "afternoon", "night"]);
const SPECIALITY_VALUES = new Set(["basic", "informatics", "electronics"]);

function readEnumParam(
  value: string | null,
  allowed: ReadonlySet<string>,
): string {
  const trimmed = (value ?? "").trim();

  if (trimmed === "" || trimmed === "all") {
    return "all";
  }

  return allowed.has(trimmed) ? trimmed : "all";
}

function readYearParam(value: string | null): string {
  const trimmed = (value ?? "").trim();

  if (trimmed === "" || trimmed === "all") {
    return "all";
  }

  return /^\d{4}$/.test(trimmed) ? trimmed : "all";
}

function readStudyYearParam(value: string | null): string {
  const trimmed = (value ?? "").trim();

  if (trimmed === "" || trimmed === "all") {
    return "all";
  }

  return /^[1-6]$/.test(trimmed) ? trimmed : "all";
}

/** Lee la dirección y descarta valores inválidos; DNI y CUIL quedan vacíos. */
export function parseRegistrationsUrl(
  input: URLSearchParams | string,
): RegistrationUrlState {
  const params = toSearchParams(input);

  return {
    filters: {
      studentDni: "",
      studentCuil: "",
      firstName: (params.get("firstName") ?? "").trim(),
      lastName: (params.get("lastName") ?? "").trim(),
      year: readYearParam(params.get("year")),
      studyYear: readStudyYearParam(params.get("studyYear")),
      division: (params.get("division") ?? "").trim(),
      cycle: readEnumParam(params.get("cycle"), CYCLE_VALUES),
      shift: readEnumParam(params.get("shift"), SHIFT_VALUES),
      speciality: readEnumParam(params.get("speciality"), SPECIALITY_VALUES),
    },
    tab: paramToStatus(params.get("status")),
    page: parsePage(params.get("page")),
  };
}

/**
 * Escribe los filtros no sensibles, la pestaña y la página conservando
 * parámetros ajenos y eliminando cualquier identificador de la dirección.
 */
export function serializeRegistrationsFilters(
  filters: RegistrationFilters,
  tab: RegistrationStatusTab,
  page: number,
  existing?: URLSearchParams,
): string {
  const params = new URLSearchParams(existing);

  for (const key of REGISTRATION_FILTER_PARAM_KEYS) {
    params.delete(key);
  }

  for (const key of REGISTRATION_SENSITIVE_PARAM_KEYS) {
    params.delete(key);
  }

  params.delete("status");

  const firstName = filters.firstName.trim();
  if (firstName.length > 0) {
    params.set("firstName", firstName);
  }

  const lastName = filters.lastName.trim();
  if (lastName.length > 0) {
    params.set("lastName", lastName);
  }

  if (filters.year !== "all") {
    params.set("year", filters.year);
  }

  if (filters.studyYear !== "all") {
    params.set("studyYear", filters.studyYear);
  }

  const division = filters.division.trim();
  if (division.length > 0) {
    params.set("division", division);
  }

  if (filters.cycle !== "all") {
    params.set("cycle", filters.cycle);
  }

  if (filters.shift !== "all") {
    params.set("shift", filters.shift);
  }

  if (filters.speciality !== "all") {
    params.set("speciality", filters.speciality);
  }

  if (tab !== DEFAULT_STATUS_TAB) {
    params.set("status", statusToParam(tab));
  }

  if (Number.isSafeInteger(page) && page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

/** Dirección del listado con los filtros no sensibles, la pestaña y la página. */
export function getRegistrationsListPath(
  filters: RegistrationFilters,
  tab: RegistrationStatusTab,
  page: number,
  existing?: URLSearchParams,
): string {
  const query = serializeRegistrationsFilters(filters, tab, page, existing);
  return query.length > 0 ? `${REGISTRATIONS_PATH}?${query}` : REGISTRATIONS_PATH;
}

function encodeRegistrationId(registrationId: string): string {
  return encodeURIComponent(registrationId.trim());
}

/** Dirección del detalle; sin identificador vuelve al listado. */
export function registrationDetailPath(registrationId: string): string {
  const encoded = encodeRegistrationId(registrationId);
  return encoded.length > 0
    ? `${REGISTRATIONS_PATH}/${encoded}`
    : REGISTRATIONS_PATH;
}

/**
 * Solo acepta rutas internas del listado, con o sin query. Rechaza rutas
 * externas, doble barra, barras invertidas y subpantallas ajenas al listado.
 */
export function sanitizeRegistrationReturnPath(
  value: string | null | undefined,
): string {
  if (!value) {
    return REGISTRATIONS_PATH;
  }

  const lower = value.toLowerCase();

  if (
    !value.startsWith(REGISTRATIONS_PATH) ||
    lower.includes("//") ||
    lower.includes("%2f%2f") ||
    value.includes("\\")
  ) {
    return REGISTRATIONS_PATH;
  }

  const pathname = value.split("?", 1)[0] ?? "";

  if (
    pathname !== REGISTRATIONS_PATH &&
    pathname !== `${REGISTRATIONS_PATH}/`
  ) {
    return REGISTRATIONS_PATH;
  }

  return value;
}
