import RetryButton from "../dashboard/retry-button.tsx";

interface UserTableEmptyStateProps {
  readonly kind: "empty" | "no_results";
  readonly onClearFilters: () => void;
  readonly isPending: boolean;
  readonly listName?: "padrón" | "directorio";
}

interface UserTableErrorStateProps {
  readonly message: string;
}

const STATE_CLASSES =
  "rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm";

const SECONDARY_ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Presenta el padrón vacío o el resultado vacío de una búsqueda filtrada. */
export function UserTableEmptyState({
  kind,
  onClearFilters,
  isPending,
  listName = "padrón",
}: UserTableEmptyStateProps) {
  if (kind === "empty") {
    return (
      <section
        role="status"
        aria-live="polite"
        className={STATE_CLASSES}
      >
        <h2 className="text-xl font-bold text-texto-principal">
          {listName === "directorio"
            ? "No hay integrantes registrados en el directorio de staff."
            : "No hay usuarios registrados en el padrón."}
        </h2>
      </section>
    );
  }

  return (
    <section
      role="status"
      aria-live="polite"
      className={STATE_CLASSES}
    >
      <h2 className="text-xl font-bold text-texto-principal">
        {listName === "directorio"
          ? "No hay integrantes del staff que coincidan con los filtros."
          : "No hay usuarios que coincidan con los filtros."}
      </h2>
      <p className="mt-2 text-base text-texto-principal">
        {listName === "directorio"
          ? "Probá con otro nombre, apellido, DNI, CUIL, correo electrónico o rol."
          : "Probá con otro DNI, CUIL, nombre, apellido o correo electrónico."}
      </p>
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={onClearFilters}
          disabled={isPending}
          className={SECONDARY_ACTION_CLASSES}
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

/** Presenta el error de carga de usuarios con una acción de reintento. */
export function UserTableErrorState({
  message,
}: UserTableErrorStateProps) {
  return (
    <div className="space-y-4">
      <section
        role="alert"
        className={STATE_CLASSES}
      >
        <h1 className="text-xl font-bold text-texto-principal">
          No pudimos cargar los usuarios
        </h1>
        <p className="mt-2 text-base text-texto-principal">{message}</p>
      </section>
      <div className="flex justify-center">
        <RetryButton />
      </div>
    </div>
  );
}
