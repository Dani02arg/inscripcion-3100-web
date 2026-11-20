import type { UserRole } from "../auth/types.ts";

/** Roles que pueden consultar, leer y descargar notificaciones propias. */
export const NOTIFICATION_READER_ROLES = Object.freeze([
  "TUTOR",
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly UserRole[]);

/** Roles que pueden emitir notificaciones. */
export const NOTIFICATION_SENDER_ROLES = Object.freeze([
  "ADMINISTRATIVO",
  "ADMINISTRADOR",
] as const satisfies readonly UserRole[]);

export type NotificationReaderRole =
  (typeof NOTIFICATION_READER_ROLES)[number];

export type NotificationSenderRole =
  (typeof NOTIFICATION_SENDER_ROLES)[number];

/** Indica si el rol puede consultar la bandeja y sus recursos. */
export function canReadNotifications(
  role: unknown,
): role is NotificationReaderRole {
  return (
    typeof role === "string" &&
    (NOTIFICATION_READER_ROLES as readonly string[]).includes(role)
  );
}

/** Indica si el rol puede enviar notificaciones. */
export function canSendNotifications(
  role: unknown,
): role is NotificationSenderRole {
  return (
    typeof role === "string" &&
    (NOTIFICATION_SENDER_ROLES as readonly string[]).includes(role)
  );
}
