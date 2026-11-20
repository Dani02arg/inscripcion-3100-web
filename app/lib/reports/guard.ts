import { redirect } from "next/navigation";

import { getEffectiveRole } from "../auth/effective-role.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import type { UserRole } from "../auth/types.ts";
import { getPrivateAccount } from "../dashboard/private-account.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import { canAccessReports, isReportsAccessRole } from "./access.ts";
import type { ReportsAccessRole } from "./types.ts";

const SESSION_EXPIRED_PATH = "/session-expired";

function resolveRole(account: PrivateAccountState): UserRole {
  return getEffectiveRole(account) ?? account.claims.role;
}

async function requireToken(): Promise<string> {
  const token = await getSessionToken();

  if (!token) {
    redirect(SESSION_EXPIRED_PATH);
  }

  return token;
}

export type ReportsPageAccess =
  | {
      readonly status: "ok";
      readonly role: ReportsAccessRole;
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
 * Carga la cuenta y resuelve el acceso al módulo de reportes.
 * Sin sesión redirige a `/session-expired`; un rol sin permiso no llega a
 * solicitar datos ni exponer contenido del módulo.
 */
export async function getReportsPageAccess(): Promise<ReportsPageAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);

  if (account.status === "forbidden") {
    return { status: "forbidden", role, account };
  }

  if (account.status === "error") {
    return { status: "error", role, account };
  }

  if (!isReportsAccessRole(role) || !canAccessReports(role)) {
    return { status: "forbidden", role, account };
  }

  const token = await requireToken();
  return { status: "ok", role, account, token };
}
