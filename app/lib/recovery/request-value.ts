import { isValidEmail, trimText } from "../validation/register.ts";
import { maskEmail } from "../verification/mask-email.ts";

/** Vigencia de la solicitud activa: 15 minutos. */
export const RECOVERY_TTL_MS = 15 * 60 * 1000;

/** Longitud máxima admitida para el correo conservado. */
const MAX_EMAIL_LENGTH = 254;

export interface RecoveryRequest {
  email: string;
  requestedAt: number;
}

/** Solo la entrada desde Configuración de cuenta evita restaurar el correo. */
export function shouldRestoreSavedRecoveryRequest(
  source: string | string[] | undefined,
): boolean {
  return source !== "account";
}

/** Indica si un valor es un objeto plano. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Convierte un valor en un correo válido o devuelve `null`. */
function toEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = trimText(value);

  if (!email || email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
    return null;
  }

  return email;
}

/** Convierte un valor en un instante válido o devuelve `null`. */
function toRequestedAt(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

/** Serializa la solicitud activa sin incluir código ni contraseña. */
export function serializeRecoveryRequest(
  request: RecoveryRequest,
): string {
  return JSON.stringify({
    email: trimText(request.email),
    requestedAt: request.requestedAt,
  });
}

/** Interpreta la solicitud guardada y devuelve `null` si no es utilizable. */
export function parseRecoveryRequest(
  raw: string | null | undefined,
): RecoveryRequest | null {
  if (typeof raw !== "string" || raw.length === 0) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const email = toEmail(parsed.email);
  const requestedAt = toRequestedAt(parsed.requestedAt);

  if (email === null || requestedAt === null) {
    return null;
  }

  return { email, requestedAt };
}

/** Indica si la solicitud superó los 15 minutos; un instante futuro no vence. */
export function isRecoveryExpired(
  request: RecoveryRequest,
  now: number = Date.now(),
): boolean {
  if (!Number.isFinite(request.requestedAt) || !Number.isFinite(now)) {
    return true;
  }

  return now - request.requestedAt >= RECOVERY_TTL_MS;
}

/** Enmascara el correo de destino con la máscara compartida del proyecto. */
export function maskRecoveryEmail(email: string): string {
  return maskEmail(email);
}
