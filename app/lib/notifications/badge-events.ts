export const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";

function resolveTarget(target?: EventTarget): EventTarget | null {
  if (target) {
    return target;
  }

  return typeof window === "undefined" ? null : window;
}

/** Notifica que la bandeja o el badge deben recalcularse. */
export function notifyNotificationsChanged(target?: EventTarget): void {
  const eventTarget = resolveTarget(target);

  eventTarget?.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

/** Suscribe un oyente y devuelve la función para retirarlo. */
export function subscribeNotificationsChanged(
  listener: () => void,
  target?: EventTarget,
): () => void {
  const eventTarget = resolveTarget(target);

  if (!eventTarget) {
    return () => {};
  }

  const handler = (): void => {
    listener();
  };

  eventTarget.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);

  return () => {
    eventTarget.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
  };
}
