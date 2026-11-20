interface NotificationEmptyProps {
  readonly kind: "empty" | "no_unread";
}

/** Mensajes de vacío diferenciados. */
export function NotificationEmptyState({ kind }: NotificationEmptyProps) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <p className="text-base font-semibold text-texto-principal">
        {kind === "empty"
          ? "No tenés notificaciones."
          : "No hay notificaciones sin leer."}
      </p>
      <p className="mt-1 text-sm text-texto-secundario">
        {kind === "empty"
          ? "Cuando recibas un aviso, aparecerá en esta bandeja."
          : "Las notificaciones leídas siguen disponibles en «Todas»."}
      </p>
    </div>
  );
}

interface NotificationMessageProps {
  readonly message: string;
  readonly tone?: "error" | "forbidden";
}

/** Mensaje de error o acceso denegado del módulo. */
export function NotificationMessageState({
  message,
  tone = "error",
}: NotificationMessageProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        {tone === "forbidden"
          ? "No tenés acceso a las notificaciones"
          : "No pudimos cargar las notificaciones"}
      </h1>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
    </section>
  );
}

/** Filtros visibles durante la carga o el error, con «Todas» aplicado. */
export function NotificationFiltersPlaceholder() {
  return (
    <div
      role="group"
      aria-label="Filtrar notificaciones"
      className="flex flex-wrap gap-2"
    >
      <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-azul-institucional bg-azul-institucional px-4 py-2 text-sm font-semibold text-superficie">
        Todas
      </span>
      <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2 text-sm font-semibold text-texto-principal">
        No leídas
      </span>
    </div>
  );
}

/** Esqueleto del listado. */
export function NotificationSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl border border-borde-input bg-superficie motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
