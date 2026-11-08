import { isValidEmail, trimText } from "./register.ts";

export type LoginField = "email" | "password";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type LoginFieldErrors = Partial<Record<LoginField, string>>;

export interface LoginValidationResult {
  valid: boolean;
  errors: LoginFieldErrors;
  payload: LoginPayload | null;
}

export interface LoginActionState {
  status: "idle" | "error";
  message: string;
  errors: LoginFieldErrors;
  values?: LoginInput;
}

export const LOGIN_FORM_FIELDS = ["email", "password"] as const;

const ERROR_MESSAGES = {
  required: "Este campo es obligatorio.",
  email: "Ingresá un correo válido.",
} as const;

/** Recorta el email y conserva la contraseña tal como fue ingresada. */
export function buildLoginPayload(input: LoginInput): LoginPayload {
  return {
    email: trimText(input.email),
    password: input.password,
  };
}

/** Valida los dos campos del login sin exigir complejidad de contraseña. */
export function validateLoginInput(input: LoginInput): LoginValidationResult {
  const errors: LoginFieldErrors = {};
  const email = trimText(input.email);

  if (!email) {
    errors.email = ERROR_MESSAGES.required;
  } else if (!isValidEmail(email)) {
    errors.email = ERROR_MESSAGES.email;
  }

  if (input.password.length === 0) {
    errors.password = ERROR_MESSAGES.required;
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    payload: valid ? buildLoginPayload(input) : null,
  };
}
