"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { sanitizeUserReturnPath, STAFF_PATH } from "../../../lib/users/users-url.ts";
import SidebarSkeleton from "../../../ui/sidebar/sidebar-skeleton.tsx";

interface UserDetailErrorProps {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}

const ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Límite del detalle con reintento y retorno seguro al listado de origen. */
export default function UserDetailError({
  retry,
}: UserDetailErrorProps) {
  const searchParams = useSearchParams();
  const returnPath = sanitizeUserReturnPath(searchParams?.get("from"));
  const returnLabel =
    returnPath === STAFF_PATH ? "Volver al directorio" : "Volver al padrón";

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
              No pudimos cargar el detalle del usuario
            </h1>
            <p className="mt-2 text-base text-texto-principal">
              Ocurrió un problema al preparar el detalle. Intentá nuevamente.
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
                href={returnPath}
                className={`${ACTION_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
              >
                {returnLabel}
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
