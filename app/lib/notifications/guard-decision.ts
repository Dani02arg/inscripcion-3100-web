import { getEffectiveRole } from "../auth/effective-role.ts";
import type { PrivateAccountState } from "../dashboard/private-account-state.ts";
import {
  canReadNotifications,
  canSendNotifications,
} from "./access.ts";

export const NOTIFICATION_SESSION_EXPIRED_PATH = "/session-expired";

export const NOTIFICATION_ACCESS_DENIED_MESSAGE =
  "No tenés permisos para acceder a este módulo.";

export const NOTIFICATION_READ_DENIED_MESSAGE =
  "Tu cuenta no está habilitada para consultar notificaciones.";

export const NOTIFICATION_SEND_DENIED_MESSAGE =
  "Esta operación es exclusiva de los roles de administración y secretaría.";

export type NotificationAccessDecision = "allowed" | "forbidden";

/** Decisión de lectura: los tres roles conocidos. */
export function getNotificationReadDecision(
  role: unknown,
): NotificationAccessDecision {
  return canReadNotifications(role) ? "allowed" : "forbidden";
}

/** Decisión de envío: solo staff. */
export function getNotificationSendDecision(
  role: unknown,
): NotificationAccessDecision {
  return canSendNotifications(role) ? "allowed" : "forbidden";
}

/** Decisión de la página según la cuenta privada y el rol vigente. */
export function getNotificationPageDecision(
  account: PrivateAccountState,
): "allowed" | "forbidden" | "error" {
  if (account.status === "forbidden") {
    return "forbidden";
  }

  if (account.status === "error") {
    return "error";
  }

  return getNotificationReadDecision(getEffectiveRole(account));
}
