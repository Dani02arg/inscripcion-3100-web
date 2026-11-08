import { ACCESS_DENIED_MESSAGE } from "../auth/types.ts";
import { getTutorProfileValues } from "./profile.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import type {
  AccountState,
  ProfileState,
  RoleRequestActionState,
  RoleRequestInput,
  RoleRequestResult,
  TutorProfileActionState,
  TutorProfileInput,
  UserActionResult,
  UserActionState,
  UserDetailResult,
  UserDetailState,
  UserListMeta,
  UserListResult,
  UserListState,
  UserPage,
  UserSummary,
} from "./types.ts";

export const USER_LIST_LOADING_STATE: UserListState = {
  status: "loading",
};

export const USER_DETAIL_LOADING_STATE: UserDetailState = {
  status: "loading",
};

export const USER_ACTION_IDLE_STATE: UserActionState = {
  status: "idle",
};

export const USER_ACTION_PENDING_STATE: UserActionState = {
  status: "pending",
};

function buildUserPage(
  users: UserSummary[],
  meta: UserListMeta,
): UserPage {
  const total = meta.total;
  const pageSize = meta.perPage;
  const startIndex = (meta.currentPage - 1) * pageSize;

  return {
    items: users,
    page: meta.currentPage,
    pageSize,
    total,
    totalPages: meta.lastPage,
    from: total === 0 ? 0 : startIndex + 1,
    to: total === 0 ? 0 : startIndex + users.length,
  };
}

function failureToListState(result: UserListResult): UserListState {
  if (!result.ok) {
    if (result.kind === "forbidden") {
      return { status: "forbidden", message: result.message };
    }

    return { status: "error", message: result.message };
  }

  return { status: "error", message: "" };
}

function readyOrEmpty(
  page: UserPage,
  hasActiveFilters: boolean,
): UserListState {
  if (page.total === 0) {
    return hasActiveFilters
      ? { status: "no_results", page }
      : { status: "empty", page };
  }

  return { status: "ready", users: page.items, page };
}

/** Traduce el resultado del padrón a un estado de página. */
export function toUserListState(
  result: UserListResult,
  hasActiveFilters: boolean,
): UserListState {
  if (!result.ok) {
    return failureToListState(result);
  }

  return readyOrEmpty(
    buildUserPage(result.users, result.meta),
    hasActiveFilters,
  );
}

/** Traduce el conjunto completo del directorio y su página filtrada. */
export function toStaffState(
  result: UserListResult,
  page: UserPage,
  hasActiveFilters: boolean,
): UserListState {
  if (!result.ok) {
    return failureToListState(result);
  }

  return readyOrEmpty(page, hasActiveFilters);
}

/** Traduce el resultado del detalle a un estado de página. */
export function toUserDetailState(
  result: UserDetailResult,
): Exclude<UserDetailState, { readonly status: "loading" }> {
  if (result.ok) {
    return { status: "ready", user: result.user };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found" };
  }

  return { status: "error", message: result.message };
}

/** Traduce el resultado de una escritura a un estado de acción. */
export function toUserActionState(
  result: UserActionResult,
): UserActionState {
  if (result.ok) {
    return {
      status: "success",
      message: result.message,
      ...(result.user ? { user: result.user } : {}),
    };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
    };
  }

  if (result.kind === "conflict") {
    return { status: "conflict", message: result.message };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message };
  }

  if (result.kind === "not_found") {
    return { status: "not_found", message: result.message };
  }

  return { status: "error", message: result.message };
}

/** Traduce la cuenta privada al estado de Mi perfil. */
export function toProfileState(
  account: PrivateAccountState,
): Exclude<ProfileState, { readonly status: "loading" }> {
  if (account.status === "ok") {
    return { status: "ready", user: account.user };
  }

  if (account.status === "forbidden") {
    return { status: "forbidden", message: ACCESS_DENIED_MESSAGE };
  }

  return { status: "error", message: account.message };
}

/** Traduce la cuenta privada al estado de Configuración de cuenta. */
export function toAccountState(
  account: PrivateAccountState,
): Exclude<AccountState, { readonly status: "loading" }> {
  return toProfileState(account);
}

/** Traduce el resultado del perfil de tutor a estado de formulario. */
export function toTutorProfileActionState(
  result: UserActionResult,
  values: TutorProfileInput,
): TutorProfileActionState {
  if (result.ok) {
    return {
      status: "success",
      message: result.message,
      ...(result.user ? { user: result.user } : {}),
      values,
    };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
      values,
    };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message, values };
  }

  return { status: "error", message: result.message, values };
}

/** Prefiere los datos confirmados por el servicio y conserva el borrador ante fallos. */
export function getTutorProfileFormValues(
  state: TutorProfileActionState,
  initialValues: TutorProfileInput,
): TutorProfileInput {
  if (state.status === "success" && state.user) {
    return getTutorProfileValues(state.user);
  }

  return state.values ?? initialValues;
}

/** Traduce el resultado de la solicitud de rol a estado de formulario. */
export function toRoleRequestActionState(
  result: RoleRequestResult,
  values: RoleRequestInput,
): RoleRequestActionState {
  if (result.ok) {
    return { status: "success", message: result.message, values };
  }

  if (result.kind === "validation") {
    return {
      status: "validation",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
      values,
    };
  }

  if (result.kind === "forbidden") {
    return { status: "forbidden", message: result.message, values };
  }

  return { status: "error", message: result.message, values };
}
