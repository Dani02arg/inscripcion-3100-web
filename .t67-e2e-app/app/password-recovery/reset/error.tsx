"use client";

import Link from "next/link";

import Navbar from "../../ui/navbar";

interface ResetPasswordErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResetPasswordError({
  reset,
}: ResetPasswordErrorProps) {
  return (
    <main className="min-h-screen bg-fondo-app text-texto-principal">
      <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section
          role="alert"
          className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8"
        >
          <h1 className="text-2xl font-bold text-texto-principal">
            No pudimos cargar el cambio de contraseña
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Ocurrió un problema al preparar la pantalla. Intentá nuevamente.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
            >
              Reintentar
            </button>

            <Link
              href="/password-recovery"
              className="rounded-xl border border-borde-input bg-superficie px-6 py-3 text-center text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
            >
              Volver a solicitar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
