import Link from "next/link";

import {
  buildCardLabel,
  formatRegistrationDate,
} from "../../lib/registrations/labels.ts";
import { getStatusLabel } from "../../lib/registrations/status.ts";
import type { Registration } from "../../lib/registrations/types.ts";


interface RegistrationCardProps {
  registration: Registration;
}

/** Tarjeta resumida de una solicitud; enlaza al detalle. */
export default function RegistrationCard({
  registration,
}: RegistrationCardProps) {
  const studentName = `${registration.student.lastName}, ${registration.student.firstName}`;

  const STATUS_BADGE_STYLES: Record<string, string> = {
    PENDING: "bg-estado-pendiente-fondo text-estado-pendiente", // Fondo #fff3d6 con texto #c66b03 para contraste óptimo
    OBSERVED: "bg-azul-principal text-white",                    // Fondo #0866f5 con texto blanco
    PROPOSED_REASSIGNMENT: "bg-estado-pendiente text-white",     // Fondo #c66b03 con texto blanco
    APPROVED: "bg-estado-aprobado text-white",                   // Fondo #15803d con texto blanco
    REJECTED: "bg-estado-rechazado text-white",                  // Fondo #dc2626 con texto blanco
  };

  const DEFAULT_BADGE_STYLE = "bg-fondo-app text-texto-principal";

  return (
    <Link
      href={`/dashboard/registrations/${encodeURIComponent(registration.id)}`}
      aria-label={buildCardLabel(registration)}
      className="block rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-texto-principal">
            {studentName}
          </h2>
          <p className="text-sm text-texto-secundario">
            CUIL {registration.student.studentCuil}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE_STYLES[registration.status] ?? DEFAULT_BADGE_STYLE
            }`}
        >
          {getStatusLabel(registration.status)}
        </span>
      </div>

      <p className="mt-2 text-sm text-texto-principal">
        {registration.course.code} · Año {registration.course.year} · División{" "}
        {registration.course.division}
      </p>
      <p className="mt-1 text-sm text-texto-secundario">
        Recibida el {formatRegistrationDate(registration.created_at)}
      </p>
    </Link>
  );
}
