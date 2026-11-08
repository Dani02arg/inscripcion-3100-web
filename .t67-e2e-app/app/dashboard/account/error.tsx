"use client";

import { USER_LOAD_ERROR_MESSAGE } from "../../lib/auth/types.ts";
import SidebarSkeleton from "../../ui/sidebar/sidebar-skeleton.tsx";

interface AccountErrorProps {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}

/** Límite de errores inesperados para Configuración de cuenta. */
export default function AccountError({
  retry,
}: AccountErrorProps) {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <section
            role="alert"
            className="mx-auto w-[97%] max-w-2xl rounded-2xl border border-borde-input bg-superficie p-6 shadow-sm md:w-[95%]"
          >
            <h1 className="text-2xl font-bold text-texto-principal">
              No pudimos cargar la configuración de tu cuenta
            </h1>
            <p className="mt-2 text-base text-texto-principal">
              {USER_LOAD_ERROR_MESSAGE}
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={retry}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
              >
                Reintentar
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
