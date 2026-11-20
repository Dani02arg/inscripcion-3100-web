import {
  buildNotificationRowLabel,
  formatNotificationDate,
  summarizeNotificationContent,
} from "../../lib/notifications/labels.ts";
import type { NotificationItem } from "../../lib/notifications/types.ts";

interface NotificationListProps {
  readonly items: readonly NotificationItem[];
  readonly onSelect: (item: NotificationItem) => void;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Listado de notificaciones con estado textual y resumen. */
export default function NotificationList({
  items,
  onSelect,
}: NotificationListProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            data-notification-id={item.id}
            aria-label={buildNotificationRowLabel(item)}
            onClick={() => {
              onSelect(item);
            }}
            className={`w-full rounded-2xl border bg-superficie p-4 text-left shadow-sm transition-colors hover:bg-superficie-hover ${FOCUS_RING} ${
              item.isRead
                ? "border-borde-input"
                : "border-azul-principal/40"
            }`}
          >
            <span className="flex flex-wrap items-start justify-between gap-2">
              <span className="flex min-w-0 items-start gap-2">
                {!item.isRead ? (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-azul-principal"
                  />
                ) : null}
                <span className="min-w-0 break-words text-base font-semibold text-texto-principal">
                  {item.title}
                </span>
              </span>

              <span className="shrink-0 text-xs font-medium text-texto-secundario">
                {formatNotificationDate(item.sentAt)}
              </span>
            </span>

            <span className="mt-1 block break-words text-sm text-texto-secundario">
              {summarizeNotificationContent(item.content)}
            </span>

            <span className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium">
              <span
                className={
                  item.isRead
                    ? "text-texto-secundario"
                    : "text-azul-institucional"
                }
              >
                {item.isRead ? "Leída" : "No leída"}
              </span>

              {item.hasAttachment ? (
                <span className="text-texto-principal">Con adjunto</span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
