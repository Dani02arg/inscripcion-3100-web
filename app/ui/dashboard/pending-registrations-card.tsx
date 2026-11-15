import Link from "next/link";

interface PendingRegistrationsCardProps {
  total: number;
}

/** Contador de solicitudes pendientes que enlaza a la pestaña «Pendientes». */
export default function PendingRegistrationsCard({
  total,
}: PendingRegistrationsCardProps) {
  return (
    <Link
      href="/dashboard/registrations?status=PENDING"
      className="block rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
    >
      <p className="text-sm font-semibold text-texto-secundario">
        Solicitudes pendientes
      </p>
      <p className="mt-1 text-3xl font-bold text-texto-principal">{total}</p>
      <p className="mt-2 text-sm text-texto-secundario">
        Ver solicitudes pendientes
      </p>
    </Link>
  );
}
