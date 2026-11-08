import SidebarSkeleton from "../../ui/sidebar/sidebar-skeleton.tsx";

export default function AccountLoading() {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Cargando configuración de cuenta"
            className="mx-auto w-[97%] space-y-6 md:w-[95%]"
          >
            <span className="sr-only">
              Cargando configuración de cuenta.
            </span>
            <div aria-hidden="true" className="space-y-3">
              <div className="h-8 w-64 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
              <div className="h-5 w-72 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
            </div>
            <section
              aria-hidden="true"
              className="space-y-4 rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
            >
              <div className="h-6 w-40 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                    <div className="h-5 w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
