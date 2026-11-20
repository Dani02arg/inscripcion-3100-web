"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { getNotificationBadgeAction } from "../../lib/actions/notifications.ts";
import { subscribeNotificationsChanged } from "../../lib/notifications/badge-events.ts";

/**
 * Conteo de no leídas para el badge. Se recalcula al cambiar de ruta y ante
 * el evento interno de lectura o envío. Un fallo oculta el badge.
 */
export function useUnreadNotifications(): number | null {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const refresh = (): void => {
      getNotificationBadgeAction()
        .then((value) => {
          if (active) {
            setCount(value);
          }
        })
        .catch(() => {
          if (active) {
            setCount(null);
          }
        });
    };

    refresh();

    const unsubscribe = subscribeNotificationsChanged(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [pathname]);

  return count;
}
