import { redirect } from "next/navigation";

import type { SessionClaims } from "../auth/types.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import { getPrivateAccount } from "../dashboard/private-account.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  COURSE_ACCESS_DENIED_MESSAGE,
  COURSE_SESSION_EXPIRED_PATH,
  getCourseActionRoleDecision,
  getCoursePageRoleDecision,
} from "./guard-decision.ts";

export {
  COURSE_ACCESS_DENIED_MESSAGE,
  COURSE_SESSION_EXPIRED_PATH,
  getCourseAccessDecision,
} from "./guard-decision.ts";
export type {
  CourseAccessDecision,
  CoursePageRoleDecision,
} from "./guard-decision.ts";

export type CoursePageAccess =
  | {
      readonly status: "ok";
      readonly claims: SessionClaims;
      readonly account: PrivateAccountState;
      readonly token: string;
    }
  | {
      readonly status: "forbidden";
      readonly claims: SessionClaims;
      readonly account: PrivateAccountState;
    }
  | {
      readonly status: "error";
      readonly account: PrivateAccountState;
    };

/**
 * Carga la cuenta privada y resuelve el acceso a una página del módulo.
 * Sin sesión redirige a `/session-expired`; un rol sin permiso no llega a
 * solicitar datos de cursos.
 */
export async function getCoursePageAccess(): Promise<CoursePageAccess> {
  const account = await getPrivateAccount();
  const decision = getCoursePageRoleDecision(account);

  if (decision === "forbidden") {
    return {
      status: "forbidden",
      claims: account.claims,
      account,
    };
  }

  if (decision === "error") {
    return { status: "error", account };
  }

  const token = await getSessionToken();

  if (!token) {
    redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  return {
    status: "ok",
    claims: account.claims,
    account,
    token,
  };
}

export type CourseActionAccess =
  | {
      readonly status: "ok";
      readonly claims: SessionClaims;
      readonly token: string;
    }
  | {
      readonly status: "forbidden";
      readonly message: string;
    };

/**
 * Resuelve el acceso de una Server Action. Sin sesión redirige a
 * `/session-expired`; un rol sin permiso no llama a la API de cursos.
 */
export async function getCourseActionAccess(): Promise<CourseActionAccess> {
  const account = await getPrivateAccount();

  if (getCourseActionRoleDecision(account) === "forbidden") {
    return {
      status: "forbidden",
      message: COURSE_ACCESS_DENIED_MESSAGE,
    };
  }

  const token = await getSessionToken();

  if (!token) {
    redirect(COURSE_SESSION_EXPIRED_PATH);
  }

  return { status: "ok", claims: account.claims, token };
}
