"use client";

import { useEffect } from "react";

import type { StudentNotice as StudentNoticeData } from "../../lib/students/types.ts";

interface StudentNoticeProps {
  readonly notice: StudentNoticeData;
  readonly onClose: () => void;
}

const SUCCESS_DURATION_MS = 4_000;

const NOTICE_CLASSES: Record<StudentNoticeData["kind"], string> = {
  success: "estado-aprobado border-current",
  error: "estado-rechazado border-current",
  info: "border-borde-input bg-fondo-app text-texto-principal",
};

/** Aviso accesible; los éxitos se ocultan a los 4 segundos y los errores no. */
export default function StudentNotice({
  notice,
  onClose,
}: StudentNoticeProps) {
  useEffect(() => {
    if (notice.kind !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(onClose, SUCCESS_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [notice.kind, notice.message, onClose]);

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-base ${NOTICE_CLASSES[notice.kind]}`}
    >
      <div
        role={notice.kind === "error" ? "alert" : "status"}
        aria-atomic="true"
        className="min-w-0 flex-1"
      >
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
