"use client";

import Image from "next/image";
import Link from "next/link";

import { INSTITUTION_LOGO_PATH } from "../lib/sidebar/presentation.ts";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo-app px-3 py-10 text-texto-principal">
      <section
        role="alert"
        className="w-[97%] max-w-lg rounded-2xl border border-borde-input bg-superficie p-6 shadow-sm sm:p-8"
      >
        <Image
          src={INSTITUTION_LOGO_PATH}
          alt=""
          width={130}
          height={121}
          className="h-12 w-auto object-contain"
        />

        <h1 className="mt-4 text-2xl font-bold text-texto-principal">
          No pudimos cargar el panel principal
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
            href="/login"
            className="rounded-xl border border-borde-input bg-superficie px-6 py-3 text-center text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
