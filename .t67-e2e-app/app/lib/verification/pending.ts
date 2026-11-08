import { cookies } from "next/headers";

import {
  RESEND_WAIT_MS,
  parsePendingRegistration,
  serializePendingRegistration,
} from "./pending-value.ts";
import type { PendingRegistration } from "./types.ts";

/** Nombre de la cookie que conserva el registro pendiente. */
export const PENDING_COOKIE_NAME = "verify_pending";

/** Vigencia de la cookie: siete días, suficiente para completar la verificación. */
export const PENDING_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: PENDING_COOKIE_MAX_AGE_SECONDS,
  };
}

/** Lee y valida el registro pendiente; un valor inválido se trata como ausente. */
export async function readPendingRegistration(): Promise<PendingRegistration | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PENDING_COOKIE_NAME);

  if (!cookie) {
    return null;
  }

  return parsePendingRegistration(cookie.value);
}

/** Escribe el registro pendiente en la cookie httpOnly. */
export async function writePendingRegistration(
  pending: PendingRegistration,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    PENDING_COOKIE_NAME,
    serializePendingRegistration(pending),
    getCookieOptions(),
  );
}

/** Reescribe la cookie con el próximo instante habilitado para reenviar. */
export async function markPendingResent(
  pending: PendingRegistration,
  now: number = Date.now(),
): Promise<PendingRegistration> {
  const updated = { ...pending, resendAvailableAt: now + RESEND_WAIT_MS };

  await writePendingRegistration(updated);

  return updated;
}

/** Descarta el registro pendiente. */
export async function clearPendingRegistration(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(PENDING_COOKIE_NAME);
}
