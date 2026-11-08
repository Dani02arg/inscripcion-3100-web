import {
  parseRecoveryRequest,
  serializeRecoveryRequest,
  type RecoveryRequest,
} from "./request-value.ts";

/** Clave de la solicitud activa en el almacenamiento de la pestaña. */
export const RECOVERY_REQUEST_STORAGE_KEY = "password_recovery_request";

/** Clave del aviso de solicitud enviada en el almacenamiento de la pestaña. */
export const RECOVERY_NOTICE_STORAGE_KEY = "password_recovery_notice";

const NOTICE_VALUE = "1";

/** Resuelve el almacenamiento de la pestaña sin lanzar si no está disponible. */
function resolveStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Lee la solicitud activa; un fallo o un valor inválido se trata como ausencia. */
export function readRecoveryRequest(
  storage?: Storage | null,
): RecoveryRequest | null {
  const target = resolveStorage(storage);

  if (!target) {
    return null;
  }

  try {
    return parseRecoveryRequest(target.getItem(RECOVERY_REQUEST_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Guarda la solicitud activa y reemplaza la anterior; un fallo no se propaga. */
export function writeRecoveryRequest(
  request: RecoveryRequest,
  storage?: Storage | null,
): void {
  const target = resolveStorage(storage);

  if (!target) {
    return;
  }

  try {
    target.setItem(
      RECOVERY_REQUEST_STORAGE_KEY,
      serializeRecoveryRequest(request),
    );
  } catch {
    // Sin almacenamiento la solicitud se considera ausente.
  }
}

/** Descarta la solicitud activa; un fallo no se propaga. */
export function clearRecoveryRequest(storage?: Storage | null): void {
  const target = resolveStorage(storage);

  if (!target) {
    return;
  }

  try {
    target.removeItem(RECOVERY_REQUEST_STORAGE_KEY);
  } catch {
    // Un fallo de borrado deja la solicitud como estaba.
  }
}

/** Registra el aviso de solicitud enviada para la pantalla de cambio. */
export function writeRecoveryNotice(storage?: Storage | null): void {
  const target = resolveStorage(storage);

  if (!target) {
    return;
  }

  try {
    target.setItem(RECOVERY_NOTICE_STORAGE_KEY, NOTICE_VALUE);
  } catch {
    // Sin almacenamiento el aviso no se muestra.
  }
}

/** Consume el aviso una sola vez; un fallo de lectura o borrado no se propaga. */
export function consumeRecoveryNotice(
  storage?: Storage | null,
): boolean {
  const target = resolveStorage(storage);

  if (!target) {
    return false;
  }

  let present: boolean;

  try {
    present = target.getItem(RECOVERY_NOTICE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }

  if (!present) {
    return false;
  }

  try {
    target.removeItem(RECOVERY_NOTICE_STORAGE_KEY);
  } catch {
    // El aviso ya se mostró aunque no se haya podido borrar.
  }

  return true;
}
