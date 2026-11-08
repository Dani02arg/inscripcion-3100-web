interface NotificationBellProps {
  /** Fondo oscuro para la barra compacta; fondo claro para el menú. */
  tone?: "onDark" | "onLight";
}

const TONE_CLASSES: Record<
  NonNullable<NotificationBellProps["tone"]>,
  string
> = {
  onDark:
    "text-fondo-app hover:bg-white/10 focus-visible:ring-fondo-app focus-visible:ring-offset-azul-institucional",
  onLight:
    "text-texto-principal hover:bg-fondo-app focus-visible:ring-borde-focus focus-visible:ring-offset-superficie",
};

/** Campana visual sin contador ni consulta al servicio. */
export default function NotificationBell({
  tone = "onLight",
}: NotificationBellProps) {
  return (
    <button
      type="button"
      aria-label="Notificaciones"
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${TONE_CLASSES[tone]}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </button>
  );
}
