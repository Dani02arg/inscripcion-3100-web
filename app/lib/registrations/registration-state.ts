import type {
  DictamenActionResult,
  DictamenActionState,
  RegistrationDetailResult,
  RegistrationDetailState,
  RegistrationListResult,
  RegistrationListState,
  RegistrationTutor,
} from "./types.ts";

/**
 * Traduce el resultado del listado a un estado excluyente. Un error no se
 * muestra junto con el estado vacío.
 */
export function toRegistrationListState(
  result: RegistrationListResult,
): RegistrationListState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    return { status: "error", message: result.message };
  }

  if (result.registrations.length === 0) {
    return { status: "empty" };
  }

  return { status: "ready", registrations: result.registrations };
}

/**
 * Traduce el detalle y el tutor ya resuelto. Un fallo del tutor no invalida el
 * detalle: se muestra «No informado» con `tutor` nulo.
 */
export function toRegistrationDetailState(
  result: RegistrationDetailResult,
  tutor: RegistrationTutor | null = null,
): RegistrationDetailState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    if (result.kind === "not_found") {
      return { status: "not_found" };
    }

    return { status: "error", message: result.message };
  }

  return {
    status: "ready",
    registration: result.registration,
    tutor,
  };
}

/** Traduce el resultado de un dictamen a un estado de acción. */
export function toDictamenActionState(
  result: DictamenActionResult,
): DictamenActionState {
  if (result.ok) {
    return { status: "success", message: result.message };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
    };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message };
  }

  if (result.kind === "conflict") {
    return { status: "conflict", message: result.message };
  }

  return { status: "error", message: result.message };
}
