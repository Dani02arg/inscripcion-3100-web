import { redirect } from "next/navigation";

import { getEffectiveRole } from "../auth/effective-role.ts";
import { getSessionToken } from "../auth/session-cookie.ts";
import type { UserRole } from "../auth/types.ts";
import { getPrivateAccount } from "../dashboard/private-account.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  getNotificationPageDecision,
  getNotificationReadDecision,
  getNotificationSendDecision,
  NOTIFICATION_READ_DENIED_MESSAGE,
  NOTIFICATION_SEND_DENIED_MESSAGE,
  NOTIFICATION_SESSION_EXPIRED_PATH,
} from "./guard-decision.ts";

function resolveRole(account: PrivateAccountState): UserRole {
  return getEffectiveRole(account) ?? account.claims.role;
}

async function requireToken(): Promise<string> {
  const token = await getSessionToken();

  if (!token) {
    redirect(NOTIFICATION_SESSION_EXPIRED_PATH);
  }

  return token;
}

export type NotificationPageAccess =
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

/** Acceso a la bandeja: los tres roles conocidos. */
export async function getNotificationPageAccess(): Promise<NotificationPageAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);
  const decision = getNotificationPageDecision(account);

  if (decision === "forbidden") {
    return { status: "forbidden", role, account };
  }

  if (decision === "error") {
    return { status: "error", role, account };
  }

  const token = await requireToken();

  return { status: "ok", role, account, token };
}

export type NotificationActionAccess =
  | { readonly status: "ok"; readonly token: string }
  | {
      readonly status: "forbidden";
      readonly message: string;
      readonly kind: "forbidden" | "unauthorized";
    };

/** Acceso de una acción de lectura; un rol ajeno no llama al servicio. */
export async function getNotificationReaderActionAccess(): Promise<NotificationActionAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);

  if (getNotificationReadDecision(role) === "forbidden") {
    return {
      status: "forbidden",
      message: NOTIFICATION_READ_DENIED_MESSAGE,
      kind: "forbidden",
    };
  }

  const token = await getSessionToken();

  if (!token) {
    return {
      status: "forbidden",
      message: "Tu sesión expiró. Iniciá sesión nuevamente.",
      kind: "unauthorized",
    };
  }

  return { status: "ok", token };
}

/** Acceso de una acción de envío; solo staff. */
export async function getNotificationSenderActionAccess(): Promise<NotificationActionAccess> {
  const account = await getPrivateAccount();
  const role = resolveRole(account);

  if (getNotificationSendDecision(role) === "forbidden") {
    return {
      status: "forbidden",
      message: NOTIFICATION_SEND_DENIED_MESSAGE,
      kind: "forbidden",
    };
  }

  const token = await getSessionToken();

  if (!token) {
    return {
      status: "forbidden",
      message: "Tu sesión expiró. Iniciá sesión nuevamente.",
      kind: "unauthorized",
    };
  }

  return { status: "ok", token };
}

/** Token para el badge; no redirige ni bloquea la página. */
export async function getNotificationBadgeToken(): Promise<string | null> {
  return getSessionToken();
}
