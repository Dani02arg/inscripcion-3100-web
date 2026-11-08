import { isKnownRole } from "../auth/session.ts";
import { isEducationLevel } from "../users/labels.ts";
import { isIdentifierInput } from "../users/list.ts";
import type {
  RoleRequestInput,
  RoleRequestPayload,
  TutorProfileInput,
  TutorProfilePayload,
  UserField,
  UserFieldErrors,
  UserFilters,
} from "../users/types.ts";

export const USER_FILTER_FIELDS = [
  "dni",
  "cuil",
  "name",
  "lastname",
  "email",
] as const;

export type UserFilterField = (typeof USER_FILTER_FIELDS)[number];

export type UserFilterErrors = Partial<Record<UserFilterField, string>>;

export const USER_FILTER_VALIDATION_MESSAGES = {
  dniDigitsOnly:
    "Ingresá solo dígitos en el DNI, sin puntos, guiones ni espacios.",
  cuilDigitsOnly:
    "Ingresá solo dígitos en el CUIL, sin puntos, guiones ni espacios.",
} as const;

export interface UserFilterValidationResult {
  readonly valid: boolean;
  readonly errors: UserFilterErrors;
  readonly filters: UserFilters;
}

/** Valida que DNI y CUIL contengan solo dígitos y recorta los cinco filtros. */
export function validateUserFilters(
  filters: UserFilters,
): UserFilterValidationResult {
  const errors: UserFilterErrors = {};

  if (!isIdentifierInput(filters.dni)) {
    errors.dni = USER_FILTER_VALIDATION_MESSAGES.dniDigitsOnly;
  }

  if (!isIdentifierInput(filters.cuil)) {
    errors.cuil = USER_FILTER_VALIDATION_MESSAGES.cuilDigitsOnly;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    filters: {
      dni: filters.dni.trim(),
      cuil: filters.cuil.trim(),
      name: filters.name.trim(),
      lastname: filters.lastname.trim(),
      email: filters.email.trim(),
    },
  };
}

export const USER_PROFILE_FORM_FIELDS = [
  "occupation",
  "educationLevel",
] as const;

export const USER_PROFILE_VALIDATION_MESSAGES = {
  occupationRequired: "Ingresá tu ocupación.",
  occupationTooLong: "La ocupación no puede superar los 100 caracteres.",
  educationRequired: "Seleccioná tu nivel educativo.",
} as const;

export const ROLE_REQUEST_FIELDS = ["requestedRole", "reason"] as const;

export const USER_ROLE_REQUEST_VALIDATION_MESSAGES = {
  requestedRoleRequired: "Seleccioná el rol que querés solicitar.",
  requestedRoleSame: "El rol solicitado debe ser distinto del actual.",
  reasonRequired: "Ingresá el motivo de la solicitud.",
  reasonTooLong: "El motivo no puede superar los 500 caracteres.",
} as const;

export const USER_GENERAL_ERROR_MESSAGE =
  "No pudimos completar la operación. Intentá nuevamente.";

export const USER_FIELD_KEYS = [
  "dni",
  "cuil",
  "name",
  "lastname",
  "email",
  "occupation",
  "education_level",
  "requested_role",
  "newRole",
  "reason",
] as const satisfies readonly UserField[];

export interface TutorProfileValidationResult {
  readonly valid: boolean;
  readonly errors: UserFieldErrors;
  readonly payload: TutorProfilePayload | null;
}

function countCharacters(value: string): number {
  return Array.from(value).length;
}

/** Valida ocupación y nivel educativo del perfil de tutor. */
export function validateTutorProfile(
  input: TutorProfileInput,
): TutorProfileValidationResult {
  const errors: UserFieldErrors = {};
  const occupation = input.occupation.trim();
  const educationLevel = input.educationLevel.trim();
  const validEducationLevel = isEducationLevel(educationLevel)
    ? educationLevel
    : null;

  if (occupation.length === 0) {
    errors.occupation = USER_PROFILE_VALIDATION_MESSAGES.occupationRequired;
  } else if (countCharacters(occupation) > 100) {
    errors.occupation = USER_PROFILE_VALIDATION_MESSAGES.occupationTooLong;
  }

  if (validEducationLevel === null) {
    errors.education_level =
      USER_PROFILE_VALIDATION_MESSAGES.educationRequired;
  }

  if (validEducationLevel === null || Object.keys(errors).length > 0) {
    return { valid: false, errors, payload: null };
  }

  return {
    valid: true,
    errors,
    payload: {
      occupation,
      education_level: validEducationLevel,
    },
  };
}

/** Payload exacto de `PUT /api/profile/tutor` o `null` si hay errores. */
export function buildTutorProfilePayload(
  input: TutorProfileInput,
): TutorProfilePayload | null {
  return validateTutorProfile(input).payload;
}

/** Lee ocupación y nivel educativo del formulario. */
export function readTutorProfileFormData(formData: FormData): TutorProfileInput {
  const read = (field: string): string => {
    const value = formData.get(field);
    return typeof value === "string" ? value : "";
  };

  return {
    occupation: read("occupation"),
    educationLevel: read("educationLevel"),
  };
}

export interface RoleRequestValidationResult {
  readonly valid: boolean;
  readonly errors: UserFieldErrors;
  readonly payload: RoleRequestPayload | null;
}

/** Valida la solicitud de cambio de rol contra el rol actual. */
export function validateRoleRequest(
  input: RoleRequestInput,
  currentRole: string,
): RoleRequestValidationResult {
  const errors: UserFieldErrors = {};
  const requestedRole = input.requestedRole.trim();
  const reason = input.reason.trim();
  const validRequestedRole = isKnownRole(requestedRole)
    ? requestedRole
    : null;

  if (validRequestedRole === null) {
    errors.requested_role =
      USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleRequired;
  } else if (
    isKnownRole(currentRole) &&
    validRequestedRole === currentRole
  ) {
    errors.requested_role =
      USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleSame;
  }

  if (reason.length === 0) {
    errors.reason =
      USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonRequired;
  } else if (countCharacters(reason) > 500) {
    errors.reason =
      USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonTooLong;
  }

  if (
    validRequestedRole === null ||
    Object.keys(errors).length > 0
  ) {
    return { valid: false, errors, payload: null };
  }

  return {
    valid: true,
    errors,
    payload: {
      requested_role: validRequestedRole,
      reason,
    },
  };
}

/** Payload exacto de `POST /api/role-request` o `null` si hay errores. */
export function buildRoleRequestPayload(
  input: RoleRequestInput,
  currentRole: string,
): RoleRequestPayload | null {
  return validateRoleRequest(input, currentRole).payload;
}

/** Lee rol solicitado y motivo del formulario. */
export function readRoleRequestFormData(
  formData: FormData,
): RoleRequestInput {
  const read = (field: string): string => {
    const value = formData.get(field);
    return typeof value === "string" ? value : "";
  };

  return {
    requestedRole: read("requestedRole"),
    reason: read("reason"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() ? value : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function isUserField(value: string): value is UserField {
  return (USER_FIELD_KEYS as readonly string[]).includes(value);
}

/** Mapea solo los campos conocidos del servicio y toma el primer mensaje. */
export function mapUserFieldErrors(value: unknown): UserFieldErrors {
  const source =
    isRecord(value) && isRecord(value.errors) ? value.errors : value;

  if (!isRecord(source)) {
    return {};
  }

  const errors: UserFieldErrors = {};

  for (const [key, rawMessages] of Object.entries(source)) {
    if (!isUserField(key)) {
      continue;
    }

    const message = firstMessage(rawMessages);

    if (message) {
      errors[key] = message;
    }
  }

  return errors;
}

interface FieldTranslation {
  readonly pattern: RegExp;
  readonly message: string;
}

const DNI_VALID_MESSAGE = "Ingresá un DNI válido.";
const CUIL_VALID_MESSAGE = "Ingresá un CUIL válido.";
const NAME_VALID_MESSAGE = "Ingresá un nombre válido.";
const LASTNAME_VALID_MESSAGE = "Ingresá un apellido válido.";
const EMAIL_VALID_MESSAGE = "Ingresá un correo electrónico válido.";

const FIELD_TRANSLATIONS: Record<UserField, readonly FieldTranslation[]> = {
  dni: [
    {
      pattern: /required|empty|numeric|digit|invalid|valid/i,
      message: DNI_VALID_MESSAGE,
    },
  ],
  cuil: [
    {
      pattern: /required|empty|numeric|digit|invalid|valid/i,
      message: CUIL_VALID_MESSAGE,
    },
  ],
  name: [
    {
      pattern: /required|empty|string|invalid|valid|max/i,
      message: NAME_VALID_MESSAGE,
    },
  ],
  lastname: [
    {
      pattern: /required|empty|string|invalid|valid|max/i,
      message: LASTNAME_VALID_MESSAGE,
    },
  ],
  email: [
    {
      pattern: /required|empty|email|invalid|valid/i,
      message: EMAIL_VALID_MESSAGE,
    },
  ],
  occupation: [
    {
      pattern: /100|max|greater|long/i,
      message: USER_PROFILE_VALIDATION_MESSAGES.occupationTooLong,
    },
    {
      pattern: /required|empty/i,
      message: USER_PROFILE_VALIDATION_MESSAGES.occupationRequired,
    },
  ],
  education_level: [
    {
      pattern: /required|empty|selected|invalid|valid/i,
      message: USER_PROFILE_VALIDATION_MESSAGES.educationRequired,
    },
  ],
  requested_role: [
    {
      pattern: /different|same|current/i,
      message: USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleSame,
    },
    {
      pattern: /required|empty|selected|invalid|valid/i,
      message:
        USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleRequired,
    },
  ],
  newRole: [
    {
      pattern: /different|same|current/i,
      message: "Seleccioná un rol distinto del actual.",
    },
    {
      pattern: /required|empty|selected|invalid|valid/i,
      message: "Seleccioná un rol válido.",
    },
  ],
  reason: [
    {
      pattern: /500|max|greater|long/i,
      message: USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonTooLong,
    },
    {
      pattern: /required|empty/i,
      message: USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonRequired,
    },
  ],
};

export interface UserErrorTranslation {
  readonly errors: UserFieldErrors;
  readonly generalMessage: string | null;
}

/** Traduce mensajes conocidos y deriva los desconocidos al aviso general. */
export function translateUserFieldErrors(
  fieldErrors: UserFieldErrors,
): UserErrorTranslation {
  const errors: UserFieldErrors = {};
  let hasUnknownMessage = false;

  for (const field of USER_FIELD_KEYS) {
    const message = fieldErrors[field];

    if (!message) {
      continue;
    }

    const translation = FIELD_TRANSLATIONS[field].find(({ pattern }) =>
      pattern.test(message),
    );

    if (translation) {
      errors[field] = translation.message;
    } else {
      hasUnknownMessage = true;
    }
  }

  return {
    errors,
    generalMessage: hasUnknownMessage ? USER_GENERAL_ERROR_MESSAGE : null,
  };
}
