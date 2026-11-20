import type { NotificationFilter } from "../../lib/notifications/types.ts";

interface NotificationFiltersProps {
  readonly value: NotificationFilter;
  readonly onChange: (filter: NotificationFilter) => void;
}

const FILTERS: readonly { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "No leídas" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

/** Filtros «Todas» y «No leídas». */
export default function NotificationFilters({
  value,
  onChange,
}: NotificationFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar notificaciones"
      className="flex flex-wrap gap-2"
    >
      {FILTERS.map((filter) => {
        const active = filter.value === value;

        return (
          <button
            key={filter.value}
            id={`notification-filter-${filter.value}`}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onChange(filter.value);
            }}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${FOCUS_RING} ${
              active
                ? "border-azul-institucional bg-azul-institucional text-superficie"
                : "border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
