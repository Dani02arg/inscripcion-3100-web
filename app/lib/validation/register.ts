export type RegisterField =
  | "dni"
  | "cuil"
  | "name"
  | "lastname"
  | "email"
  | "password"
  | "confirmPassword"
  | "user_phone"
  | "birthdate";

export interface RegisterInput {
  dni: string;
  cuil: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  user_phone: string;
  birthdate: string;
}

export interface RegisterPayload {
  dni: string;
  cuil: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  user_phone: string;
  birthdate: string;
}

export type FieldErrors = Partial<Record<RegisterField, string>>;

export type BirthdateError =
  | "required"
  | "invalid"
  | "future"
  | "underage";

export interface RegisterValidationResult {
  valid: boolean;
  errors: FieldErrors;
  payload: RegisterPayload | null;
}

export interface RegisterApiSuccess {
  ok: true;
  data: unknown;
  message: string;
  errors: string[];
}

export interface RegisterApiFailure {
  ok: false;
  status: number | null;
  message: string;
  errors: string[];
  fieldErrors: FieldErrors;
}

export type RegisterApiResult = RegisterApiSuccess | RegisterApiFailure;

export interface RegisterActionState {
  status: "idle" | "error";
  message: string;
  errors: FieldErrors;
  values?: RegisterInput;
}

export const REGISTER_PAYLOAD_FIELDS = [
  "dni",
  "cuil",
  "name",
  "lastname",
  "email",
  "password",
  "user_phone",
  "birthdate",
] as const;

export const REGISTER_FORM_FIELDS = [
  "dni",
  "cuil",
  "name",
  "lastname",
  "email",
  "password",
  "confirmPassword",
  "user_phone",
  "birthdate",
] as const;

export const MIN_REGISTER_AGE = 18;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

const ERROR_MESSAGES = {
  required: "Este campo es obligatorio.",
  dni: "Ingresá un DNI de 7 u 8 dígitos.",
  cuil: "Ingresá un CUIL de 11 dígitos.",
  name: "Ingresá al menos 2 caracteres no blancos.",
  email: "Ingresá un correo válido.",
  password:
    "La contraseña debe tener entre 8 y 16 caracteres, una mayúscula, una minúscula y un número o carácter especial.",
  confirmPassword: "Las contraseñas no coinciden.",
  user_phone: "Ingresá un teléfono de 10 dígitos sin +54.",
  birthdate: "Ingresá una fecha de nacimiento válida.",
} as const;

const BIRTHDATE_MESSAGES: Record<BirthdateError, string> = {
  required: "Ingresá tu fecha de nacimiento.",
  invalid: "Ingresá una fecha válida.",
  future: "La fecha debe ser anterior a hoy.",
  underage: "Debés tener al menos 18 años.",
};

const EMOJI_PATTERN = new RegExp(
  "[\\p{Extended_Pictographic}\\uFE0F\\u200D]",
  "u",
);

/** Quita los espacios en blanco al inicio y al final de un texto. */
export function trimText(value: string): string {
  return value.trim();
}

/** Conserva únicamente los dígitos de una cadena. */
export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Elimina guiones y espacios de un CUIL. */
export function normalizeCuil(value: string): string {
  return value.replace(/[-\s]/g, "");
}

/** Convierte un número de un dígito en una cadena de dos caracteres con cero inicial. */
function padTwo(value: number): string {
  return value.toString().padStart(2, "0");
}

/** Indica si una fecha contiene un valor de tiempo válido. */
function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

/** Devuelve la fecha local sin componente de hora. */
function startOfLocalDay(value: Date): Date {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

/** Determina si un año del calendario gregoriano es bisiesto. */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Obtiene la cantidad de días de un mes, identificado por su índice basado en cero. */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Crea una fecha ajustando el día al último día disponible del mes. */
function createClampedDate(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  const clampedDay = Math.min(day, daysInMonth(year, monthIndex));
  return new Date(year, monthIndex, clampedDay);
}

/** Calcula el aniversario de nacimiento en un año y ajusta el 29 de febrero a día 28 si no es bisiesto. */
function getAnniversaryInYear(birthdate: Date, year: number): Date {
  const monthIndex = birthdate.getMonth();
  const day =
    monthIndex === 1 &&
    birthdate.getDate() === 29 &&
    !isLeapYear(year)
      ? 28
      : birthdate.getDate();

  return new Date(year, monthIndex, day);
}

/** Convierte una fecha válida al formato ISO local YYYY-MM-DD; devuelve una cadena vacía si no es válida. */
export function toIsoDate(date: Date): string {
  if (!isValidDate(date)) {
    return "";
  }

  return [
    date.getFullYear().toString().padStart(4, "0"),
    padTwo(date.getMonth() + 1),
    padTwo(date.getDate()),
  ].join("-");
}

/** Interpreta estrictamente una fecha YYYY-MM-DD y devuelve null si no existe en el calendario. */
export function fromIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Formatea una fecha o una cadena ISO como DD/MM/YYYY; devuelve una cadena vacía si no es válida. */
export function formatDisplayDate(value: Date | string): string {
  const date = typeof value === "string" ? fromIsoDate(value) : value;

  if (!date || !isValidDate(date)) {
    return "";
  }

  return [
    padTwo(date.getDate()),
    padTwo(date.getMonth() + 1),
    date.getFullYear().toString().padStart(4, "0"),
  ].join("/");
}

/** Aplica la máscara DD/MM/YYYY sobre lo que se escribe: conserva hasta ocho dígitos e inserta las barras. */
export function formatDateInput(value: string): string {
  const digits = normalizeDigits(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Convierte un valor visible DD/MM/YYYY a ISO YYYY-MM-DD; devuelve una cadena vacía si falta o es inválida. */
export function parseDisplayDate(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimText(value));

  if (!match) {
    return "";
  }

  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = fromIsoDate(iso);

  return date ? toIsoDate(date) : "";
}

/** Calcula la edad en años cumplidos; devuelve -1 para fechas inválidas o futuras. */
export function calculateAge(
  birthdate: Date,
  now: Date = new Date(),
): number {
  if (!isValidDate(birthdate) || !isValidDate(now)) {
    return -1;
  }

  const birth = startOfLocalDay(birthdate);
  const today = startOfLocalDay(now);

  if (birth > today) {
    return -1;
  }

  const anniversary = getAnniversaryInYear(birth, today.getFullYear());
  let age = today.getFullYear() - birth.getFullYear();

  if (today < anniversary) {
    age -= 1;
  }

  return age;
}

/**
 * Obtiene la fecha de nacimiento más reciente que cumple la edad mínima a la
 * fecha indicada. Con edad mínima 0 se permite el día de hoy.
 */
export function getMaxBirthdate(
  now: Date = new Date(),
  minimumAge: number = MIN_REGISTER_AGE,
): Date {
  const minimum = minimumAge > 0 ? minimumAge : 0;
  const targetYear = now.getFullYear() - minimum;
  const base = createClampedDate(
    targetYear,
    now.getMonth(),
    now.getDate(),
  );
  const nextDay = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + 1,
  );

  if (calculateAge(nextDay, now) >= minimum) {
    return nextDay;
  }

  return base;
}

/**
 * Valida una fecha de nacimiento y distingue si falta, es inválida, futura o
 * corresponde a una persona menor que la edad mínima indicada. Con edad
 * mínima 0 no se evalúa la edad y se permite el día de hoy.
 */
export function getBirthdateError(
  value: string,
  now: Date = new Date(),
  minimumAge: number = MIN_REGISTER_AGE,
): BirthdateError | null {
  const trimmed = trimText(value);

  if (!trimmed) {
    return "required";
  }

  const birthdate = fromIsoDate(trimmed);
  if (!birthdate) {
    return "invalid";
  }

  const minimum = minimumAge > 0 ? minimumAge : 0;
  const today = startOfLocalDay(now);

  if (minimum > 0 ? birthdate >= today : birthdate > today) {
    return "future";
  }

  if (minimum > 0 && calculateAge(birthdate, today) < minimum) {
    return "underage";
  }

  return null;
}

/**
 * Crea el predicado del calendario: con edad mínima positiva deshabilita hoy
 * y las fechas futuras; con edad mínima 0 solo deshabilita las futuras.
 */
export function getCalendarDisabledMatcher(
  now: Date = new Date(),
  minimumAge: number = MIN_REGISTER_AGE,
): (date: Date) => boolean {
  const today = startOfLocalDay(now);
  const minimum = minimumAge > 0 ? minimumAge : 0;

  /** Indica si una fecha no es válida o no puede seleccionarse. */
  return (date: Date): boolean => {
    if (!isValidDate(date)) {
      return true;
    }

    const day = startOfLocalDay(date);
    return minimum > 0 ? day >= today : day > today;
  };
}

/** Comprueba que el DNI tenga siete u ocho dígitos, ignorando espacios exteriores. */
export function isValidDni(value: string): boolean {
  return /^\d{7,8}$/.test(trimText(value));
}

/** Comprueba que el CUIL contenga once dígitos, permitiendo guiones y espacios separadores. */
export function isValidCuil(value: string): boolean {
  const trimmed = trimText(value);

  if (!/^[\d\s-]+$/.test(trimmed)) {
    return false;
  }

  return /^\d{11}$/.test(normalizeCuil(trimmed));
}

/** Comprueba que el teléfono contenga diez dígitos y no incluya el prefijo internacional con signo más. */
export function isValidPhone(value: string): boolean {
  const trimmed = trimText(value);

  if (trimmed.includes("+")) {
    return false;
  }

  if (!/^[\d\s()-]+$/.test(trimmed)) {
    return false;
  }

  return /^\d{10}$/.test(normalizeDigits(trimmed));
}

/** Comprueba que el correo tenga una estructura básica de usuario, dominio y extensión. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimText(value));
}

/** Comprueba que el nombre tenga al menos dos caracteres que no sean espacios en blanco. */
export function isValidName(value: string): boolean {
  return trimText(value).replace(/\s/g, "").length >= 2;
}

/** Indica si el texto contiene un emoji según el patrón configurado para el formulario. */
export function containsEmoji(value: string): boolean {
  return EMOJI_PATTERN.test(value);
}

/** Valida la longitud y los requisitos de mayúsculas, minúsculas, número o carácter especial de una contraseña. */
export function isValidPassword(value: string): boolean {
  const length = Array.from(value).length;

  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    return false;
  }

  if (containsEmoji(value)) {
    return false;
  }

  if (!/[a-z]/.test(value)) {
    return false;
  }

  if (!/[A-Z]/.test(value)) {
    return false;
  }

  if (!/[0-9]/.test(value) && !/[^A-Za-z0-9\s]/.test(value)) {
    return false;
  }

  return true;
}

/** Comprueba que la confirmación no esté en blanco y coincida exactamente con la contraseña. */
export function passwordsMatch(
  password: string,
  confirmation: string,
): boolean {
  if (!trimText(confirmation)) {
    return false;
  }

  return password === confirmation;
}

/** Normaliza los campos del formulario al formato esperado por la API y excluye la confirmación de contraseña. */
export function buildRegisterPayload(input: RegisterInput): RegisterPayload {
  const birthdate = fromIsoDate(trimText(input.birthdate));

  return {
    dni: normalizeDigits(input.dni),
    cuil: normalizeCuil(input.cuil),
    name: trimText(input.name),
    lastname: trimText(input.lastname),
    email: trimText(input.email),
    password: input.password,
    user_phone: normalizeDigits(input.user_phone),
    birthdate: birthdate ? toIsoDate(birthdate) : "",
  };
}

/** Valida todos los campos del registro y devuelve errores y el payload solo cuando la entrada es válida. */
export function validateRegisterInput(
  input: RegisterInput,
  now: Date = new Date(),
): RegisterValidationResult {
  const errors: FieldErrors = {};

  if (!trimText(input.dni)) {
    errors.dni = ERROR_MESSAGES.required;
  } else if (!isValidDni(input.dni)) {
    errors.dni = ERROR_MESSAGES.dni;
  }

  if (!trimText(input.cuil)) {
    errors.cuil = ERROR_MESSAGES.required;
  } else if (!isValidCuil(input.cuil)) {
    errors.cuil = ERROR_MESSAGES.cuil;
  }

  if (!trimText(input.name)) {
    errors.name = ERROR_MESSAGES.required;
  } else if (!isValidName(input.name)) {
    errors.name = ERROR_MESSAGES.name;
  }

  if (!trimText(input.lastname)) {
    errors.lastname = ERROR_MESSAGES.required;
  } else if (!isValidName(input.lastname)) {
    errors.lastname = ERROR_MESSAGES.name;
  }

  if (!trimText(input.email)) {
    errors.email = ERROR_MESSAGES.required;
  } else if (!isValidEmail(input.email)) {
    errors.email = ERROR_MESSAGES.email;
  }

  if (input.password.length === 0) {
    errors.password = ERROR_MESSAGES.required;
  } else if (!isValidPassword(input.password)) {
    errors.password = ERROR_MESSAGES.password;
  }

  if (!trimText(input.confirmPassword)) {
    errors.confirmPassword = ERROR_MESSAGES.required;
  } else if (!passwordsMatch(input.password, input.confirmPassword)) {
    errors.confirmPassword = ERROR_MESSAGES.confirmPassword;
  }

  if (!trimText(input.user_phone)) {
    errors.user_phone = ERROR_MESSAGES.required;
  } else if (!isValidPhone(input.user_phone)) {
    errors.user_phone = ERROR_MESSAGES.user_phone;
  }

  const birthdateError = getBirthdateError(input.birthdate, now);
  if (birthdateError) {
    errors.birthdate = BIRTHDATE_MESSAGES[birthdateError];
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    payload: valid ? buildRegisterPayload(input) : null,
  };
}
