import { cache } from "react";

import { getUser, listAllStaff, listUsersPage } from "../api/users.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import { toAccountState, toProfileState } from "./user-state.ts";
import type {
  AccountState,
  ProfileState,
  UserDetailResult,
  UserFilters,
  UserListResult,
} from "./types.ts";

/** Carga memoizada por render de una página del padrón. */
export const getUserListData = cache(
  async (
    token: string,
    filters: UserFilters,
    page: number,
  ): Promise<UserListResult> => listUsersPage(token, filters, page),
);

/** Carga memoizada por render del directorio completo. */
export const getStaffData = cache(
  async (token: string): Promise<UserListResult> => listAllStaff(token),
);

/** Carga memoizada por render del detalle de un usuario. */
export const getUserDetailData = cache(
  async (token: string, userId: string): Promise<UserDetailResult> =>
    getUser(token, userId),
);

/** Estado memoizado de Mi perfil a partir de la cuenta privada. */
export const getProfileData = cache(
  async (
    account: PrivateAccountState,
  ): Promise<Exclude<ProfileState, { readonly status: "loading" }>> =>
    toProfileState(account),
);

/** Estado memoizado de Configuración de cuenta. */
export const getAccountData = cache(
  async (
    account: PrivateAccountState,
  ): Promise<Exclude<AccountState, { readonly status: "loading" }>> =>
    toAccountState(account),
);
