import { formatUnreadBadge } from "../../lib/notifications/labels.ts";

interface NotificationBadgeProps {
  count: number;
  collapsed: boolean;
}

/** Badge numérico de no leídas; solo el número, nunca el texto «sin leer». */
export default function NotificationBadge({
  count,
  collapsed,
}: NotificationBadgeProps) {
  const label = formatUnreadBadge(count);

  if (label === null) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={
        collapsed
          ? "absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-estado-rechazado px-1 text-xs font-bold leading-none text-superficie"
          : "ml-auto inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-estado-rechazado px-1 text-xs font-bold leading-none text-superficie"
      }
    >
      {label}
    </span>
  );
}
