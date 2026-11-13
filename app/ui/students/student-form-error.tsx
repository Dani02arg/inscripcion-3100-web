"use client";

import Link from "next/link";

import { STUDENTS_PATH } from "../../lib/students/students-url.ts";
import SidebarSkeleton from "../sidebar/sidebar-skeleton.tsx";

interface StudentFormErrorProps {
  readonly reset: () => void;
  readonly backHref?: string;
  readonly backLabel?: string;
  readonly title?: string;
  readonly message?: string;
}

export default function StudentFormError({
  reset,
  backHref = STUDENTS_PATH,
  backLabel = "Volver a alumnos",
  title = "No pudimos cargar el formulario",
  message = "Ocurrió un problema al preparar la pantalla. Intentá nuevamente.",
}: StudentFormErrorProps) {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <section
            role="alert"
            className="mx-auto w-[97%] max-w-2xl rounded-2xl border border-borde-input bg-superficie p-6 shadow-sm md:w-[95%]"
          >
            <h1 className="text-2xl font-bold text-texto-principal">
              {title}
            </h1>
            <p className="mt-2 text-base text-texto-principal">{message}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
              >
                Reintentar
              </button>
              <Link
                href={backHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
              >
                {backLabel}
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
