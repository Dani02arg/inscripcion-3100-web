import type { NotificationNotice } from "../../lib/notifications/types.ts";

interface NotificationNoticeProps {
  readonly notice: NotificationNotice | null;
}

/** Aviso de resultado con región viva. */
export default function NotificationNotice({
  notice,
}: NotificationNoticeProps) {
  if (!notice) {
    return null;
  }

  const toneClasses =
    notice.kind === "success"
      ? "border-estado-aprobado bg-estado-aprobado-fondo text-estado-aprobado"
      : notice.kind === "error"
        ? "border-estado-error-borde bg-estado-rechazado-fondo text-estado-rechazado"
        : "border-borde-input bg-azul-suave text-texto-principal";

  return (
    <div
      role={notice.kind === "error" ? "alert" : "status"}
      aria-live={notice.kind === "error" ? "assertive" : "polite"}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${toneClasses}`}
    >
      {notice.message}
    </div>
  );
}
