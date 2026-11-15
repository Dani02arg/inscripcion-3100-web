import {
  buildApprovePayload,
  buildObservePayload,
  buildReassignPayload,
  buildRejectPayload,
  validateObservations,
  validateReassignment,
} from "../validation/registrations.ts";
import { REGISTRATION_SESSION_EXPIRED_PATH } from "./guard-decision.ts";
import { toDictamenActionState } from "./registration-state.ts";
import type { DictamenActionResult, DictamenActionState } from "./types.ts";

export interface DictamenActionAccessOk {
  readonly status: "ok";
  readonly token: string;
}

export interface DictamenActionAccessForbidden {
  readonly status: "forbidden";
  readonly message: string;
}

export type DictamenActionAccess =
  | DictamenActionAccessOk
  | DictamenActionAccessForbidden;

export interface DictamenActionDependencies {
  readonly getAccess: () => Promise<DictamenActionAccess>;
  readonly callApi: (
    token: string,
    registrationId: string,
    payload: unknown,
  ) => Promise<DictamenActionResult>;
  readonly revalidatePath: (path: string) => void;
  readonly redirect: (path: string) => never;
}

const REGISTRATIONS_PATH = "/dashboard/registrations";
const MISSING_REGISTRATION_MESSAGE =
  "No pudimos identificar la inscripción. Intentá nuevamente.";

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function requireRegistrationId(formData: FormData): string | null {
  const id = readText(formData, "registrationId").trim();
  return id.length > 0 ? id : null;
}

function readOptionalFields(formData: FormData) {
  return {
    observations: readText(formData, "observations"),
    pendingSubjects: readText(formData, "pendingSubjects"),
    missingDocumentation: readText(formData, "missingDocumentation"),
  };
}

async function executeDictamen(
  registrationId: string,
  payload: unknown,
  dependencies: DictamenActionDependencies,
): Promise<DictamenActionState> {
  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return { status: "forbidden", message: access.message };
  }

  const result = await dependencies.callApi(
    access.token,
    registrationId,
    payload,
  );

  if (result.ok) {
    dependencies.revalidatePath(REGISTRATIONS_PATH);
    dependencies.revalidatePath(
      `${REGISTRATIONS_PATH}/${encodeURIComponent(registrationId)}`,
    );
    dependencies.revalidatePath("/dashboard");
    return { status: "success", message: result.message };
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(REGISTRATION_SESSION_EXPIRED_PATH);
    return { status: "error", message: result.message };
  }

  return toDictamenActionState(result);
}

/** Núcleo testeable del dictamen de aprobación. */
export async function approveActionCore(
  _previousState: DictamenActionState,
  formData: FormData,
  dependencies: DictamenActionDependencies,
): Promise<DictamenActionState> {
  const registrationId = requireRegistrationId(formData);

  if (!registrationId) {
    return { status: "error", message: MISSING_REGISTRATION_MESSAGE };
  }

  const payload = buildApprovePayload(readOptionalFields(formData));

  return executeDictamen(registrationId, payload, dependencies);
}

/** Núcleo testeable del dictamen de rechazo. */
export async function rejectActionCore(
  _previousState: DictamenActionState,
  formData: FormData,
  dependencies: DictamenActionDependencies,
): Promise<DictamenActionState> {
  const registrationId = requireRegistrationId(formData);

  if (!registrationId) {
    return { status: "error", message: MISSING_REGISTRATION_MESSAGE };
  }

  const payload = buildRejectPayload(readOptionalFields(formData));

  return executeDictamen(registrationId, payload, dependencies);
}

/** Núcleo testeable del dictamen de devolución con observaciones. */
export async function observeActionCore(
  _previousState: DictamenActionState,
  formData: FormData,
  dependencies: DictamenActionDependencies,
): Promise<DictamenActionState> {
  const registrationId = requireRegistrationId(formData);

  if (!registrationId) {
    return { status: "error", message: MISSING_REGISTRATION_MESSAGE };
  }

  const observations = readText(formData, "observations");
  const error = validateObservations(observations);

  if (error) {
    return {
      status: "validation",
      message: "",
      fieldErrors: { observations: error },
    };
  }

  const payload = buildObservePayload({ observations });

  return executeDictamen(registrationId, payload, dependencies);
}

/** Núcleo testeable del dictamen de reasignación. */
export async function reassignActionCore(
  _previousState: DictamenActionState,
  formData: FormData,
  dependencies: DictamenActionDependencies,
): Promise<DictamenActionState> {
  const registrationId = requireRegistrationId(formData);

  if (!registrationId) {
    return { status: "error", message: MISSING_REGISTRATION_MESSAGE };
  }

  const newCourseId = readText(formData, "newCourseId");
  const reassignmentReason = readText(formData, "reassignmentReason");
  const errors = validateReassignment({ newCourseId, reassignmentReason });

  if (Object.keys(errors).length > 0) {
    return { status: "validation", message: "", fieldErrors: errors };
  }

  const payload = buildReassignPayload({
    newCourseId,
    reassignmentReason,
    ...readOptionalFields(formData),
  });

  return executeDictamen(registrationId, payload, dependencies);
}
