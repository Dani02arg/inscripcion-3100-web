import { USER_OPERATION_ERROR_MESSAGE } from "../api/users.ts";
import { isKnownRole } from "../auth/session.ts";
import type { UserRole } from "../auth/types.ts";
import {
  readRoleRequestFormData,
  readTutorProfileFormData,
  validateRoleRequest,
  validateTutorProfile,
} from "../validation/users.ts";
import { USER_SESSION_EXPIRED_PATH } from "./guard-decision.ts";
import type { UserActionAccess } from "./guard.ts";
import {
  CHANGE_ROLE_FORBIDDEN_REASON,
  CHANGE_ROLE_INVALID_REASON,
  CHANGE_ROLE_SELF_REASON,
  CHANGE_ROLE_UNVERIFIED_REASON,
  DELETE_USER_SELF_REASON,
  getChangeRoleDisabledReason,
  isOwnAccount,
} from "./rules.ts";
import { getUserOrigin, getUserOriginPath } from "./users-url.ts";
import type {
  RoleRequestPayload,
  RoleRequestResult,
  TutorProfilePayload,
  UserActionFailure,
  UserActionResult,
  UserFieldErrors,
} from "./types.ts";

export interface ChangeUserRoleDependencies {
  readonly getAccess: () => Promise<UserActionAccess>;
  readonly changeUserRole: (
    token: string,
    userId: string,
    newRole: UserRole,
  ) => Promise<UserActionResult>;
  readonly revalidatePath: (path: string) => void;
  readonly redirect: (path: string) => never;
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function readTargetVerified(value: string): boolean | null {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function localFailure(
  kind: UserActionFailure["kind"],
  message: string,
  fieldErrors?: UserFieldErrors,
): UserActionFailure {
  return {
    ok: false,
    kind,
    status: null,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

/** Núcleo testeable del cambio de rol. */
export async function changeUserRoleActionCore(
  _previousState: UserActionResult | null,
  formData: FormData,
  dependencies: ChangeUserRoleDependencies,
): Promise<UserActionResult> {
  const userId = readText(formData, "userId").trim();
  const newRole = readText(formData, "newRole").trim();
  const currentRole = readText(formData, "currentRole").trim();
  const targetVerified = readTargetVerified(
    readText(formData, "targetVerified"),
  );

  if (userId.length === 0) {
    return localFailure("failed", USER_OPERATION_ERROR_MESSAGE);
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const currentUserId =
    access.account.status === "ok" ? access.account.user.id : null;
  const isSelf = isOwnAccount(userId, currentUserId);
  const reason = getChangeRoleDisabledReason({
    viewerRole: access.role,
    currentRole,
    newRole,
    targetVerified,
    isSelf,
  });

  if (reason === CHANGE_ROLE_FORBIDDEN_REASON || reason === CHANGE_ROLE_SELF_REASON) {
    return localFailure("forbidden", reason);
  }

  if (reason === CHANGE_ROLE_UNVERIFIED_REASON) {
    return localFailure("conflict", reason);
  }

  if (reason !== null) {
    return localFailure("validation", reason, { newRole: reason });
  }

  if (!isKnownRole(newRole)) {
    return localFailure("validation", CHANGE_ROLE_INVALID_REASON, {
      newRole: CHANGE_ROLE_INVALID_REASON,
    });
  }

  const result = await dependencies.changeUserRole(
    access.token,
    userId,
    newRole,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/users");
    dependencies.revalidatePath("/dashboard/users/staff");
    dependencies.revalidatePath(
      `/dashboard/users/${encodeURIComponent(userId)}`,
    );

    return result;
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(USER_SESSION_EXPIRED_PATH);
  }

  return result;
}

export interface DeleteUserDependencies {
  readonly getAccess: () => Promise<UserActionAccess>;
  readonly deleteUser: (
    token: string,
    userId: string,
  ) => Promise<UserActionResult>;
  readonly revalidatePath: (path: string) => void;
  readonly redirect: (path: string) => never;
}

/** Núcleo testeable de la baja de un usuario. */
export async function deleteUserActionCore(
  _previousState: UserActionResult | null,
  formData: FormData,
  dependencies: DeleteUserDependencies,
): Promise<UserActionResult> {
  const userId = readText(formData, "userId").trim();
  const origin = readText(formData, "origin").trim();

  if (userId.length === 0) {
    return localFailure("failed", USER_OPERATION_ERROR_MESSAGE);
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const currentUserId =
    access.account.status === "ok" ? access.account.user.id : null;

  if (isOwnAccount(userId, currentUserId)) {
    return localFailure("forbidden", DELETE_USER_SELF_REASON);
  }

  const result = await dependencies.deleteUser(access.token, userId);

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/users");
    dependencies.revalidatePath("/dashboard/users/staff");
    dependencies.revalidatePath(
      `/dashboard/users/${encodeURIComponent(userId)}`,
    );

    if (origin.length > 0) {
      dependencies.redirect(
        `${getUserOriginPath(getUserOrigin(origin))}?deleted=1`,
      );
    }

    return result;
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(USER_SESSION_EXPIRED_PATH);
  }

  return result;
}

export interface UpdateTutorProfileDependencies {
  readonly getAccess: () => Promise<UserActionAccess>;
  readonly updateTutorProfile: (
    token: string,
    payload: TutorProfilePayload,
  ) => Promise<UserActionResult>;
  readonly revalidatePath: (path: string) => void;
  readonly redirect: (path: string) => never;
}

/** Núcleo testeable de la actualización del perfil de tutor. */
export async function updateTutorProfileActionCore(
  _previousState: UserActionResult | null,
  formData: FormData,
  dependencies: UpdateTutorProfileDependencies,
): Promise<UserActionResult> {
  const values = readTutorProfileFormData(formData);
  const validation = validateTutorProfile(values);
  const payload = validation.payload;

  if (!validation.valid || payload === null) {
    return localFailure("validation", "", validation.errors);
  }

  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const result = await dependencies.updateTutorProfile(
    access.token,
    payload,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/profile");
    dependencies.revalidatePath("/dashboard/account");
    return result;
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(USER_SESSION_EXPIRED_PATH);
  }

  return result;
}

export interface RequestRoleChangeDependencies {
  readonly getAccess: () => Promise<UserActionAccess>;
  readonly requestRoleChange: (
    token: string,
    payload: RoleRequestPayload,
  ) => Promise<RoleRequestResult>;
  readonly revalidatePath: (path: string) => void;
  readonly redirect: (path: string) => never;
}

/** Núcleo testeable de la solicitud de cambio de rol. */
export async function requestRoleChangeActionCore(
  _previousState: RoleRequestResult | null,
  formData: FormData,
  dependencies: RequestRoleChangeDependencies,
): Promise<RoleRequestResult> {
  const input = readRoleRequestFormData(formData);
  const access = await dependencies.getAccess();

  if (access.status === "forbidden") {
    return localFailure("forbidden", access.message);
  }

  const currentRole =
    access.account.status === "ok"
      ? access.account.user.role
      : access.role;
  const validation = validateRoleRequest(input, currentRole);
  const payload = validation.payload;

  if (!validation.valid || payload === null) {
    return localFailure("validation", "", validation.errors);
  }

  const result = await dependencies.requestRoleChange(
    access.token,
    payload,
  );

  if (result.ok) {
    dependencies.revalidatePath("/dashboard/account");
    return result;
  }

  if (result.kind === "unauthorized") {
    dependencies.redirect(USER_SESSION_EXPIRED_PATH);
  }

  return result;
}
