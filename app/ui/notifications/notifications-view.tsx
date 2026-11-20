"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { markNotificationReadAction } from "../../lib/actions/notifications.ts";
import { notifyNotificationsChanged } from "../../lib/notifications/badge-events.ts";
import {
  applyNotificationRead,
  resolveCloseAfterRead,
  resolveNotificationListState,
  sortNotificationsNewestFirst,
} from "../../lib/notifications/rules.ts";
import type {
  NotificationFilter,
  NotificationItem,
  NotificationNotice,
} from "../../lib/notifications/types.ts";
import CreateNotificationDialog from "./create-notification-dialog.tsx";
import NotificationDetailDialog from "./notification-detail-dialog.tsx";
import NotificationFilters from "./notification-filters.tsx";
import NotificationList from "./notification-list.tsx";
import NotificationNoticeBanner from "./notification-notice.tsx";
import { NotificationEmptyState } from "./notification-states.tsx";
import NotificationsHeader from "./notifications-header.tsx";

interface NotificationsViewProps {
  readonly initialNotifications: readonly NotificationItem[];
  readonly canSend: boolean;
}

/** Orquestador de la bandeja, el detalle y el alta. */
export default function NotificationsView({
  initialNotifications,
  canSend,
}: NotificationsViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<readonly NotificationItem[]>(() =>
    sortNotificationsNewestFirst(initialNotifications),
  );
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<NotificationNotice | null>(null);
  const [readPending, setReadPending] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const selected =
    selectedId === null
      ? null
      : (items.find((item) => item.id === selectedId) ?? null);

  const listState = useMemo(
    () => resolveNotificationListState(items, filter),
    [items, filter],
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const closeTransientUi = (): void => {
      selectedIdRef.current = null;
      setSelectedId(null);
      setCreateOpen(false);
      setReadError(null);
    };

    window.addEventListener("popstate", closeTransientUi);

    return () => {
      window.removeEventListener("popstate", closeTransientUi);
    };
  }, []);

  const focusAfterClose = (notificationId: string | null): void => {
    window.setTimeout(() => {
      const target =
        notificationId === null
          ? null
          : document.querySelector<HTMLElement>(
              `[data-notification-id="${notificationId}"]`,
            );

      if (target) {
        target.focus();
        return;
      }

      document.getElementById("notification-filter-all")?.focus();
    }, 0);
  };

  const openDetail = (item: NotificationItem): void => {
    selectedIdRef.current = item.id;
    setSelectedId(item.id);
    setReadError(null);

    if (item.isRead) {
      return;
    }

    setReadPending(true);

    markNotificationReadAction(item.id)
      .then((result) => {
        if (result.status === "success") {
          setItems((current) =>
            applyNotificationRead(current, result.notification),
          );
          notifyNotificationsChanged();
          return;
        }

        if (selectedIdRef.current === item.id) {
          setReadError(result.message);
        }
      })
      .catch(() => {
        if (selectedIdRef.current === item.id) {
          setReadError(
            "No pudimos registrar la lectura. Intentá nuevamente.",
          );
        }
      })
      .finally(() => {
        if (selectedIdRef.current === item.id) {
          setReadPending(false);
        }
      });
  };

  const closeDetail = (): void => {
    if (!selected) {
      setSelectedId(null);
      return;
    }

    const result = resolveCloseAfterRead(items, filter, selected.id);

    selectedIdRef.current = null;
    setItems(result.items);
    setSelectedId(null);
    setReadError(null);
    setReadPending(false);
    focusAfterClose(result.nextFocusId);

    if (result.items !== items) {
      notifyNotificationsChanged();
    }
  };

  const handleCreateSuccess = (newNotice: NotificationNotice): void => {
    setCreateOpen(false);
    setNotice(newNotice);
    notifyNotificationsChanged();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <NotificationsHeader
        canSend={canSend}
        onCreate={() => {
          setNotice(null);
          setCreateOpen(true);
        }}
      />

      <NotificationNoticeBanner notice={notice} />

      <NotificationFilters
        value={filter}
        onChange={(next) => {
          setFilter(next);
        }}
      />

      {listState.kind === "empty" ? (
        <NotificationEmptyState kind="empty" />
      ) : null}

      {listState.kind === "no_unread" ? (
        <NotificationEmptyState kind="no_unread" />
      ) : null}

      {listState.kind === "ready" ? (
        <NotificationList items={listState.items} onSelect={openDetail} />
      ) : null}

      {selected ? (
        <NotificationDetailDialog
          open
          notification={selected}
          readPending={readPending}
          readError={readError}
          onClose={closeDetail}
        />
      ) : null}

      {createOpen ? (
        <CreateNotificationDialog
          onClose={() => {
            setCreateOpen(false);
          }}
          onSuccess={handleCreateSuccess}
        />
      ) : null}
    </div>
  );
}
