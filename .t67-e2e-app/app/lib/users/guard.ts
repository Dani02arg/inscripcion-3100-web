import { redirect } from "next/navigation";

import { getEffectiveRole } from "../auth/effective-role.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import type { UserRole } from "../auth/types.ts";
import { getPrivateAccount } from "../dashboard/private-account.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  TUTOR_ACTION_DENIED_MESSAGE,
  USER_ACCESS_DENIED_MESSAGE,
  USER_SESSION_EXPIRED_PATH,
  getProfilePageRoleDecision,
  getRoleRequestActionRoleDecision,
  getTutorActionRoleDecision,
  getUserActionRoleDecision,
  getUserPageRoleDecision,
} from "./guard-decision.ts";

function resolveRole(account: PrivateAccountState): UserRole {
  return getEffectiveRole(account) ?? account.claims.role;
}

async function requireToken(): Promise<string> {
  const token = await getSessionToken();

  if (!token) {
    redirect(USER_SESSION_EXPIRED_PATH);
  }

  return token;
}

export type UserPageAccess =
  | {
      readonly status: "ok";
      readonly role: UserRole;
      readonly account: PrivateAccountState;
      readonly token: string;
    }
  | {
      readonly status: "forbidden";
      readonly role: UserRole;
      readonly account: PrivateAccountState;
    }
  | {
      readonly status: "error";
      readonly role: UserRole;
      readonly account: PrivateAccountState;
    };

/**
 * Carga la cuenta y resuelve el acceso a una página de gestión de usuarios.
 * Sin sesión redirige a `/session-expired`; un rol sin permiso no llega a
 * solicitar datos.
 */
export async function getUserPageAccess(): Promise<UserPageAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);
  const decision = getUserPageRoleDecision(account);

  if (decision === "forbidden") {
    return { status: "forbidden", role, account };
  }

  if (decision === "error") {
    return { status: "error", role, account };
  }

  const token = await requireToken();
  return { status: "ok", role, account, token };
}

/** Carga la cuenta y resuelve el acceso a Mi perfil. */
export async function getProfilePageAccess(): Promise<UserPageAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);
  const decision = getProfilePageRoleDecision(account);

  if (decision === "forbidden") {
    return { status: "forbidden", role, account };
  }

  if (decision === "error") {
    return { status: "error", role, account };
  }

  const token = await requireToken();
  return { status: "ok", role, account, token };
}

/** Configuración de cuenta comparte el acceso con Mi perfil. */
export async function getAccountPageAccess(): Promise<UserPageAccess> {
  return getProfilePageAccess();
}

export type UserActionAccess =
  | {
      readonly status: "ok";
      readonly role: UserRole;
      readonly account: PrivateAccountState;
      readonly token: string;
    }
  | { readonly status: "forbidden"; readonly message: string };

/** Acceso de una Server Action de gestión de usuarios. */
export async function getUserActionAccess(): Promise<UserActionAccess> {
  const account = await getPrivateAccount();

  if (getUserActionRoleDecision(account) === "forbidden") {
    return { status: "forbidden", message: USER_ACCESS_DENIED_MESSAGE };
  }

  const token = await requireToken();
  return { status: "ok", role: resolveRole(account), account, token };
}

/** Acceso de la actualización del perfil de tutor. */
export async function getTutorProfileActionAccess(): Promise<UserActionAccess> {
  const account = await getPrivateAccount();

  if (getTutorActionRoleDecision(account) === "forbidden") {
    return { status: "forbidden", message: TUTOR_ACTION_DENIED_MESSAGE };
  }

  const token = await requireToken();
  return { status: "ok", role: resolveRole(account), account, token };
}

/** Acceso de la solicitud de cambio de rol. */
export async function getRoleRequestActionAccess(): Promise<UserActionAccess> {
  const account = await getPrivateAccount();

  if (getRoleRequestActionRoleDecision(account) === "forbidden") {
    return { status: "forbidden", message: TUTOR_ACTION_DENIED_MESSAGE };
  }

  const token = await requireToken();
  return { status: "ok", role: resolveRole(account), account, token };
}
