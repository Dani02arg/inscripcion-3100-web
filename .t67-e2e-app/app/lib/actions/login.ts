"use server";

import { redirect } from "next/navigation";

import { loginUser } from "../api/login.ts";
import { decodeSessionToken } from "../auth/session.ts";
import { createSession } from "../auth/session-cookie.ts";
import { INVALID_RESPONSE_MESSAGE } from "../auth/types.ts";
import {
  validateLoginInput,
  type LoginActionState,
  type LoginField,
  type LoginFieldErrors,
  type LoginInput,
} from "../validation/login.ts";

const VALIDATION_ERROR_MESSAGE =
  "Revisá los datos del formulario e intentá nuevamente.";

function getFormValue(formData: FormData, field: LoginField): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function readLoginInput(formData: FormData): LoginInput {
  return {
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
  };
}

function createErrorState(
  message: string,
  errors: LoginFieldErrors,
  values: LoginInput,
): LoginActionState {
  return {
    status: "error",
    message,
    errors,
    values,
  };
}

/** Revalida las credenciales, autentica y redirige al inicio en caso de éxito. */
export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const input = readLoginInput(formData);
  const validation = validateLoginInput(input);

  if (!validation.valid || !validation.payload) {
    return createErrorState(
      VALIDATION_ERROR_MESSAGE,
      validation.errors,
      input,
    );
  }

  const result = await loginUser(validation.payload);

  if (result.ok) {
    const claims = decodeSessionToken(result.data.token);

    if (!claims) {
      return createErrorState(INVALID_RESPONSE_MESSAGE, {}, input);
    }

    await createSession(result.data.token, claims);
    redirect("/dashboard");
  }

  if (result.kind === "email_not_registered") {
    return createErrorState(
      "",
      { email: result.fieldErrors.email ?? result.message },
      input,
    );
  }

  if (result.kind === "invalid_password") {
    return createErrorState(
      "",
      { password: result.fieldErrors.password ?? result.message },
      input,
    );
  }

  return createErrorState(result.message, {}, input);
}
