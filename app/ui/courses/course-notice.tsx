"use client";

import type { CourseNotice as CourseNoticeData } from "../../lib/courses/types.ts";

interface CourseNoticeProps {
  notice: CourseNoticeData;
  onClose: () => void;
}

const KIND_CLASSES: Record<CourseNoticeData["kind"], string> = {
  success: "estado-aprobado border-current",
  error: "border-estado-rechazado bg-superficie text-estado-rechazado",
  info: "border-borde-input bg-fondo-app text-texto-principal",
};

/** Aviso persistente y accesible de éxito, error o información. */
export default function CourseNotice({
  notice,
  onClose,
}: CourseNoticeProps) {
  const role = notice.kind === "error" ? "alert" : "status";

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-base ${KIND_CLASSES[notice.kind]}`}
    >
      <div role={role} aria-atomic="true" className="min-w-0 flex-1">
        <p>{notice.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Cerrar aviso: ${notice.message}`}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
