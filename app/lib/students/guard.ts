import { redirect } from "next/navigation";

import { getEffectiveRole } from "../auth/effective-role.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import type { UserRole } from "../auth/types.ts";
import { getPrivateAccount } from "../dashboard/private-account.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  STUDENT_SESSION_EXPIRED_PATH,
  STUDENT_WRITE_DENIED_MESSAGE,
  getStudentActionRoleDecision,
  getStudentSectionDecision,
  type StudentPageSection,
} from "./guard-decision.ts";

function resolveRole(account: PrivateAccountState): UserRole {
  return getEffectiveRole(account) ?? account.claims.role;
}

async function requireToken(): Promise<string> {
  const token = await getSessionToken();

  if (!token) {
    redirect(STUDENT_SESSION_EXPIRED_PATH);
  }

  return token;
}

export type StudentPageAccess =
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
 * Carga la cuenta y resuelve el acceso a una pantalla del módulo de alumnos.
 * Sin sesión redirige a `/session-expired`; un rol sin permiso no llega a
 * solicitar datos. La lista y el detalle admiten a los tres roles; el alta y
 * la edición son exclusivas del tutor.
 */
export async function getStudentPageAccess(
  section: StudentPageSection = "list",
): Promise<StudentPageAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);
  const decision = getStudentSectionDecision(account, section);

  if (decision === "forbidden") {
    return { status: "forbidden", role, account };
  }

  if (decision === "error") {
    return { status: "error", role, account };
  }

  const token = await requireToken();
  return { status: "ok", role, account, token };
}

export type StudentActionAccess =
  | {
      readonly status: "ok";
      readonly role: UserRole;
      readonly account: PrivateAccountState;
      readonly token: string;
    }
  | { readonly status: "forbidden"; readonly message: string };

/**
 * Acceso de una Server Action de alta o edición. Un rol distinto del tutor
 * obtiene la denegación sin solicitar el token ni llamar al servicio.
 */
export async function getStudentActionAccess(): Promise<StudentActionAccess> {
  const account = await getPrivateAccount();

  if (getStudentActionRoleDecision(account) === "forbidden") {
    return { status: "forbidden", message: STUDENT_WRITE_DENIED_MESSAGE };
  }

  const token = await requireToken();
  return {
    status: "ok",
    role: resolveRole(account),
    account,
    token,
  };
}
