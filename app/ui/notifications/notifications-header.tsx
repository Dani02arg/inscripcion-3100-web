interface NotificationsHeaderProps {
  readonly canSend: boolean;
  readonly onCreate: () => void;
}

const PRIMARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

/** Encabezado de la bandeja con el alta reservada al staff. */
export default function NotificationsHeader({
  canSend,
  onCreate,
}: NotificationsHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-texto-principal">Notificaciones</h1>
        <p className="mt-1 text-sm text-texto-secundario">
          Avisos recibidos en tu cuenta.
        </p>
      </div>

      {canSend ? (
        <button type="button" onClick={onCreate} className={PRIMARY_CLASSES}>
          Crear notificación
        </button>
      ) : null}
    </header>
  );
}
