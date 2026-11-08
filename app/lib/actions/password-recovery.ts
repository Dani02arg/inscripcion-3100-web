"use server";

import {
  RECOVERY_TIMEOUT_MESSAGE,
  requestRecoveryCode,
  resetPassword,
} from "../api/password-recovery.ts";
import {
  buildResetPayload,
  validateNewPassword,
  validateRecoveryCode,
  validateRecoveryEmail,
  RECOVERY_RESET_TIMEOUT_MESSAGE,
  type RequestRecoveryActionState,
  type RequestRecoveryFieldErrors,
  type RequestRecoveryPayload,
  type ResetInput,
  type ResetPasswordActionState,
  type ResetPasswordFieldErrors,
} from "../validation/password-recovery.ts";

const VALIDATION_ERROR_MESSAGE =
  "Revisá los datos del formulario e intentá nuevamente.";

function mergeGeneralMessages(message: string, errors: string[]): string {
  return [message, ...errors]
    .filter(
      (item, index, all) => item.length > 0 && all.indexOf(item) === index,
    )
    .join(" ");
}

function getFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function readResetInput(formData: FormData): ResetInput {
  return {
    email: getFormValue(formData, "email"),
    code: getFormValue(formData, "code"),
    password: getFormValue(formData, "password"),
    passwordConfirmation: getFormValue(formData, "passwordConfirmation"),
  };
}

function createErrorState(
  message: string,
  errors: RequestRecoveryFieldErrors,
  values: RequestRecoveryPayload,
): RequestRecoveryActionState {
  return {
    status: "error",
    message,
    errors,
    values,
  };
}

/** Revalida el correo y solicita un código de recuperación. */
export async function requestRecoveryAction(
  _previousState: RequestRecoveryActionState,
  formData: FormData,
): Promise<RequestRecoveryActionState> {
  const rawEmail = getFormValue(formData, "email");
  const validation = validateRecoveryEmail(rawEmail);
  const values = { email: validation.email };

  if (!validation.valid || !validation.payload) {
    return createErrorState(
      "",
      { email: validation.error ?? VALIDATION_ERROR_MESSAGE },
      values,
    );
  }

  const result = await requestRecoveryCode(validation.payload.email);

  if (result.ok) {
    return {
      status: "sent",
      message: result.message,
      errors: {},
      values,
    };
  }

  if (result.kind === "email_not_registered") {
    return createErrorState(
      "",
      { email: result.fieldErrors.email ?? result.message },
      values,
    );
  }

  return createErrorState(result.message, {}, values);
}

function createResetState(
  status: ResetPasswordActionState["status"],
  message: string,
  errors: ResetPasswordFieldErrors,
  values?: ResetInput,
): ResetPasswordActionState {
  return { status, message, errors, values };
}

/** Revalida el código y la contraseña, y solicita el cambio al servicio. */
export async function resetPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const rawInput = readResetInput(formData);
  const emailValidation = validateRecoveryEmail(rawInput.email);
  const input: ResetInput = {
    ...rawInput,
    email: emailValidation.email,
  };
  const errors: ResetPasswordFieldErrors = {};

  if (!emailValidation.valid) {
    errors.email = emailValidation.error ?? VALIDATION_ERROR_MESSAGE;
  }

  const codeError = validateRecoveryCode(input.code);

  if (codeError) {
    errors.code = codeError;
  }

  const passwordValidation = validateNewPassword(
    input.password,
    input.passwordConfirmation,
  );
  Object.assign(errors, passwordValidation.errors);

  if (Object.keys(errors).length > 0) {
    return createResetState("validation", "", errors, input);
  }

  const result = await resetPassword(buildResetPayload(input));

  if (result.ok) {
    return createResetState("success", result.message, {});
  }

  if (result.kind === "invalid_code") {
    return createResetState(
      "invalid_code",
      result.message,
      { code: result.fieldErrors.code ?? result.message },
      { ...input, code: "" },
    );
  }

  if (result.kind === "email_not_registered") {
    return createResetState(
      "email_not_registered",
      result.message,
      result.fieldErrors,
      input,
    );
  }

  if (result.kind === "validation") {
    return createResetState(
      "validation",
      mergeGeneralMessages(result.message, result.errors),
      result.fieldErrors,
      input,
    );
  }

  if (result.message === RECOVERY_TIMEOUT_MESSAGE) {
    return createResetState(
      "timeout",
      RECOVERY_RESET_TIMEOUT_MESSAGE,
      {},
      input,
    );
  }

  return createResetState("error", result.message, {}, input);
}
