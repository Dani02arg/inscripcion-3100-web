"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  changeUserRole,
  deleteUser,
  requestRoleChange,
  updateTutorProfile,
} from "../api/users.ts";
import {
  changeUserRoleActionCore,
  deleteUserActionCore,
  requestRoleChangeActionCore,
  updateTutorProfileActionCore,
} from "../users/action-core.ts";
import {
  getRoleRequestActionAccess,
  getTutorProfileActionAccess,
  getUserActionAccess,
} from "../users/guard.ts";
import {
  toRoleRequestActionState,
  toTutorProfileActionState,
  toUserActionState,
} from "../users/user-state.ts";
import type {
  RoleRequestActionState,
  TutorProfileActionState,
  UserActionState,
} from "../users/types.ts";
import {
  readRoleRequestFormData,
  readTutorProfileFormData,
} from "../validation/users.ts";

const revalidate = (path: string) => revalidatePath(path);

/** Server Action de cambio de rol. */
export async function changeUserRoleAction(
  _previousState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const result = await changeUserRoleActionCore(null, formData, {
    getAccess: getUserActionAccess,
    changeUserRole,
    revalidatePath: revalidate,
    redirect,
  });

  return toUserActionState(result);
}

/** Server Action de baja de usuario. */
export async function deleteUserAction(
  _previousState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const result = await deleteUserActionCore(null, formData, {
    getAccess: getUserActionAccess,
    deleteUser,
    revalidatePath: revalidate,
    redirect,
  });

  return toUserActionState(result);
}

/** Server Action de actualización del perfil de tutor. */
export async function updateTutorProfileAction(
  _previousState: TutorProfileActionState,
  formData: FormData,
): Promise<TutorProfileActionState> {
  const values = readTutorProfileFormData(formData);
  const result = await updateTutorProfileActionCore(null, formData, {
    getAccess: getTutorProfileActionAccess,
    updateTutorProfile,
    revalidatePath: revalidate,
    redirect,
  });

  return toTutorProfileActionState(result, values);
}

/** Server Action de solicitud de cambio de rol. */
export async function requestRoleChangeAction(
  _previousState: RoleRequestActionState,
  formData: FormData,
): Promise<RoleRequestActionState> {
  const values = readRoleRequestFormData(formData);
  const result = await requestRoleChangeActionCore(null, formData, {
    getAccess: getRoleRequestActionAccess,
    requestRoleChange,
    revalidatePath: revalidate,
    redirect,
  });

  return toRoleRequestActionState(result, values);
}
