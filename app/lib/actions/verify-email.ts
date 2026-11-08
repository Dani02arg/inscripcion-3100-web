"use server";

import {
  resendVerificationCode,
  verifyEmail,
} from "../api/verify-email.ts";
import { isCompleteCode, normalizeCode } from "../verification/code.ts";
import {
  clearPendingRegistration,
  markPendingResent,
  readPendingRegistration,
} from "../verification/pending.ts";
import { resendWaitMs } from "../verification/pending-value.ts";
import type {
  ResendActionState,
  VerifyActionState,
} from "../verification/types.ts";

const MISSING_PENDING_MESSAGE =
  "No hay una verificación pendiente. Registrate para recibir un código.";
const INCOMPLETE_CODE_MESSAGE = "Ingresá los 5 dígitos del código.";
const RESEND_WAIT_MESSAGE =
  "Esperá unos segundos antes de reenviar el código.";
const RESENT_MESSAGE = "Te enviamos un código nuevo.";

function getFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

/** Verifica el código completo contra el identificador conservado en la cookie. */
export async function verifyEmailAction(
  _previousState: VerifyActionState,
  formData: FormData,
): Promise<VerifyActionState> {
  const pending = await readPendingRegistration();

  if (!pending) {
    return {
      status: "missing",
      message: MISSING_PENDING_MESSAGE,
      errors: {},
    };
  }

  const code = normalizeCode(getFormValue(formData, "code"));

  if (!isCompleteCode(code)) {
    return {
      status: "rejected",
      message: INCOMPLETE_CODE_MESSAGE,
      errors: { code: INCOMPLETE_CODE_MESSAGE },
    };
  }

  const result = await verifyEmail({ userId: pending.userId, code });

  if (result.ok) {
    return { status: "success", message: "", errors: {} };
  }

  if (result.kind === "expired") {
    return { status: "expired", message: result.message, errors: {} };
  }

  if (result.kind === "rejected") {
    return {
      status: "rejected",
      message: result.message,
      errors: result.fieldErrors,
    };
  }

  return { status: "failed", message: result.message, errors: {} };
}

/** Reenvía el código al correo conservado y persiste la espera de 45 s. */
export async function resendVerificationAction(
  _previousState: ResendActionState,
  _formData: FormData,
): Promise<ResendActionState> {
  const pending = await readPendingRegistration();

  if (!pending) {
    return { status: "missing", message: MISSING_PENDING_MESSAGE };
  }

  if (resendWaitMs(pending, Date.now()) > 0) {
    return { status: "failed", message: RESEND_WAIT_MESSAGE };
  }

  const result = await resendVerificationCode(pending.email);

  if (!result.ok) {
    return { status: "failed", message: result.message };
  }

  await markPendingResent(pending);

  return { status: "sent", message: result.message || RESENT_MESSAGE };
}

/**
 * Descarta el pendiente cuando la confirmación ya se mostró (D2 corregida).
 * Se ejecuta desde el cliente justo antes de navegar para no desmontar el verde.
 */
export async function clearPendingVerificationAction(): Promise<void> {
  await clearPendingRegistration();
}
