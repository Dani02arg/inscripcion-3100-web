import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import { getNotificationsData } from "../../lib/notifications/data.ts";
import {
  NOTIFICATION_ACCESS_DENIED_MESSAGE,
  NOTIFICATION_SESSION_EXPIRED_PATH,
} from "../../lib/notifications/guard-decision.ts";
import { getNotificationPageAccess } from "../../lib/notifications/guard.ts";
import { canSendNotifications } from "../../lib/notifications/access.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import NotificationsView from "../../ui/notifications/notifications-view.tsx";
import {
  NotificationFiltersPlaceholder,
  NotificationMessageState,
} from "../../ui/notifications/notification-states.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Notificaciones | EET N° 3100",
  description: "Bandeja de notificaciones de la EET N° 3100.",
};

export default async function NotificationsPage() {
  const access = await getNotificationPageAccess();
  const collapsed = await getCollapsedPreference();
  const account = access.account;
  const role = getEffectiveRole(account) ?? account.claims.role;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={role}
      account={toSidebarAccount(account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">{content}</div>
      </main>
    </PrivateShell>
  );

  const errorContent = (message: string) => (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-texto-principal">Notificaciones</h1>
        <p className="mt-1 text-sm text-texto-secundario">
          Avisos recibidos en tu cuenta.
        </p>
      </header>

      <NotificationFiltersPlaceholder />

      <div className="space-y-4">
        <NotificationMessageState message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>
    </div>
  );

  if (access.status === "forbidden") {
    return shell(
      <NotificationMessageState
        tone="forbidden"
        message={NOTIFICATION_ACCESS_DENIED_MESSAGE}
      />,
    );
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : "No pudimos preparar la bandeja. Intentá nuevamente.";

    return shell(errorContent(message));
  }

  const result = await getNotificationsData(access.token);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(NOTIFICATION_SESSION_EXPIRED_PATH);
    }

    if (result.kind === "forbidden") {
      return shell(
        <NotificationMessageState
          tone="forbidden"
          message={NOTIFICATION_ACCESS_DENIED_MESSAGE}
        />,
      );
    }

    return shell(errorContent(result.message));
  }

  return shell(
    <NotificationsView
      initialNotifications={result.notifications}
      canSend={canSendNotifications(role)}
    />,
  );
}
