/** Estado de carga del módulo de reportes. */
export default function ReportsLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="space-y-4 motion-reduce:animate-none"
        >
          <span className="sr-only">Cargando reportes…</span>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-fondo-app" />
            <div className="rounded-2xl border border-borde-input bg-superficie p-4">
              <div className="h-5 w-1/3 rounded bg-fondo-app" />
              <div className="mt-3 h-10 w-full rounded bg-fondo-app" />
            </div>
            <div className="rounded-2xl border border-borde-input bg-superficie p-6">
              <div className="h-5 w-1/2 rounded bg-fondo-app" />
              <div className="mt-3 h-4 w-2/3 rounded bg-fondo-app" />
              <div className="mt-6 h-40 w-full rounded bg-fondo-app" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
