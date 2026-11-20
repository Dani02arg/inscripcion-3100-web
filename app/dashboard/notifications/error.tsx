"use client";

import Link from "next/link";

import { NotificationFiltersPlaceholder } from "../../ui/notifications/notification-states.tsx";

/** Límite de error del segmento de notificaciones. */
export default function NotificationsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="mx-auto w-[97%] md:w-[95%]">
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-texto-principal">
              Notificaciones
            </h1>
            <p className="mt-1 text-sm text-texto-secundario">
              Avisos recibidos en tu cuenta.
            </p>
          </header>

          <NotificationFiltersPlaceholder />

          <section
            role="alert"
            className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
          >
          <h1 className="text-xl font-bold text-texto-principal">
            No pudimos cargar las notificaciones
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Ocurrió un problema al preparar la bandeja. Intentá nuevamente.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
            >
              Reintentar
            </button>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
            >
              Volver al inicio
            </Link>
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}
