import type { PendingRegistration } from "./types.ts";

/** Longitud máxima admitida para el identificador conservado. */
const MAX_USER_ID_LENGTH = 128;

/** Longitud máxima admitida para el correo conservado. */
const MAX_EMAIL_LENGTH = 254;

/** Espera mínima entre reenvíos, en milisegundos. */
export const RESEND_WAIT_MS = 45_000;

/** Indica si un valor es un objeto plano. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Convierte un identificador en texto utilizable; acepta enteros positivos. */
function toUserId(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value.toString() : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > MAX_USER_ID_LENGTH) {
    return null;
  }

  return trimmed;
}

/** Convierte un correo en texto utilizable. */
function toEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH || !trimmed.includes("@")) {
    return null;
  }

  return trimmed;
}

/** Extrae el registro pendiente de los datos devueltos por el registro. */
export function extractPendingRegistration(
  data: unknown,
): PendingRegistration | null {
  if (!isRecord(data)) {
    return null;
  }

  const userId = toUserId(data.id);
  const email = toEmail(data.email);

  if (userId === null || email === null) {
    return null;
  }

  return { userId, email, resendAvailableAt: 0 };
}

/** Serializa el registro pendiente como valor de cookie. */
export function serializePendingRegistration(
  pending: PendingRegistration,
): string {
  return encodeURIComponent(
    JSON.stringify({
      userId: pending.userId,
      email: pending.email,
      resendAvailableAt: pending.resendAvailableAt,
    }),
  );
}

/** Interpreta el valor de la cookie y devuelve el pendiente válido o `null`. */
export function parsePendingRegistration(
  raw: string | null | undefined,
): PendingRegistration | null {
  if (!raw) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const userId =
    typeof parsed.userId === "string" ? toUserId(parsed.userId) : null;
  const email = toEmail(parsed.email);

  if (userId === null || email === null) {
    return null;
  }

  const resendAvailableAt = parsed.resendAvailableAt;
  let resendAt = 0;

  if (resendAvailableAt !== undefined) {
    if (
      typeof resendAvailableAt !== "number" ||
      !Number.isFinite(resendAvailableAt) ||
      resendAvailableAt < 0
    ) {
      return null;
    }

    resendAt = resendAvailableAt;
  }

  return { userId, email, resendAvailableAt: resendAt };
}

/** Milisegundos restantes para habilitar el reenvío; 0 si ya está habilitado. */
export function resendWaitMs(
  pending: PendingRegistration,
  now: number = Date.now(),
): number {
  if (!Number.isFinite(pending.resendAvailableAt) || !Number.isFinite(now)) {
    return 0;
  }

  return Math.max(0, pending.resendAvailableAt - now);
}
