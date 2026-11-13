import {
  isValidDni,
  isValidEmail,
  fromIsoDate,
  trimText,
} from "./register.ts";
import { isGender } from "../students/labels.ts";
import {
  STUDENT_IDENTIFIER_MAX_LENGTH,
} from "../students/list.ts";
import type { Gender, Student, StudentFilters } from "../students/types.ts";

export { isGender };

/** Campos del formulario de alumno, en orden de presentación. */
export const STUDENT_FORM_FIELDS = [
  "studentDni",
  "studentCuil",
  "firstName",
  "lastName",
  "studentEmail",
  "studentPhone",
  "birthdate",
  "gender",
  "birthplace",
  "address",
] as const;

export type StudentField = (typeof STUDENT_FORM_FIELDS)[number];

export type StudentFieldErrors = Partial<
  Record<StudentField, string>
>;

export interface StudentFormInput {
  readonly studentDni: string;
  readonly studentCuil: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly studentEmail: string;
  readonly studentPhone: string;
  readonly birthdate: string;
  readonly gender: string;
  readonly birthplace: string;
  readonly address: string;
}

/** Payload de alta: DNI y CUIL obligatorios. */
export interface StudentStorePayload {
  readonly studentDni: string;
  readonly studentCuil: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly studentEmail: string | null;
  readonly studentPhone: string | null;
  readonly birthdate: string;
  readonly gender: Gender;
  readonly birthplace: string | null;
  readonly address: string | null;
}

/** Payload de edición: sin DNI ni CUIL; los opcionales vacíos van en nulo. */
export interface StudentUpdatePayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly studentEmail: string | null;
  readonly studentPhone: string | null;
  readonly birthdate: string;
  readonly gender: Gender;
  readonly birthplace: string | null;
  readonly address: string | null;
}

/** Indica si el payload validado corresponde al alta. */
export function isStudentStorePayload(
  payload: StudentStorePayload | StudentUpdatePayload,
): payload is StudentStorePayload {
  return "studentDni" in payload;
}

/** Indica si el payload validado corresponde a la edición. */
export function isStudentUpdatePayload(
  payload: StudentStorePayload | StudentUpdatePayload,
): payload is StudentUpdatePayload {
  return !("studentDni" in payload);
}

export const STUDENT_VALIDATION_MESSAGES = Object.freeze({
  studentDniRequired: "El DNI es obligatorio.",
  studentDniFormat: "Ingresá un DNI de 7 u 8 dígitos.",
  studentDniExists: "El DNI ya está registrado.",
  studentCuilRequired: "El CUIL es obligatorio.",
  studentCuilFormat: "Ingresá un CUIL de 11 dígitos.",
  studentCuilExists: "El CUIL ya está registrado.",
  firstNameRequired: "El nombre es obligatorio.",
  lastNameRequired: "El apellido es obligatorio.",
  maxName: "Máximo 100 caracteres.",
  birthdateRequired: "La fecha de nacimiento es obligatoria.",
  birthdateInvalid: "Ingresá una fecha válida y no futura.",
  genderInvalid: "Seleccioná un género válido.",
  emailInvalid: "Ingresá un email válido.",
  emailTooLong: "El correo no puede superar los 255 caracteres.",
  emailExists: "El correo ya está registrado.",
  phoneInvalid: "El teléfono debe contener solo dígitos.",
  birthplaceTooLong:
    "El lugar de nacimiento no puede superar los 150 caracteres.",
} as const);

export const STUDENT_GENERAL_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";

export const STUDENT_FILTER_MESSAGES = Object.freeze({
  studentDniDigits: "El DNI debe contener solo dígitos.",
  studentDniMax: "El DNI no puede superar los 8 dígitos.",
  studentCuilDigits: "El CUIL debe contener solo dígitos.",
  studentCuilMax: "El CUIL no puede superar los 11 dígitos.",
} as const);

export type StudentFilterField =
  | "studentDni"
  | "studentCuil"
  | "firstName"
  | "lastName";

export type StudentFilterErrors = Partial<
  Record<StudentFilterField, string>
>;

export interface StudentFilterValidation {
  readonly valid: boolean;
  readonly errors: StudentFilterErrors;
  readonly filters: StudentFilters;
}

export interface StudentValidationResult {
  readonly valid: boolean;
  readonly errors: StudentFieldErrors;
  readonly payload: StudentStorePayload | StudentUpdatePayload | null;
}

/** Formulario vacío para el alta. */
export function getEmptyStudentForm(): StudentFormInput {
  return {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
    studentEmail: "",
    studentPhone: "",
    birthdate: "",
    gender: "",
    birthplace: "",
    address: "",
  };
}

/** Convierte un alumno del servicio en valores del formulario. */
export function studentToFormInput(student: Student): StudentFormInput {
  return {
    studentDni: student.studentDni,
    studentCuil: student.studentCuil,
    firstName: student.firstName,
    lastName: student.lastName,
    studentEmail: student.studentEmail ?? "",
    studentPhone: student.studentPhone ?? "",
    birthdate: student.birthdate,
    gender: student.gender,
    birthplace: student.birthplace ?? "",
    address: student.address ?? "",
  };
}

export function readStudentFormData(
  formData: FormData,
): StudentFormInput {
  const read = (field: StudentField): string => {
    const value = formData.get(field);
    return typeof value === "string" ? value : "";
  };

  return {
    studentDni: read("studentDni"),
    studentCuil: read("studentCuil"),
    firstName: read("firstName"),
    lastName: read("lastName"),
    studentEmail: read("studentEmail"),
    studentPhone: read("studentPhone"),
    birthdate: read("birthdate"),
    gender: read("gender"),
    birthplace: read("birthplace"),
    address: read("address"),
  };
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isDigits(value: string, length?: number): boolean {
  const pattern =
    length === undefined ? /^\d+$/ : new RegExp(`^\\d{${length}}$`);
  return pattern.test(value);
}

/**
 * Valida los diez campos del formulario. En el alta se exigen DNI y CUIL;
 * en la edición se omiten y los opcionales vacíos se envían en nulo.
 */
export function validateStudentInput(
  input: StudentFormInput,
  isEdit = false,
  now: Date = new Date(),
): StudentValidationResult {
  const errors: StudentFieldErrors = {};

  const dni = trimText(input.studentDni);
  const cuil = trimText(input.studentCuil);
  const firstName = trimText(input.firstName);
  const lastName = trimText(input.lastName);
  const email = trimText(input.studentEmail);
  const phone = trimText(input.studentPhone);
  const birthplace = trimText(input.birthplace);
  const address = trimText(input.address);
  const gender = trimText(input.gender);
  const birthdate = trimText(input.birthdate);
  const parsedGender = isGender(gender) ? gender : null;

  if (!isEdit) {
    if (!dni) {
      errors.studentDni = STUDENT_VALIDATION_MESSAGES.studentDniRequired;
    } else if (!isValidDni(dni)) {
      errors.studentDni = STUDENT_VALIDATION_MESSAGES.studentDniFormat;
    }

    if (!cuil) {
      errors.studentCuil = STUDENT_VALIDATION_MESSAGES.studentCuilRequired;
    } else if (!isDigits(cuil, 11)) {
      errors.studentCuil = STUDENT_VALIDATION_MESSAGES.studentCuilFormat;
    }
  }

  if (!firstName) {
    errors.firstName = STUDENT_VALIDATION_MESSAGES.firstNameRequired;
  } else if (firstName.length > 100) {
    errors.firstName = STUDENT_VALIDATION_MESSAGES.maxName;
  }

  if (!lastName) {
    errors.lastName = STUDENT_VALIDATION_MESSAGES.lastNameRequired;
  } else if (lastName.length > 100) {
    errors.lastName = STUDENT_VALIDATION_MESSAGES.maxName;
  }

  if (email) {
    if (email.length > 255) {
      errors.studentEmail = STUDENT_VALIDATION_MESSAGES.emailTooLong;
    } else if (!isValidEmail(email)) {
      errors.studentEmail = STUDENT_VALIDATION_MESSAGES.emailInvalid;
    }
  }

  if (phone && !isDigits(phone)) {
    errors.studentPhone = STUDENT_VALIDATION_MESSAGES.phoneInvalid;
  }

  if (!birthdate) {
    errors.birthdate = STUDENT_VALIDATION_MESSAGES.birthdateRequired;
  } else {
    const birthdateValue = fromIsoDate(birthdate);
    const today = startOfLocalDay(now);

    if (!birthdateValue || birthdateValue > today) {
      errors.birthdate = STUDENT_VALIDATION_MESSAGES.birthdateInvalid;
    }
  }

  if (!parsedGender) {
    errors.gender = STUDENT_VALIDATION_MESSAGES.genderInvalid;
  }

  if (birthplace.length > 150) {
    errors.birthplace = STUDENT_VALIDATION_MESSAGES.birthplaceTooLong;
  }

  const valid = Object.keys(errors).length === 0;

  if (!valid || parsedGender === null) {
    return { valid: false, errors, payload: null };
  }

  const common = {
    firstName,
    lastName,
    studentEmail: email || null,
    studentPhone: phone || null,
    birthdate,
    gender: parsedGender,
    birthplace: birthplace || null,
    address: address || null,
  } as const;

  if (isEdit) {
    return {
      valid: true,
      errors: {},
      payload: common,
    };
  }

  return {
    valid: true,
    errors: {},
    payload: {
      studentDni: dni,
      studentCuil: cuil,
      ...common,
    },
  };
}

/**
 * Valida los filtros: DNI y CUIL solo admiten dígitos y respetan su largo
 * máximo; nombre y apellido se recortan y no tienen formato especial.
 */
export function validateStudentFilters(
  filters: StudentFilters,
): StudentFilterValidation {
  const errors: StudentFilterErrors = {};

  const studentDni = trimText(filters.studentDni);
  const studentCuil = trimText(filters.studentCuil);
  const firstName = trimText(filters.firstName);
  const lastName = trimText(filters.lastName);

  if (studentDni) {
    if (!isDigits(studentDni)) {
      errors.studentDni = STUDENT_FILTER_MESSAGES.studentDniDigits;
    } else if (studentDni.length > STUDENT_IDENTIFIER_MAX_LENGTH.studentDni) {
      errors.studentDni = STUDENT_FILTER_MESSAGES.studentDniMax;
    }
  }

  if (studentCuil) {
    if (!isDigits(studentCuil)) {
      errors.studentCuil = STUDENT_FILTER_MESSAGES.studentCuilDigits;
    } else if (
      studentCuil.length > STUDENT_IDENTIFIER_MAX_LENGTH.studentCuil
    ) {
      errors.studentCuil = STUDENT_FILTER_MESSAGES.studentCuilMax;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    filters: {
      studentDni,
      studentCuil,
      firstName,
      lastName,
    },
  };
}

export interface StudentErrorTranslation {
  readonly errors: StudentFieldErrors;
  readonly generalMessage: string | null;
}

const REQUIRED_PATTERN = /required|empty/i;
const DUPLICATE_PATTERN =
  /unique|taken|registered|already|exists|duplicate/i;
const MAX_NAME_PATTERN = /max|100|length|characters|greater/i;
const MAX_EMAIL_PATTERN = /max|255|length|characters|greater/i;
const MAX_BIRTHPLACE_PATTERN = /max|150|length|characters|greater/i;

const ENGLISH_ERROR_PATTERNS: Readonly<
  Record<
    StudentField,
    readonly { readonly pattern: RegExp; readonly message: string }[]
  >
> = {
  studentDni: [
    {
      pattern: REQUIRED_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.studentDniRequired,
    },
    {
      pattern: DUPLICATE_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.studentDniExists,
    },
    {
      pattern: /digits|numeric|7|8|between|size|length/i,
      message: STUDENT_VALIDATION_MESSAGES.studentDniFormat,
    },
  ],
  studentCuil: [
    {
      pattern: REQUIRED_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.studentCuilRequired,
    },
    {
      pattern: DUPLICATE_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.studentCuilExists,
    },
    {
      pattern: /digits|numeric|11|size|length/i,
      message: STUDENT_VALIDATION_MESSAGES.studentCuilFormat,
    },
  ],
  firstName: [
    {
      pattern: REQUIRED_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.firstNameRequired,
    },
    {
      pattern: MAX_NAME_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.maxName,
    },
  ],
  lastName: [
    {
      pattern: REQUIRED_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.lastNameRequired,
    },
    {
      pattern: MAX_NAME_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.maxName,
    },
  ],
  studentEmail: [
    {
      pattern: DUPLICATE_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.emailExists,
    },
    {
      pattern: MAX_EMAIL_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.emailTooLong,
    },
    {
      pattern: /email|format|valid/i,
      message: STUDENT_VALIDATION_MESSAGES.emailInvalid,
    },
  ],
  studentPhone: [
    {
      pattern: /digits|numeric|only|format|valid/i,
      message: STUDENT_VALIDATION_MESSAGES.phoneInvalid,
    },
  ],
  birthdate: [
    {
      pattern: REQUIRED_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.birthdateRequired,
    },
    {
      pattern: /future|after|today|date|valid|format/i,
      message: STUDENT_VALIDATION_MESSAGES.birthdateInvalid,
    },
  ],
  gender: [
    {
      pattern: /required|selected|invalid|valid|in/i,
      message: STUDENT_VALIDATION_MESSAGES.genderInvalid,
    },
  ],
  birthplace: [
    {
      pattern: MAX_BIRTHPLACE_PATTERN,
      message: STUDENT_VALIDATION_MESSAGES.birthplaceTooLong,
    },
  ],
  address: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function isStudentField(value: string): value is StudentField {
  return STUDENT_FORM_FIELDS.some((field) => field === value);
}

function unwrapErrors(value: unknown): Record<string, unknown> {
  if (isRecord(value) && isRecord(value.errors)) {
    return value.errors;
  }

  return isRecord(value) ? value : {};
}

/** Mapea solo los campos conocidos y conserva el mensaje crudo del servicio. */
export function mapStudentFieldErrors(
  value: unknown,
): StudentFieldErrors {
  const source = unwrapErrors(value);
  const errors: StudentFieldErrors = {};

  for (const [key, raw] of Object.entries(source)) {
    if (!isStudentField(key)) {
      continue;
    }

    const message = firstMessage(raw);

    if (message) {
      errors[key] = message;
    }
  }

  return errors;
}

function translateStudentMessage(
  field: StudentField,
  message: string,
): string | null {
  const translation = ENGLISH_ERROR_PATTERNS[field].find(({ pattern }) =>
    pattern.test(message),
  );

  return translation ? translation.message : null;
}

/** Traduce los mensajes conocidos y deriva los desconocidos a un aviso general. */
export function translateStudentFieldErrors(
  fieldErrors: StudentFieldErrors,
): StudentErrorTranslation {
  const errors: StudentFieldErrors = {};
  let hasUnknownMessage = false;

  for (const field of STUDENT_FORM_FIELDS) {
    const message = fieldErrors[field];

    if (!message) {
      continue;
    }

    const translated = translateStudentMessage(field, message);

    if (translated) {
      errors[field] = translated;
    } else {
      hasUnknownMessage = true;
    }
  }

  return {
    errors,
    generalMessage: hasUnknownMessage
      ? STUDENT_GENERAL_ERROR_MESSAGE
      : null,
  };
}

/**
 * Mapea y traduce el sobre de errores del servicio. Las claves ajenas al
 * formulario y los mensajes desconocidos producen un aviso general.
 */
export function translateStudentApiErrors(
  value: unknown,
): StudentErrorTranslation {
  const source = unwrapErrors(value);
  const mapped: StudentFieldErrors = {};
  let hasUnknownKeys = false;

  for (const [key, raw] of Object.entries(source)) {
    if (!isStudentField(key)) {
      hasUnknownKeys = true;
      continue;
    }

    const message = firstMessage(raw);

    if (message) {
      mapped[key] = message;
    }
  }

  const translated = translateStudentFieldErrors(mapped);

  return {
    errors: translated.errors,
    generalMessage: hasUnknownKeys
      ? STUDENT_GENERAL_ERROR_MESSAGE
      : translated.generalMessage,
  };
}
