"use server";

import { redirect } from "next/navigation";

import { registerUser } from "../api/auth.ts";
import { extractPendingRegistration } from "../verification/pending-value.ts";
import {
  clearPendingRegistration,
  writePendingRegistration,
} from "../verification/pending.ts";
import {
  validateRegisterInput,
  type FieldErrors,
  type RegisterActionState,
  type RegisterField,
  type RegisterInput,
} from "../validation/register.ts";

const VALIDATION_ERROR_MESSAGE =
  "Revisá los datos del formulario e intentá nuevamente.";
const PENDING_ERROR_MESSAGE =
  "No pudimos preparar la verificación de tu correo. Intentá nuevamente.";

function getFormValue(formData: FormData, field: RegisterField): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function readRegisterInput(formData: FormData): RegisterInput {
  return {
    dni: getFormValue(formData, "dni"),
    cuil: getFormValue(formData, "cuil"),
    name: getFormValue(formData, "name"),
    lastname: getFormValue(formData, "lastname"),
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
    confirmPassword: getFormValue(formData, "confirmPassword"),
    user_phone: getFormValue(formData, "user_phone"),
    birthdate: getFormValue(formData, "birthdate"),
  };
}

function createErrorState(
  message: string,
  errors: FieldErrors,
  values: RegisterInput,
): RegisterActionState {
  return {
    status: "error",
    message,
    errors,
    values,
  };
}

function getFailureMessage(
  message: string,
  generalErrors: string[],
): string {
  const messages = [message, ...generalErrors].filter(
    (item) => item.trim().length > 0,
  );

  return Array.from(new Set(messages)).join(" ");
}

export async function registerAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const input = readRegisterInput(formData);
  const validation = validateRegisterInput(input);

  if (!validation.valid || !validation.payload) {
    return createErrorState(
      VALIDATION_ERROR_MESSAGE,
      validation.errors,
      input,
    );
  }

  const result = await registerUser(validation.payload);

  if (result.ok) {
    const pending = extractPendingRegistration(result.data);

    if (!pending) {
      await clearPendingRegistration();

      return createErrorState(PENDING_ERROR_MESSAGE, {}, input);
    }

    await writePendingRegistration(pending);
    redirect("/verify-email");
  }

  // RF-2: un registro no aceptado descarta también el pendiente anterior (D13).
  await clearPendingRegistration();

  return createErrorState(
    getFailureMessage(result.message, result.errors),
    result.fieldErrors,
    input,
  );
}
