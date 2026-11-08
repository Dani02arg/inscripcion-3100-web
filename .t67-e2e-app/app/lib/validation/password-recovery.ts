import {
  isValidEmail,
  isValidPassword,
  passwordsMatch,
  trimText,
} from "./register.ts";

/** Mensaje común para campos obligatorios vacíos. */
export const RECOVERY_REQUIRED_MESSAGE = "Este campo es obligatorio.";

/** Mensaje para un correo con formato inválido. */
export const RECOVERY_EMAIL_INVALID_MESSAGE = "Ingresá un correo válido.";

/** Mensaje para un código de recuperación incompleto o con formato inválido. */
export const RECOVERY_CODE_INCOMPLETE_MESSAGE =
  "Ingresá el código de 5 dígitos.";

/** Mensaje de la política de contraseña, compartido con el registro. */
export const RECOVERY_PASSWORD_POLICY_MESSAGE =
  "La contraseña debe tener entre 8 y 16 caracteres, una mayúscula, una minúscula y un número o carácter especial.";

/** Mensaje para una confirmación que no coincide. */
export const RECOVERY_CONFIRMATION_MISMATCH_MESSAGE =
  "Las contraseñas no coinciden.";

/** Mensaje específico cuando el cambio termina con timeout. */
export const RECOVERY_RESET_TIMEOUT_MESSAGE =
  "No pudimos confirmar el cambio. Probá iniciar sesión con la nueva contraseña o solicitá un código nuevo.";

export interface RequestRecoveryPayload {
  email: string;
}

export interface RequestRecoveryFieldErrors {
  email?: string;
}

export interface RequestRecoveryActionState {
  status: "idle" | "sent" | "error";
  message: string;
  errors: RequestRecoveryFieldErrors;
  values?: RequestRecoveryPayload;
}

export interface RecoveryEmailValidation {
  valid: boolean;
  email: string;
  error?: string;
  payload: RequestRecoveryPayload | null;
}

export type ResetPasswordField =
  | "email"
  | "code"
  | "password"
  | "passwordConfirmation";

export type ResetPasswordFieldErrors = Partial<
  Record<ResetPasswordField, string>
>;

export interface NewPasswordValidation {
  valid: boolean;
  errors: ResetPasswordFieldErrors;
}

export interface ResetInput {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export type ResetPasswordActionStatus =
  | "idle"
  | "success"
  | "invalid_code"
  | "validation"
  | "email_not_registered"
  | "timeout"
  | "error";

export interface ResetPasswordActionState {
  status: ResetPasswordActionStatus;
  message: string;
  errors: ResetPasswordFieldErrors;
  values?: ResetInput;
}

const RESET_PASSWORD_FIELDS = [
  "email",
  "code",
  "password",
  "passwordConfirmation",
] as const;

const RECOVERY_CODE_PATTERN = /^\d{5}$/;

/** Construye el cuerpo de la solicitud con el correo recortado. */
export function buildRequestPayload(email: string): RequestRecoveryPayload {
  return { email: trimText(email) };
}

/** Valida el correo de la solicitud y devuelve el valor normalizado y el payload. */
export function validateRecoveryEmail(value: string): RecoveryEmailValidation {
  const email = trimText(value);

  if (!email) {
    return {
      valid: false,
      email,
      error: RECOVERY_REQUIRED_MESSAGE,
      payload: null,
    };
  }

  if (!isValidEmail(email)) {
    return {
      valid: false,
      email,
      error: RECOVERY_EMAIL_INVALID_MESSAGE,
      payload: null,
    };
  }

  return { valid: true, email, payload: buildRequestPayload(email) };
}

/** Valida la nueva contraseña con la política del registro y su confirmación. */
export function validateNewPassword(
  password: string,
  confirmation: string,
): NewPasswordValidation {
  const errors: ResetPasswordFieldErrors = {};

  if (password.length === 0) {
    errors.password = RECOVERY_REQUIRED_MESSAGE;
  } else if (!isValidPassword(password)) {
    errors.password = RECOVERY_PASSWORD_POLICY_MESSAGE;
  }

  if (!trimText(confirmation)) {
    errors.passwordConfirmation = RECOVERY_REQUIRED_MESSAGE;
  } else if (!passwordsMatch(password, confirmation)) {
    errors.passwordConfirmation = RECOVERY_CONFIRMATION_MISMATCH_MESSAGE;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Indica si un valor es un objeto plano utilizable como mapa de errores. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Indica si una clave corresponde a un campo del cambio de contraseña. */
function isResetPasswordField(
  value: string,
): value is ResetPasswordField {
  return RESET_PASSWORD_FIELDS.some((field) => field === value);
}

/** Obtiene el primer mensaje no vacío de un error del servicio. */
function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() ? value : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const message = value.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );

  return message;
}

/** Valida que el código tenga exactamente cinco dígitos sin alterar ceros iniciales. */
export function validateRecoveryCode(value: string): string | undefined {
  return RECOVERY_CODE_PATTERN.test(value)
    ? undefined
    : RECOVERY_CODE_INCOMPLETE_MESSAGE;
}

/** Construye el cuerpo del cambio con las cuatro claves del servicio. */
export function buildResetPayload(input: ResetInput): ResetPasswordPayload {
  return {
    email: trimText(input.email),
    code: input.code,
    password: input.password,
    password_confirmation: input.passwordConfirmation,
  };
}

/** Mapea los errores por campo del servicio y traduce `password_confirmation`. */
export function mapResetFieldErrors(
  value: unknown,
): ResetPasswordFieldErrors {
  if (!isRecord(value)) {
    return {};
  }

  const errors: ResetPasswordFieldErrors = {};

  for (const [key, rawMessages] of Object.entries(value)) {
    const field =
      key === "password_confirmation" ? "passwordConfirmation" : key;

    if (!isResetPasswordField(field)) {
      continue;
    }

    const message = firstMessage(rawMessages);

    if (message) {
      errors[field] = message;
    }
  }

  return errors;
}
