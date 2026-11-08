import type { SessionClaims, UserRole } from "./types.ts";
import { KNOWN_ROLES } from "./types.ts";

/** Decodifica un segmento base64url (sin padding) a texto UTF-8. */
function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

/** Separa las partes del JWT y decodifica el payload; devuelve `null` si falla. */
export function parseJwtPayload(token: string): unknown | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const payloadSegment = parts[1];

  if (!payloadSegment) {
    return null;
  }

  try {
    const decoded = base64UrlDecode(payloadSegment);
    return JSON.parse(decoded) as unknown;
  } catch {
    return null;
  }
}

export function isKnownRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (KNOWN_ROLES as readonly string[]).includes(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Valida estructura y devuelve los claims; `null` si el token no es utilizable. */
export function decodeSessionToken(token: string): SessionClaims | null {
  const payload = parseJwtPayload(token);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (!isNonEmptyString(record.sub)) {
    return null;
  }

  if (!isNonEmptyString(record.email)) {
    return null;
  }

  if (!isKnownRole(record.role)) {
    return null;
  }

  if (
    typeof record.exp !== "number" ||
    !Number.isFinite(record.exp) ||
    record.exp <= 0
  ) {
    return null;
  }

  return {
    sub: record.sub,
    email: record.email,
    role: record.role,
    exp: record.exp,
  };
}

/** Vencido desde `now >= exp * 1000` (exp en segundos, now en milisegundos). */
export function isSessionExpired(
  claims: SessionClaims,
  now: number,
): boolean {
  return now >= claims.exp * 1000;
}
