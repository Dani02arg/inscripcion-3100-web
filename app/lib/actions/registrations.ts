"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { downloadRegistrationForm } from "../api/registration-form.ts";
import {
  approveRegistration,
  observeRegistration,
  proposeReassignment,
  rejectRegistration,
} from "../api/registrations.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import {
  approveActionCore,
  observeActionCore,
  reassignActionCore,
  rejectActionCore,
} from "../registrations/action-core.ts";
import type { DictamenActionState } from "../registrations/types.ts";
import { getRegistrationActionAccess } from "../registrations/guard.ts";

export type { DictamenActionState };

/** Server Action para aprobar una solicitud. */
export async function approveRegistrationAction(
  previousState: DictamenActionState,
  formData: FormData,
): Promise<DictamenActionState> {
  return approveActionCore(previousState, formData, {
    getAccess: getRegistrationActionAccess,
    callApi: approveRegistration,
    revalidatePath: (path) => revalidatePath(path),
    redirect,
  });
}

/** Server Action para rechazar una solicitud. */
export async function rejectRegistrationAction(
  previousState: DictamenActionState,
  formData: FormData,
): Promise<DictamenActionState> {
  return rejectActionCore(previousState, formData, {
    getAccess: getRegistrationActionAccess,
    callApi: rejectRegistration,
    revalidatePath: (path) => revalidatePath(path),
    redirect,
  });
}

/** Server Action para devolver una solicitud con observaciones. */
export async function observeRegistrationAction(
  previousState: DictamenActionState,
  formData: FormData,
): Promise<DictamenActionState> {
  return observeActionCore(previousState, formData, {
    getAccess: getRegistrationActionAccess,
    callApi: observeRegistration,
    revalidatePath: (path) => revalidatePath(path),
    redirect,
  });
}

/** Server Action para proponer una reasignación de curso. */
export async function reassignRegistrationAction(
  previousState: DictamenActionState,
  formData: FormData,
): Promise<DictamenActionState> {
  return reassignActionCore(previousState, formData, {
    getAccess: getRegistrationActionAccess,
    callApi: proposeReassignment,
    revalidatePath: (path) => revalidatePath(path),
    redirect,
  });
}

export type RegistrationFormActionResult =
  | {
      readonly ok: true;
      readonly base64: string;
      readonly filename: string;
      readonly contentType: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly unauthorized?: boolean;
    };

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

/**
 * Server Action que descarga el formulario en PDF por la capa centralizada y
 * lo entrega como base64 para previsualizarlo en el modal.
 */
export async function fetchRegistrationFormAction(
  registrationId: string,
): Promise<RegistrationFormActionResult> {
  const token = await getSessionToken();

  if (!token) {
    return {
      ok: false,
      message: "Tu sesión expiró. Iniciá sesión nuevamente.",
      unauthorized: true,
    };
  }

  const result = await downloadRegistrationForm(token, registrationId);

  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      ...(result.status === 401 ? { unauthorized: true } : {}),
    };
  }

  return {
    ok: true,
    base64: await blobToBase64(result.blob),
    filename: result.filename,
    contentType: result.contentType,
  };
}
