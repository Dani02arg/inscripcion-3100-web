"use client";

import Link from "next/link";

import { STAFF_LOAD_ERROR_MESSAGE } from "../../../lib/api/users.ts";
import SidebarSkeleton from "../../../ui/sidebar/sidebar-skeleton.tsx";

interface StaffDirectoryErrorProps {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}

const ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Límite del directorio con reintento y regreso al padrón. */
export default function StaffDirectoryError({
  retry,
}: StaffDirectoryErrorProps) {
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
              No pudimos cargar el directorio de staff
            </h1>
            <p className="mt-2 text-base text-texto-principal">
              {STAFF_LOAD_ERROR_MESSAGE}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={retry}
                className={`${ACTION_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`}
              >
                Reintentar
              </button>
              <Link
                href="/dashboard/users"
                className={`${ACTION_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
              >
                Volver al padrón
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
