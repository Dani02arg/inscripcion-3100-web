/** Esqueleto accesible del directorio, sin filas ni usuarios ficticios. */
export default function StaffDirectorySkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando directorio de staff"
      className="space-y-6"
    >
      <span className="sr-only">Cargando el directorio de staff.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-56 animate-pulse rounded bg-superficie motion-reduce:animate-none" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
      </div>

      <div
        aria-hidden="true"
        className="space-y-5 rounded-2xl border border-borde-input bg-superficie p-5 shadow-sm sm:p-6"
      >
        <div className="h-5 w-40 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-fondo-app motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex min-h-28 items-center justify-center rounded-2xl border border-borde-input bg-superficie p-6 shadow-sm"
      >
        <div className="h-5 w-48 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>
    </div>
  );
}
