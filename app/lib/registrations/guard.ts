import { redirect } from "next/navigation";

import { getEffectiveRole } from "../auth/effective-role.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import type { UserRole } from "../auth/types.ts";
import { getPrivateAccount } from "../dashboard/private-account.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  REGISTRATION_EVALUATE_DENIED_MESSAGE,
  REGISTRATION_SESSION_EXPIRED_PATH,
  getRegistrationActionRoleDecision,
  getRegistrationPageDecision,
  type RegistrationPageSection,
} from "./guard-decision.ts";

function resolveRole(account: PrivateAccountState): UserRole {
  return getEffectiveRole(account) ?? account.claims.role;
}

async function requireToken(): Promise<string> {
  const token = await getSessionToken();

  if (!token) {
    redirect(REGISTRATION_SESSION_EXPIRED_PATH);
  }

  return token;
}

export type RegistrationPageAccess =
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
 * Carga la cuenta y resuelve el acceso a una pantalla del módulo de
 * inscripciones. Sin sesión redirige a `/session-expired`; un rol sin permiso
 * no llega a solicitar datos.
 */
export async function getRegistrationPageAccess(
  section: RegistrationPageSection = "list",
): Promise<RegistrationPageAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);
  const decision = getRegistrationPageDecision(account, section);

  if (decision === "forbidden") {
    return { status: "forbidden", role, account };
  }

  if (decision === "error") {
    return { status: "error", role, account };
  }

  const token = await requireToken();
  return { status: "ok", role, account, token };
}

export type RegistrationActionAccess =
  | {
      readonly status: "ok";
      readonly role: UserRole;
      readonly account: PrivateAccountState;
      readonly token: string;
    }
  | { readonly status: "forbidden"; readonly message: string };

/**
 * Acceso de una Server Action de dictamen. Un rol distinto del staff obtiene
 * la denegación sin solicitar el token ni llamar al servicio.
 */
export async function getRegistrationActionAccess(): Promise<RegistrationActionAccess> {
  const account = await getPrivateAccount();

  if (getRegistrationActionRoleDecision(account) === "forbidden") {
    return {
      status: "forbidden",
      message: REGISTRATION_EVALUATE_DENIED_MESSAGE,
    };
  }

  const token = await requireToken();
  return {
    status: "ok",
    role: resolveRole(account),
    account,
    token,
  };
}
